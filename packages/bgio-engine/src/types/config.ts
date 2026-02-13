"use client";

/**
 * 游戏配置类型定义
 */

/**
 * 游戏配置
 */
export interface GameConfig {
  /** 最大玩家数量 */
  maxPlayers: number;
  /** 最大游戏回合数 */
  maxRounds: number;
  /** 日间阶段持续时间（秒） */
  dayDuration: number;
  /** 深夜阶段持续时间（秒） */
  nightDuration: number;
  /** 夜间阶段持续时间（秒） */
  votingDuration: number;
  /** 卡牌池初始配置 */
  cardPool: {
    witch_killer: number;
    barrier: number;
    kill: number;
    detect: number;
    check: number;
  };
  /** 手牌上限（新增） */
  maxHandSize: number;
  /** 投票最低参与率（新增） */
  minVoteParticipationRate: number;
  /** 卡牌选择阶段持续时间（秒）（新增） */
  cardSelectionDuration: number;
}

// 七人局配置
export const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 15,
    kill: 3,
    detect: 5,
    check: 4,
  },
  maxHandSize: 4,
  minVoteParticipationRate: 0.5,
  cardSelectionDuration: 5,
};

// 八人局配置
export const EIGHT_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 8,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 18,
    kill: 4,
    detect: 5,
    check: 4,
  },
  maxHandSize: 4,
  minVoteParticipationRate: 0.5,
  cardSelectionDuration: 5,
};

// 九人局配置
export const NINE_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 9,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 20,
    kill: 5,
    detect: 6,
    check: 4,
  },
  maxHandSize: 4,
  minVoteParticipationRate: 0.5,
  cardSelectionDuration: 5,
};
