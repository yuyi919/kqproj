"use client";

/**
 * PlayerStateService - 玩家状态服务
 *
 * 职责：
 * 1. 提供玩家状态查询（公开信息 / 私密信息）
 * 2. 处理玩家死亡与魔女杀手归属转移
 * 3. 通过 GameStateRef 在 Effect 体系内安全读写状态
 */

import { Effect } from "effect";
import { Selectors } from "../../domain/queries";
import type {
  BGGameState,
  CardRef,
  DeathCause,
  DeathRecord,
  PrivatePlayerInfo,
  PublicPlayerInfo,
} from "../../types";
import { GameRandom } from "../context/gameRandom";
import { GameStateRef } from "../context/gameStateRef";
import { PlayerNotAliveError, PlayerNotFoundError } from "../errors";
import { MessageService } from "./messageService";

/**
 * killPlayer 入参。
 * 使用联合类型明确不同死因需要的字段，避免外部先传分散参数再做内部转换。
 */
export type KillPlayerInput =
  | {
      readonly playerId: string;
      readonly cause: "kill_magic" | "witch_killer";
      readonly killerId: string;
    }
  | {
      readonly playerId: string;
      readonly cause: "wreck";
      readonly killerId?: string;
    };

/**
 * 玩家状态服务接口
 */
export interface IPlayerStateService {
  /** 获取玩家公开信息 */
  readonly getPlayer: (
    playerId: string,
  ) => Effect.Effect<PublicPlayerInfo, PlayerNotFoundError>;

  /** 获取玩家私密信息 */
  readonly getPlayerSecrets: (
    playerId: string,
  ) => Effect.Effect<PrivatePlayerInfo, PlayerNotFoundError>;

  /** 检查玩家是否存活 */
  readonly isAlive: (
    playerId: string,
  ) => Effect.Effect<boolean, PlayerNotFoundError>;

  /** 检查玩家是否被囚禁 */
  readonly isImprisoned: (
    playerId: string,
  ) => Effect.Effect<boolean, PlayerNotFoundError>;

  /** 获取存活玩家列表 */
  readonly getAlivePlayers: () => Effect.Effect<PublicPlayerInfo[]>;

  /** 获取玩家手牌 */
  readonly getHand: (
    playerId: string,
  ) => Effect.Effect<CardRef[], PlayerNotFoundError>;

  /** 检查玩家是否持有魔女杀手 */
  readonly isWitchKillerHolder: (
    playerId: string,
  ) => Effect.Effect<boolean, PlayerNotFoundError>;

  /** 获取玩家手牌数量 */
  readonly getHandCount: (
    playerId: string,
  ) => Effect.Effect<number, PlayerNotFoundError>;

  /** 检查玩家是否有结界 */
  readonly hasBarrier: (
    playerId: string,
  ) => Effect.Effect<boolean, PlayerNotFoundError>;

  /** 获取玩家连续未击杀回合数 */
  readonly getConsecutiveNoKillRounds: (
    playerId: string,
  ) => Effect.Effect<number, PlayerNotFoundError>;

  /** 击杀玩家，返回死亡记录与遗落手牌 */
  readonly killPlayer: (input: KillPlayerInput) => Effect.Effect<
    {
      /** 死亡记录 */
      record: DeathRecord;
      /** 遗落手牌 */
      droppedCards: CardRef[];
      /** 是否持有魔女杀手 */
      hadWitchKiller: boolean;
    },
    PlayerNotFoundError | PlayerNotAliveError
  >;

  /** 递增玩家连续未击杀回合数 */
  readonly incrementConsecutiveNoKillRounds: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 设置玩家为 witch 状态 */
  readonly setWitch: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 清除玩家 barrier */
  readonly clearBarrier: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;
}

function requirePlayer(
  state: BGGameState,
  playerId: string,
): Effect.Effect<PublicPlayerInfo, PlayerNotFoundError> {
  return Effect.gen(function* () {
    if (!Object.hasOwn(state.players, playerId)) {
      return yield* new PlayerNotFoundError({ playerId });
    }
    return state.players[playerId];
  });
}

function requireSecret(
  state: BGGameState,
  playerId: string,
): Effect.Effect<PrivatePlayerInfo, PlayerNotFoundError> {
  return Effect.gen(function* () {
    if (!Object.hasOwn(state.secrets, playerId)) {
      return yield* new PlayerNotFoundError({ playerId });
    }
    return state.secrets[playerId];
  });
}

function requirePlayerAndSecret(
  state: BGGameState,
  playerId: string,
): Effect.Effect<
  { player: PublicPlayerInfo; secret: PrivatePlayerInfo },
  PlayerNotFoundError
> {
  return Effect.all({
    player: requirePlayer(state, playerId),
    secret: requireSecret(state, playerId),
  });
}

/**
 * PlayerStateService Live Layer
 */
export class PlayerStateService extends Effect.Service<PlayerStateService>()(
  "PlayerStateService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const gameStateRef = yield* GameStateRef;
      const messageService = yield* MessageService;
      const gameRandom = yield* GameRandom;
      const withState = <A, E, R>(
        f: (state: BGGameState) => Effect.Effect<A, E, R>,
      ): Effect.Effect<A, E, R> => Effect.flatMap(gameStateRef.get(), f);

      return {
        getPlayer: (playerId) =>
          withState((state) => requirePlayer(state, playerId)),

        getPlayerSecrets: (playerId) =>
          withState((state) => requireSecret(state, playerId)),

        isAlive: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requireSecret(state, playerId);
              return Selectors.isPlayerAlive(state, playerId);
            }),
          ),

        isImprisoned: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requirePlayer(state, playerId);
              return Selectors.isPlayerImprisoned(state, playerId);
            }),
          ),

        getAlivePlayers: () =>
          withState((state) =>
            Effect.succeed(Selectors.getAlivePlayers(state)),
          ),

        getHand: (playerId) =>
          withState((state) =>
            Effect.map(requireSecret(state, playerId), (secret) => secret.hand),
          ),

        isWitchKillerHolder: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requireSecret(state, playerId);
              return Selectors.isWitchKillerHolder(state, playerId);
            }),
          ),

        getHandCount: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requireSecret(state, playerId);
              return Selectors.getPlayerHandCount(state, playerId);
            }),
          ),

        hasBarrier: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requireSecret(state, playerId);
              return Selectors.hasPlayerBarrier(state, playerId);
            }),
          ),

        getConsecutiveNoKillRounds: (playerId) =>
          withState((state) =>
            Effect.map(
              requireSecret(state, playerId),
              (secret) => secret.consecutiveNoKillRounds,
            ),
          ),

        killPlayer: (input) =>
          withState((state) =>
            Effect.gen(function* () {
              const playerId = input.playerId;
              const cause: DeathCause = input.cause;
              const killerId = input.killerId;
              const { player, secret } = yield* requirePlayerAndSecret(
                state,
                playerId,
              );

              if (!Selectors.isPlayerAlive(state, playerId)) {
                return yield* new PlayerNotAliveError({
                  playerId,
                  status: secret.status,
                });
              }

              const droppedCards = [...secret.hand];

              secret.status = cause === "wreck" ? "wreck" : "dead";
              secret.hand = [];
              secret.hasBarrier = false;
              secret.deathCause = cause;
              secret.killerId = killerId;

              player.status = "dead";

              const hadWitchKiller = secret.witchKillerHolder;
              secret.witchKillerHolder = false;

              const record: DeathRecord = {
                round: state.round,
                playerId,
                cause,
                killerId,
                droppedCards,
                cardReceivers: {},
              };

              state.deathLog.push(record);

              if (hadWitchKiller) {
                // 规则：持有者死亡时，魔女杀手不能遗失，必须按规则转移
                let receiverId: string | null = null;
                let transferMode: "active" | "passive" | null = null;
                let transferReason:
                  | "kill_magic"
                  | "wreck_killer"
                  | "wreck_random"
                  | null = null;

                if (input.cause === "kill_magic") {
                  receiverId = input.killerId;
                  transferMode = "active";
                  transferReason = "kill_magic";
                } else if (input.cause === "wreck") {
                  // wreck 场景：优先转移给击杀者；无击杀者时在存活玩家中随机分配
                  if (input.killerId) {
                    receiverId = input.killerId;
                    transferMode = "passive";
                    transferReason = "wreck_killer";
                  } else {
                    const alivePlayers = Selectors.getAlivePlayers(state);
                    if (alivePlayers.length > 0) {
                      const randomIndex =
                        (yield* gameRandom.Die(alivePlayers.length)) - 1;
                      receiverId = alivePlayers[randomIndex]?.id ?? null;
                      if (receiverId) {
                        transferMode = "passive";
                        transferReason = "wreck_random";
                      }
                    }
                  }
                }

                if (receiverId && transferMode && transferReason) {
                  const receiverSecret = yield* requireSecret(
                    state,
                    receiverId,
                  );
                  receiverSecret.witchKillerHolder = true;
                  if (transferMode === "passive") {
                    receiverSecret.isWitch = true;
                  }

                  // 把遗落中的魔女杀手实体卡移入接收者手牌，并记入 deathLog.cardReceivers
                  const wkCard = droppedCards.find(
                    (card) => card.type === "witch_killer",
                  );
                  if (wkCard) {
                    receiverSecret.hand.push(wkCard);
                    const witchKillerCardIndex = droppedCards.findIndex(
                      (card) => card.id === wkCard.id,
                    );
                    if (witchKillerCardIndex > -1) {
                      droppedCards.splice(witchKillerCardIndex, 1);
                    }
                    record.cardReceivers[receiverId] ??= [];
                    record.cardReceivers[receiverId].push(wkCard.id);
                  }
                  if (transferMode === "passive") {
                    yield* messageService.handleWitchKillerObtained(
                      receiverId,
                      playerId,
                      transferMode,
                    );
                  }
                  yield* Effect.logInfo(
                    "witch_killer ownership transfer applied",
                  ).pipe(
                    Effect.annotateLogs({
                      source: "player_state_service.kill_player",
                      reason: transferReason,
                      fromPlayerId: playerId,
                      toPlayerId: receiverId,
                      mode: transferMode,
                    }),
                  );
                }
              }

              return { record, droppedCards, hadWitchKiller };
            }),
          ),

        incrementConsecutiveNoKillRounds: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              const secret = yield* requireSecret(state, playerId);
              secret.consecutiveNoKillRounds += 1;
            }),
          ),

        setWitch: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              const secret = yield* requireSecret(state, playerId);
              secret.isWitch = true;
            }),
          ),

        clearBarrier: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              const secret = yield* requireSecret(state, playerId);
              secret.hasBarrier = false;
            }),
          ),
      } satisfies IPlayerStateService;
    }),
    dependencies: [MessageService.Default],
  },
) {}
