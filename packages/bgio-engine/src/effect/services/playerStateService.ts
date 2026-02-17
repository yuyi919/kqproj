"use client";

/**
 * PlayerStateService - 玩家状态服务
 *
 * 职责：读取/修改游戏状态中的玩家信息
 * 执行层：访问和修改 BGGameState
 */

import { Effect } from "effect";
import type {
  BGGameState,
  CardRef,
  DeathCause,
  DeathRecord,
  PrivatePlayerInfo,
  PublicPlayerInfo,
} from "../../types";
import { GameStateRef } from "../context/gameStateRef";
import { PlayerNotAliveError, PlayerNotFoundError } from "../errors";

/**
 * 玩家状态服务接口
 */
export interface IPlayerStateService {
  /** 获取玩家公开信息 */
  readonly getPlayer: (
    playerId: string,
  ) => Effect.Effect<PublicPlayerInfo, PlayerNotFoundError>;

  /** 获取玩家私有信息 */
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

  /** 击杀玩家 - 返回死亡记录和遗落的手牌 */
  readonly killPlayer: (
    playerId: string,
    cause: DeathCause,
    killerId?: string,
  ) => Effect.Effect<
    { record: DeathRecord; droppedCards: CardRef[] },
    PlayerNotFoundError | PlayerNotAliveError
  >;

  /** 转移魔女杀手 */
  readonly transferWitchKiller: (
    receiverId: string,
    droppedCards: CardRef[],
    fromPlayerId?: string,
  ) => Effect.Effect<boolean, PlayerNotFoundError>;

  /** 更新玩家连续未击杀回合数 */
  readonly incrementConsecutiveNoKillRounds: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 设置玩家为 witch 状态 */
  readonly setWitch: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 清除玩家的 barrier */
  readonly clearBarrier: (
    playerId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;
}

function isPlayerAliveStatus(secret: PrivatePlayerInfo): boolean {
  return secret.status === "alive" || secret.status === "witch";
}

function getAlivePlayersFromState(state: BGGameState): PublicPlayerInfo[] {
  return Object.values(state.players).filter((player) => {
    const secret = state.secrets[player.id];
    return secret && isPlayerAliveStatus(secret);
  });
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
      const withState = <A, E>(
        f: (state: BGGameState) => Effect.Effect<A, E>,
      ): Effect.Effect<A, E> => Effect.flatMap(gameStateRef.get(), f);

      return {
        getPlayer: (playerId) => withState((state) => requirePlayer(state, playerId)),

        getPlayerSecrets: (playerId) =>
          withState((state) => requireSecret(state, playerId)),

        isAlive: (playerId) =>
          withState((state) =>
            Effect.map(requireSecret(state, playerId), isPlayerAliveStatus),
          ),

        isImprisoned: (playerId) =>
          withState((state) =>
            Effect.gen(function* () {
              yield* requirePlayer(state, playerId);
              return !!state.imprisonedId && state.imprisonedId === playerId;
            }),
          ),

        getAlivePlayers: () =>
          withState((state) => Effect.succeed(getAlivePlayersFromState(state))),

        getHand: (playerId) =>
          withState((state) =>
            Effect.map(requireSecret(state, playerId), (secret) => secret.hand),
          ),

        isWitchKillerHolder: (playerId) =>
          withState((state) =>
            Effect.map(
              requireSecret(state, playerId),
              (secret) => secret.witchKillerHolder,
            ),
          ),

        getHandCount: (playerId) =>
          withState((state) =>
            Effect.map(
              requireSecret(state, playerId),
              (secret) => secret.hand.length,
            ),
          ),

        hasBarrier: (playerId) =>
          withState((state) =>
            Effect.map(requireSecret(state, playerId), (secret) => secret.hasBarrier),
          ),

        getConsecutiveNoKillRounds: (playerId) =>
          withState((state) =>
            Effect.map(
              requireSecret(state, playerId),
              (secret) => secret.consecutiveNoKillRounds,
            ),
          ),

        killPlayer: (playerId, cause, killerId) =>
          withState((state) =>
            Effect.gen(function* () {
              const { player, secret } = yield* requirePlayerAndSecret(
                state,
                playerId,
              );

              if (!isPlayerAliveStatus(secret)) {
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
                if (cause === "wreck" && killerId) {
                  const killerSecret = yield* requireSecret(state, killerId);
                  killerSecret.witchKillerHolder = true;
                  killerSecret.isWitch = true;
                  const wkCard = droppedCards.find(
                    (card) => card.type === "witch_killer",
                  );
                  if (wkCard) {
                    killerSecret.hand.push(wkCard);
                    record.cardReceivers[killerId] ??= [];
                    record.cardReceivers[killerId].push(wkCard.id);
                  }
                  yield* Effect.logInfo(
                    "witch_killer ownership transfer applied",
                  ).pipe(
                    Effect.annotateLogs({
                      source: "player_state_service.kill_player",
                      reason: "wreck_killer",
                      fromPlayerId: playerId,
                      toPlayerId: killerId,
                    }),
                  );
                }
              }

              return { record, droppedCards };
            }),
          ),

        transferWitchKiller: (receiverId, droppedCards, fromPlayerId) =>
          withState((state) =>
            Effect.gen(function* () {
              const receiverSecret = yield* requireSecret(state, receiverId);

              receiverSecret.witchKillerHolder = true;

              const witchKillerCardIndex = droppedCards.findIndex(
                (card) => card.type === "witch_killer",
              );
              if (witchKillerCardIndex > -1) {
                const card = droppedCards[witchKillerCardIndex];
                receiverSecret.hand.push(card);
                droppedCards.splice(witchKillerCardIndex, 1);
              }

              yield* Effect.logInfo(
                "witch_killer ownership transfer applied",
              ).pipe(
                Effect.annotateLogs({
                  source: "player_state_service.transfer_witch_killer",
                  reason: "manual_transfer",
                  fromPlayerId: fromPlayerId ?? "unknown",
                  toPlayerId: receiverId,
                }),
              );
              return true;
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
    dependencies: [],
  },
) {}
