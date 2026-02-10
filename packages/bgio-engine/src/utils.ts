"use client";

/**
 * 魔女审判游戏引擎 - 工具函数
 *
 * 设计原则：
 * 1. 计算层（Selectors）- 从原子状态计算派生状态
 * 2. 纯函数 - 不修改输入，返回新值
 * 3. 类型安全
 */

import { nanoid } from "nanoid";
import { countBy, groupBy, mapValues } from "es-toolkit";
import type {
  BGGameState,
  PublicPlayerInfo,
  PrivatePlayerInfo,
  Card,
  CardRef,
  CardType,
  CardPoolConfig,
  VoteResult,
  DeathRecord,
  PublicDeathInfo,
  GameConfig,
  PlayerStatus,
  DeathCause,
  GamePhase,
} from "./types";

// ==================== 计算层（Selectors）====================

/**
 * 计算层 - 从原子状态计算派生状态
 * 所有函数都是纯函数，不修改输入
 */
export const Selectors = {
  // ===== 玩家相关计算 =====

  /**
   * 获取存活玩家列表（计算）
   * 从私有状态中判断（witch 也算存活）
   */
  getAlivePlayers(state: BGGameState): PublicPlayerInfo[] {
    return Object.values(state.players).filter((p) => {
      const privateStatus = state.secrets[p.id]?.status;
      return privateStatus === "alive" || privateStatus === "witch";
    });
  },

  /**
   * 获取所有玩家列表（计算）
   */
  getAllPlayers(state: BGGameState): PublicPlayerInfo[] {
    return Object.values(state.players);
  },

  /**
   * 获取存活玩家ID列表（计算）
   */
  getAlivePlayerIds(state: BGGameState): string[] {
    return this.getAlivePlayers(state).map((p) => p.id);
  },

  /**
   * 获取存活玩家数量（计算）
   */
  getAlivePlayerCount(state: BGGameState): number {
    return this.getAlivePlayers(state).length;
  },

  /**
   * 检查玩家是否存活（计算）
   * 从私有状态中判断
   */
  isPlayerAlive(state: BGGameState, playerId: string): boolean {
    const privateStatus = state.secrets[playerId]?.status;
    return privateStatus === "alive" || privateStatus === "witch";
  },

  /**
   * 获取指定玩家（公开信息）
   */
  getPlayer(
    state: BGGameState,
    playerId: string,
  ): PublicPlayerInfo | undefined {
    return state.players[playerId];
  },

  /**
   * 获取玩家的私有信息
   */
  getPlayerSecrets(
    state: BGGameState,
    playerId: string,
  ): PrivatePlayerInfo | undefined {
    return state.secrets[playerId];
  },

  /**
   * 获取玩家手牌数量（计算）
   */
  getPlayerHandCount(state: BGGameState, playerId: string): number {
    return state.secrets[playerId]?.hand.length ?? 0;
  },

  /**
   * 检查玩家是否持有魔女杀手（计算）
   */
  isWitchKillerHolder(state: BGGameState, playerId: string): boolean {
    return state.secrets[playerId]?.witchKillerHolder ?? false;
  },

  /**
   * 获取所有持有魔女杀手的玩家ID（计算）
   */
  getWitchKillerHolders(state: BGGameState): string[] {
    return Object.entries(state.secrets)
      .filter(([, secret]) => secret.witchKillerHolder)
      .map(([playerId]) => playerId);
  },

  // ===== 魔女化状态计算 =====

  /**
   * 计算玩家是否魔女化（计算）
   */
  isPlayerWitch(state: BGGameState, playerId: string): boolean {
    const secret = state.secrets[playerId];
    if (!secret) return false;
    return secret.isWitch || secret.witchKillerHolder;
  },

  /**
   * 计算玩家是否需要残骸化（计算）
   */
  shouldPlayerWreck(state: BGGameState, playerId: string): boolean {
    const secret = state.secrets[playerId];
    if (!secret) return false;
    if (!secret.isWitch) return false;
    return secret.consecutiveNoKillRounds >= 2;
  },

  // ===== 投票相关计算 =====

  /**
   * 计算投票统计（计算）
   */
  computeVoteCounts(state: BGGameState): Record<string, number> {
    return countBy(state.currentVotes, (vote) => vote.targetId);
  },

  /**
   * 计算投票结果（计算）
   */
  computeVoteResult(state: BGGameState): VoteResult {
    // 使用 groupBy 分组投票
    const votesGrouped = groupBy(state.currentVotes, (vote) => vote.targetId);

    // 转换为 voterId 列表
    const votes = mapValues(votesGrouped, (group) =>
      group.map((v) => v.voterId),
    );

    // 计算票数
    const voteCounts = mapValues(votesGrouped, (group) => group.length);

    let maxVotes = 0;
    let imprisonedId: string | null = null;
    let isTie = false;

    // 分离弃权票（投给自己）
    for (const [targetId, count] of Object.entries(voteCounts)) {
      let validVotes = count;

      // 检查是否有弃权票（投给自己）
      const selfVoteCount = state.currentVotes.filter(
        (v) => v.targetId === targetId && v.voterId === targetId,
      ).length;

      if (selfVoteCount > 0) {
        validVotes -= selfVoteCount;
      }

      if (validVotes <= 0) {
        continue;
      }

      if (validVotes > maxVotes) {
        maxVotes = validVotes;
        imprisonedId = targetId;
        isTie = false;
      } else if (validVotes === maxVotes && maxVotes > 0) {
        isTie = true;
      }
    }

    if (isTie) {
      imprisonedId = null;
    }

    return {
      round: state.round,
      votes,
      imprisonedId,
      isTie,
      voteCounts,
    };
  },

  // ===== 攻击名额计算 =====

  /**
   * 计算剩余攻击名额（计算）
   */
  computeRemainingAttackQuota(state: BGGameState): {
    witchKiller: boolean;
    killMagic: number;
  } {
    const maxKillMagic = state.attackQuota.witchKillerUsed ? 2 : 3;
    return {
      witchKiller: !state.attackQuota.witchKillerUsed,
      killMagic: maxKillMagic - state.attackQuota.killMagicUsed,
    };
  },

  // ===== 游戏结束检查 =====

  /**
   * 检查游戏是否结束（计算）
   */
  isGameOver(state: BGGameState): boolean {
    const aliveCount = this.getAlivePlayerCount(state);
    if (aliveCount <= 1) return true;
    if (state.round > state.config.maxRounds) return true;
    return false;
  },

  /**
   * 计算获胜者（计算）
   */
  computeWinner(state: BGGameState): string | null {
    const alivePlayers = this.getAlivePlayers(state);
    if (alivePlayers.length === 1) {
      return alivePlayers[0].id;
    }
    return null;
  },

  // ===== 死亡记录计算 =====

  /**
   * 获取公开死亡信息（过滤敏感信息）
   */
  getPublicDeathInfo(state: BGGameState): PublicDeathInfo[] {
    return state.deathLog.map((record) => ({
      round: record.round,
      playerId: record.playerId,
      died: true,
    }));
  },

  // ===== 卡牌相关计算 =====

  /**
   * 获取玩家可使用的手牌（计算）
   */
  getUsableCards(state: BGGameState, playerId: string): CardRef[] {
    const secret = state.secrets[playerId];
    if (!secret) return [];

    if (secret.witchKillerHolder) {
      return secret.hand.filter((c) => c.type === "witch_killer");
    }

    return secret.hand;
  },

  /**
   * 获取手牌完整信息（计算）
   */
  getHandDetails(state: BGGameState, playerId: string): Card[] {
    const secret = state.secrets[playerId];
    if (!secret) return [];
    return secret.hand.map((cardRef) => getCardDefinition(cardRef));
  },

  /**
   * 检查玩家是否有结界（计算）
   */
  hasPlayerBarrier(state: BGGameState, playerId: string): boolean {
    return state.secrets[playerId]?.hasBarrier || false;
  },

  /**
   * 检查玩家是否已投票（计算）
   */
  hasPlayerVoted(state: BGGameState, playerId: string): boolean {
    return state.currentVotes.some((v) => v.voterId === playerId);
  },

  /**
   * 检查玩家本回合是否已行动（计算）
   */
  hasPlayerActed(state: BGGameState, playerId: string): boolean {
    return (
      !!state.currentActions[playerId] || this.hasPlayerVoted(state, playerId)
    );
  },
};

// ==================== 状态修改（Mutations）====================

/**
 * 状态修改 - 用于移动函数中的状态更新
 * 这些函数会修改传入的状态对象
 */
export const Mutations = {
  /**
   * 向手牌添加卡牌
   */
  addCardToHand(state: BGGameState, playerId: string, card: CardRef): void {
    const secret = state.secrets[playerId];
    if (!secret) return;

    secret.hand.push(card);
  },

  /**
   * 击杀玩家
   * 返回死亡记录和遗落的手牌（需要后续分配）
   */
  killPlayer(
    state: BGGameState,
    playerId: string,
    cause: DeathCause,
    killerId?: string,
    randomNumber?: () => number,
  ): { record: DeathRecord; droppedCards: CardRef[] } | null {
    const player = state.players[playerId];
    const secret = state.secrets[playerId];
    if (!player || !secret) return null;

    const droppedCards = [...secret.hand];

    // 更新私有状态
    secret.status = cause === "wreck" ? "wreck" : "dead";
    secret.hand = [];
    secret.hasBarrier = false;
    secret.deathCause = cause;
    secret.killerId = killerId;

    // 更新公开状态（wreck 显示为 dead）
    player.status = "dead";

    const hadWitchKiller = secret.witchKillerHolder;
    secret.witchKillerHolder = false;

    const record: DeathRecord = {
      round: state.round,
      playerId,
      cause,
      killerId,
      droppedCards,
    };

    state.deathLog.push(record);

    // 处理魔女杀手转移
    if (hadWitchKiller) {
      if (cause === "wreck") {
        // 残骸化：随机分配给存活玩家
        const alivePlayers = Selectors.getAlivePlayers(state);
        if (alivePlayers.length > 0) {
          const randomIndex = Math.floor(
            (randomNumber || Math.random)() * alivePlayers.length,
          );
          const receiverId = alivePlayers[randomIndex].id;
          state.secrets[receiverId].witchKillerHolder = true;
          state.secrets[receiverId].isWitch = true;
          // 公开状态保持 alive，witch 状态只存储在私有信息中
          const witchKillerCard = droppedCards.find(
            (c) => c.type === "witch_killer",
          );
          if (witchKillerCard) {
            state.secrets[receiverId].hand.push(witchKillerCard);
            const index = droppedCards.findIndex(
              (c) => c.id === witchKillerCard.id,
            );
            if (index > -1) droppedCards.splice(index, 1);
          }
        }
      } else if (killerId && cause === "kill_magic") {
        state.secrets[killerId].witchKillerHolder = true;
        const witchKillerCard = droppedCards.find(
          (c) => c.type === "witch_killer",
        );
        if (witchKillerCard) {
          state.secrets[killerId].hand.push(witchKillerCard);
          const index = droppedCards.findIndex(
            (c) => c.id === witchKillerCard.id,
          );
          if (index > -1) droppedCards.splice(index, 1);
        }
      }
    }

    return { record, droppedCards };
  },

  /**
   * 添加揭示信息
   */
  addRevealedInfo(
    state: BGGameState,
    playerId: string,
    type: string,
    content: unknown,
  ): void {
    const secret = state.secrets[playerId];
    if (!secret) return;

    secret.revealedInfo.push({
      type: type as any,
      content,
      timestamp: Date.now(),
    });
  },
};

// ==================== 卡牌定义表 ====================

const CARD_DEFINITIONS: Record<CardType, Omit<Card, "id" | "type">> = {
  witch_killer: {
    name: "魔女杀手",
    description: "对目标发动攻击（优先度最高），持有者魔女化",
    icon: "⚔️",
    consumable: false,
    priority: 100,
  },
  barrier: {
    name: "结界魔法",
    description: "保护自身当夜免受攻击",
    icon: "🛡️",
    consumable: true,
    priority: 50,
  },
  kill: {
    name: "杀人魔法",
    description: "对目标发动攻击，成功击杀后魔女化",
    icon: "🔪",
    consumable: true,
    priority: 80,
  },
  detect: {
    name: "探知魔法",
    description: "探知目标手牌总数并随机获悉其中一张",
    icon: "🔍",
    consumable: true,
    priority: 90,
  },
  check: {
    name: "检定魔法",
    description: "查验已死亡玩家的死因",
    icon: "🔬",
    consumable: true,
    priority: 10,
  },
};

// ==================== 卡牌工厂 ====================

export function createCard(type: CardType): CardRef {
  return {
    id: nanoid(),
    type,
  };
}

export function getCardDefinition(cardRef: CardRef): Card {
  const def = CARD_DEFINITIONS[cardRef.type];
  return {
    id: cardRef.id,
    type: cardRef.type,
    ...def,
  };
}

export function getCardDefinitionByType(type: CardType): Omit<Card, "id"> {
  const def = CARD_DEFINITIONS[type];
  return {
    type,
    ...def,
  };
}

export function createDeck(
  config: CardPoolConfig,
  shuffle: <T>(array: T[]) => T[],
): CardRef[] {
  const deck: CardRef[] = [];

  for (const [type, count] of Object.entries(config)) {
    for (let i = 0; i < count; i++) {
      deck.push(createCard(type as CardType));
    }
  }

  // 使用 boardgame.io 的 shuffle 确保可回溯
  return shuffle(deck);
}

// ==================== UI 工具 ====================

export function getCardTypeName(type: CardType): string {
  return CARD_DEFINITIONS[type]?.name || "未知卡牌";
}

export function getCardTypeDescription(type: CardType): string {
  return CARD_DEFINITIONS[type]?.description || "";
}

export function getCardIcon(type: CardType): string {
  return CARD_DEFINITIONS[type]?.icon || "🃏";
}

const PHASE_DEFINITIONS: Record<
  GamePhase,
  { name: string; description: string; color: string }
> = {
  lobby: {
    name: "等待加入",
    description: "等待更多玩家加入游戏",
    color: "default",
  },
  setup: {
    name: "游戏准备",
    description: "正在初始化游戏...",
    color: "processing",
  },
  morning: {
    name: "晨间",
    description: "公布夜间发生的死亡信息",
    color: "orange",
  },
  day: { name: "日间", description: "自由讨论和交易时间", color: "blue" },
  night: { name: "夜间", description: "使用手牌进行暗中行动", color: "purple" },
  voting: { name: "投票", description: "投票决定监禁对象", color: "warning" },
  resolution: { name: "结算", description: "结算所有行动结果", color: "cyan" },
  ended: { name: "游戏结束", description: "游戏已结束", color: "success" },
};

export function getPhaseName(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.name || "未知阶段";
}

export function getPhaseDescription(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.description || "";
}

export function getPhaseColor(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.color || "default";
}

const PLAYER_STATUS_DEFINITIONS: Record<
  PlayerStatus,
  { name: string; color: string }
> = {
  alive: { name: "存活", color: "#52c41a" },
  dead: { name: "死亡", color: "#8c8c8c" },
  witch: { name: "魔女化", color: "#722ed1" },
  wreck: { name: "残骸化", color: "#f5222d" },
};

export function getPlayerStatusName(status: PlayerStatus): string {
  return PLAYER_STATUS_DEFINITIONS[status]?.name || "未知";
}

export function getPlayerStatusColor(status: PlayerStatus): string {
  return PLAYER_STATUS_DEFINITIONS[status]?.color || "#000000";
}

const DEATH_CAUSE_NAMES: Record<DeathCause, string> = {
  witch_killer: "被魔女杀手击杀",
  kill_magic: "被杀人魔法击杀",
  wreck: "残骸化死亡",
};

export function getDeathCauseName(cause: DeathCause): string {
  return DEATH_CAUSE_NAMES[cause] || "未知死因";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
