/**
 * 魔女审判游戏引擎 - 行动处理系统
 * 负责处理玩家的各种行动（使用卡牌、投票、放弃）
 */

import { nanoid } from "nanoid";
import {
  GameState,
  GamePhase,
  PlayerAction,
  ActionType,
  CardType,
  GameError,
  GameErrorCode,
  Vote,
} from "../types";
import {
  recordAction,
  hasPlayerActed,
  getRemainingAttackQuota,
  recordVote,
  hasPlayerVoted,
  getPlayer,
} from "../state";
import { validateCardUsage, findCardInHand } from "../cards";
import { canAct, isAlive } from "../player";

// ==================== 行动验证结果 ====================

export interface ValidationResult {
  valid: boolean;
  error?: GameError;
}

// ==================== 使用卡牌 ====================

export interface UseCardParams {
  playerId: string;
  cardId: string;
  targetId?: string;
}

/**
 * 验证使用卡牌行动
 */
export function validateUseCard(
  state: GameState,
  params: UseCardParams,
): ValidationResult {
  const { playerId, cardId, targetId } = params;

  // 1. 检查游戏阶段
  if (state.status !== GamePhase.NIGHT) {
    return {
      valid: false,
      error: new GameError(
        GameErrorCode.INVALID_PHASE,
        "只能在夜间阶段使用卡牌",
      ),
    };
  }

  // 2. 检查玩家是否存在且存活
  const player = state.players.get(playerId);
  if (!player) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_TARGET, "玩家不存在"),
    };
  }

  if (!isAlive(player)) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.PLAYER_ALREADY_DEAD, "玩家已死亡"),
    };
  }

  // 3. 检查是否被监禁（投票在当前回合的夜间之前已完成）
  const currentVote = state.voteHistory[state.voteHistory.length - 1];
  if (
    currentVote &&
    currentVote.round === state.round &&
    currentVote.imprisonedId === playerId
  ) {
    return {
      valid: false,
      error: new GameError(
        GameErrorCode.INVALID_ACTION,
        "被监禁的玩家无法使用手牌",
      ),
    };
  }

  // 4. 检查是否已行动
  if (hasPlayerActed(state, playerId)) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_ACTION, "本回合已行动"),
    };
  }

  // 5. 检查卡牌是否在手牌中
  const card = findCardInHand(player.hand, cardId);
  if (!card) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.CARD_NOT_FOUND, "卡牌不在手牌中"),
    };
  }

  // 6. 检查持有魔女杀手的限制
  try {
    validateCardUsage(card, player, true);
  } catch (error) {
    if (error instanceof GameError) {
      return { valid: false, error };
    }
    throw error;
  }

  // 7. 检查目标
  if (targetId) {
    const target = state.players.get(targetId);
    if (!target) {
      return {
        valid: false,
        error: new GameError(GameErrorCode.INVALID_TARGET, "目标玩家不存在"),
      };
    }

    // 攻击类卡牌的目标必须存活
    if (card.type === CardType.WITCH_KILLER || card.type === CardType.KILL) {
      if (!isAlive(target)) {
        return {
          valid: false,
          error: new GameError(GameErrorCode.INVALID_TARGET, "目标玩家已死亡"),
        };
      }

      // 不能攻击自己
      if (targetId === playerId) {
        return {
          valid: false,
          error: new GameError(GameErrorCode.INVALID_TARGET, "不能攻击自己"),
        };
      }

      // 检查攻击名额
      const quota = getRemainingAttackQuota(state);
      if (card.type === CardType.WITCH_KILLER && !quota.witchKiller) {
        return {
          valid: false,
          error: new GameError(
            GameErrorCode.ATTACK_QUOTA_FULL,
            "魔女杀手攻击名额已被使用",
          ),
        };
      }
      if (card.type === CardType.KILL && quota.killMagic <= 0) {
        return {
          valid: false,
          error: new GameError(
            GameErrorCode.ATTACK_QUOTA_FULL,
            "杀人魔法攻击名额已满",
          ),
        };
      }
    }

    // 检定魔法的目标必须已死亡
    if (card.type === CardType.CHECK) {
      if (isAlive(target)) {
        return {
          valid: false,
          error: new GameError(
            GameErrorCode.INVALID_TARGET,
            "检定魔法只能对已死亡玩家使用",
          ),
        };
      }
    }

    // 探知魔法的目标必须存活
    if (card.type === CardType.DETECT) {
      if (!isAlive(target)) {
        return {
          valid: false,
          error: new GameError(
            GameErrorCode.INVALID_TARGET,
            "探知魔法只能对存活玩家使用",
          ),
        };
      }
    }
  } else {
    // 需要目标的卡牌
    if (card.type !== CardType.BARRIER) {
      return {
        valid: false,
        error: new GameError(
          GameErrorCode.INVALID_TARGET,
          "该卡牌需要指定目标",
        ),
      };
    }
  }

  return { valid: true };
}

/**
 * 处理使用卡牌行动
 */
export function handleUseCard(
  state: GameState,
  params: UseCardParams,
): PlayerAction {
  const validation = validateUseCard(state, params);
  if (!validation.valid) {
    throw validation.error;
  }

  const { playerId, cardId, targetId } = params;
  const player = state.players.get(playerId)!;
  const card = findCardInHand(player.hand, cardId)!;

  // 如果是消耗性卡牌，从手牌中移除
  if (card.consumable) {
    const index = player.hand.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      const [removed] = player.hand.splice(index, 1);
      state.discardPile.push(removed);
    }
  }

  // 创建行动记录
  const action: PlayerAction = {
    id: nanoid(),
    playerId,
    type: ActionType.USE_CARD,
    round: state.round,
    phase: state.status,
    cardId,
    cardType: card.type,
    targetId,
    timestamp: Date.now(),
  };

  recordAction(state, action);
  return action;
}

// ==================== 投票 ====================

export interface VoteParams {
  voterId: string;
  targetId: string;
}

/**
 * 验证投票
 */
export function validateVote(
  state: GameState,
  params: VoteParams,
): ValidationResult {
  const { voterId, targetId } = params;

  // 1. 检查游戏阶段
  if (state.status !== GamePhase.VOTING) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_PHASE, "只能在投票阶段投票"),
    };
  }

  // 2. 检查投票者是否存在且存活
  const voter = state.players.get(voterId);
  if (!voter) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_TARGET, "投票者不存在"),
    };
  }

  if (!isAlive(voter)) {
    return {
      valid: false,
      error: new GameError(
        GameErrorCode.PLAYER_ALREADY_DEAD,
        "死亡玩家无法投票",
      ),
    };
  }

  // 3. 检查目标是否存在且存活
  const target = state.players.get(targetId);
  if (!target) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_TARGET, "目标玩家不存在"),
    };
  }

  if (!isAlive(target)) {
    return {
      valid: false,
      error: new GameError(
        GameErrorCode.INVALID_TARGET,
        "不能投票给已死亡玩家",
      ),
    };
  }

  // 4. 检查是否已投票
  if (hasPlayerVoted(state, voterId)) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.ALREADY_VOTED, "本回合已投票"),
    };
  }

  return { valid: true };
}

/**
 * 处理投票
 */
export function handleVote(state: GameState, params: VoteParams): Vote {
  const validation = validateVote(state, params);
  if (!validation.valid) {
    throw validation.error;
  }

  const { voterId, targetId } = params;

  const vote: Vote = {
    voterId,
    targetId,
    round: state.round,
    timestamp: Date.now(),
  };

  recordVote(state, vote);
  return vote;
}

// ==================== 放弃行动 ====================

export interface PassParams {
  playerId: string;
}

/**
 * 验证放弃行动
 */
export function validatePass(
  state: GameState,
  params: PassParams,
): ValidationResult {
  const { playerId } = params;

  // 1. 检查游戏阶段
  if (state.status !== GamePhase.NIGHT && state.status !== GamePhase.VOTING) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_PHASE, "只能在行动阶段放弃"),
    };
  }

  // 2. 检查玩家是否存在且存活
  const player = state.players.get(playerId);
  if (!player) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_TARGET, "玩家不存在"),
    };
  }

  if (!isAlive(player)) {
    return {
      valid: false,
      error: new GameError(
        GameErrorCode.PLAYER_ALREADY_DEAD,
        "死亡玩家无需放弃",
      ),
    };
  }

  // 3. 检查是否已行动/投票
  if (state.status === GamePhase.NIGHT && hasPlayerActed(state, playerId)) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.INVALID_ACTION, "本回合已行动"),
    };
  }

  if (state.status === GamePhase.VOTING && hasPlayerVoted(state, playerId)) {
    return {
      valid: false,
      error: new GameError(GameErrorCode.ALREADY_VOTED, "本回合已投票"),
    };
  }

  return { valid: true };
}

/**
 * 处理放弃行动
 */
export function handlePass(state: GameState, params: PassParams): PlayerAction {
  const validation = validatePass(state, params);
  if (!validation.valid) {
    throw validation.error;
  }

  const { playerId } = params;

  const action: PlayerAction = {
    id: nanoid(),
    playerId,
    type: ActionType.PASS,
    round: state.round,
    phase: state.status,
    timestamp: Date.now(),
  };

  recordAction(state, action);
  return action;
}

// ==================== 快捷操作 ====================

/**
 * 执行行动（自动判断类型）
 */
export function executeAction(
  state: GameState,
  params: {
    playerId: string;
    type: ActionType;
    cardId?: string;
    targetId?: string;
  },
): PlayerAction | Vote {
  const { type } = params;

  switch (type) {
    case ActionType.USE_CARD:
      if (!params.cardId) {
        throw new GameError(
          GameErrorCode.INVALID_ACTION,
          "使用卡牌需要提供cardId",
        );
      }
      return handleUseCard(state, {
        playerId: params.playerId,
        cardId: params.cardId,
        targetId: params.targetId,
      });

    case ActionType.VOTE:
      if (!params.targetId) {
        throw new GameError(
          GameErrorCode.INVALID_ACTION,
          "投票需要提供targetId",
        );
      }
      return handleVote(state, {
        voterId: params.playerId,
        targetId: params.targetId,
      });

    case ActionType.PASS:
      return handlePass(state, {
        playerId: params.playerId,
      });

    default:
      throw new GameError(GameErrorCode.INVALID_ACTION, "未知的行动类型");
  }
}

// ==================== 批量操作 ====================

/**
 * 批量处理放弃（用于时间到时自动处理）
 */
export function autoPassForInactivePlayers(state: GameState): PlayerAction[] {
  const actions: PlayerAction[] = [];

  if (state.status === GamePhase.NIGHT) {
    // 夜间阶段：为未行动的玩家自动放弃
    for (const [playerId, player] of state.players) {
      if (isAlive(player) && !hasPlayerActed(state, playerId)) {
        try {
          const action = handlePass(state, { playerId });
          actions.push(action);
        } catch {
          // 忽略错误（可能被监禁等情况）
        }
      }
    }
  } else if (state.status === GamePhase.VOTING) {
    // 投票阶段：为未投票的玩家自动弃权
    for (const [playerId, player] of state.players) {
      if (isAlive(player) && !hasPlayerVoted(state, playerId)) {
        try {
          // 投票阶段不能简单放弃，需要投弃权票
          // 这里可以投给一个特殊值，或者在计算时处理未投票的情况
          const action = handlePass(state, { playerId });
          actions.push(action);
        } catch {
          // 忽略错误
        }
      }
    }
  }

  return actions;
}
