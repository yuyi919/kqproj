"use client";

/**
 * 魔女审判游戏引擎 - React Hook
 *
 * 提供更便捷的游戏状态访问和操作
 * 使用计算层（Selectors）获取派生状态
 */

import { useCallback, useMemo } from "react";
import type { BoardProps } from "boardgame.io/react";
import type {
  BGGameState,
  Card,
  CardRef,
  PrivatePlayerInfo,
  CardType,
} from "../types";
import { Selectors } from "../utils";

export interface UseWitchTrialReturn {
  // 游戏状态
  gameState: BGGameState;
  round: number;
  phase: string;

  // 玩家信息
  playerID: string | null;
  myPlayer: BGGameState["players"][string] | undefined;
  mySecrets: PrivatePlayerInfo | undefined;
  isAlive: boolean;
  isWitch: boolean;
  hasBarrier: boolean;

  // 玩家列表
  allPlayers: BGGameState["players"][string][];
  alivePlayers: BGGameState["players"][string][];
  deadPlayers: BGGameState["players"][string][];

  // 行动状态
  hasActed: boolean;
  hasVoted: boolean;
  isImprisoned: boolean;

  // 攻击名额
  attackQuota: {
    witchKillerAvailable: boolean;
    killMagicAvailable: number;
    maxKillMagic: number;
  };

  // 操作函数
  useCard: (cardId: string, targetId?: string) => void;
  vote: (targetId: string) => void;
  pass: () => void;
  endDay: () => void;

  // 工具函数
  getCardByType: (type: CardType) => CardRef | undefined;
  hasCardType: (type: CardType) => boolean;
  canUseCard: (card: Card) => boolean;
}

export function useWitchTrial(
  props: BoardProps<BGGameState>,
): UseWitchTrialReturn {
  const { G, ctx, moves, playerID } = props;

  // 当前玩家信息
  const myPlayer = useMemo(() => {
    return playerID ? G.players[playerID] : undefined;
  }, [G.players, playerID]);

  const mySecrets = useMemo(() => {
    return playerID ? G.secrets[playerID] : undefined;
  }, [G.secrets, playerID]);

  // 玩家状态（使用计算层）
  const isAlive = useMemo(() => {
    if (!playerID) return false;
    return Selectors.isPlayerAlive(G, playerID);
  }, [G, playerID]);

  const isWitch = useMemo(() => {
    if (!playerID) return false;
    return Selectors.isPlayerWitch(G, playerID);
  }, [G, playerID]);

  const hasBarrier = useMemo(() => {
    if (!playerID) return false;
    return Selectors.hasPlayerBarrier(G, playerID);
  }, [G, playerID]);

  // 玩家列表（使用计算层）
  const allPlayers = useMemo(() => {
    return Object.values(G.players).sort((a, b) => a.seatNumber - b.seatNumber);
  }, [G.players]);

  const alivePlayers = useMemo(() => {
    return Selectors.getAlivePlayers(G);
  }, [G]);

  const deadPlayers = useMemo(() => {
    // 从私有状态判断死亡（dead 或 wreck）
    return allPlayers.filter((p) => {
      const privateStatus = G.secrets[p.id]?.status;
      return privateStatus === "dead" || privateStatus === "wreck";
    });
  }, [allPlayers, G.secrets]);

  // 行动状态（使用计算层）
  const hasActed = useMemo(() => {
    if (!playerID) return false;
    return Selectors.hasPlayerActed(G, playerID);
  }, [G, playerID]);

  const hasVoted = useMemo(() => {
    if (!playerID) return false;
    return Selectors.hasPlayerVoted(G, playerID);
  }, [G, playerID]);

  const isImprisoned = useMemo(() => {
    return G.imprisonedId === playerID;
  }, [G.imprisonedId, playerID]);

  // 攻击名额（使用计算层）
  const attackQuota = useMemo(() => {
    const remaining = Selectors.computeRemainingAttackQuota(G);
    return {
      witchKillerAvailable: remaining.witchKiller,
      killMagicAvailable: remaining.killMagic,
      maxKillMagic: remaining.witchKiller ? 3 : 2,
    };
  }, [G]);

  // 操作函数
  const useCard = useCallback(
    (cardId: string, targetId?: string) => {
      moves.useCard?.(cardId, targetId);
    },
    [moves],
  );

  const vote = useCallback(
    (targetId: string) => {
      moves.vote?.(targetId);
    },
    [moves],
  );

  const pass = useCallback(() => {
    moves.pass?.();
  }, [moves]);

  const endDay = useCallback(() => {
    moves.endDay?.();
  }, [moves]);

  // 工具函数
  const getCardByType = useCallback(
    (type: CardType): CardRef | undefined => {
      return mySecrets?.hand.find((c) => c.type === type);
    },
    [mySecrets],
  );

  const hasCardType = useCallback(
    (type: CardType): boolean => {
      return mySecrets?.hand.some((c) => c.type === type) || false;
    },
    [mySecrets],
  );

  const canUseCard = useCallback(
    (card: Card): boolean => {
      // 持有魔女杀手时只能使用魔女杀手
      const hasWitchKiller = hasCardType("witch_killer");
      if (hasWitchKiller && card.type !== "witch_killer") {
        return false;
      }

      // 检查攻击名额
      if (card.type === "witch_killer" && !attackQuota.witchKillerAvailable) {
        return false;
      }
      if (card.type === "kill" && attackQuota.killMagicAvailable <= 0) {
        return false;
      }

      return true;
    },
    [hasCardType, attackQuota],
  );

  return {
    gameState: G,
    round: G.round,
    phase: G.status,

    playerID,
    myPlayer,
    mySecrets,
    isAlive,
    isWitch,
    hasBarrier,

    allPlayers,
    alivePlayers,
    deadPlayers,

    hasActed,
    hasVoted,
    isImprisoned,

    attackQuota,

    useCard,
    vote,
    pass,
    endDay,

    getCardByType,
    hasCardType,
    canUseCard,
  };
}
