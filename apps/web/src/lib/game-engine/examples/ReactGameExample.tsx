/**
 * React 游戏组件示例
 * 
 * 展示如何在React中使用游戏引擎构建实际的游戏界面
 * 包括：
 * - 游戏大厅
 * - 玩家视角状态显示
 * - 手牌操作
 * - 投票界面
 * - 夜间行动
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import {
  GamePhase,
  CardType,
  PlayerStatus,
  PublicGameState,
  PlayerViewState,
  PublicPlayerInfo,
  GameEventType,
} from '../index';

// ==================== 主游戏组件 ====================

interface GameRoomProps {
  roomId: string;
  playerId: string;
}

export function GameRoom({ roomId, playerId }: GameRoomProps): React.JSX.Element {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);

  const game = useGame({
    roomId,
    playerId,
    onPhaseChange: (phase, round) => {
      addLog(`第${round}天 - 进入${getPhaseName(phase)}阶段`);
    },
    onEvent: (event) => {
      handleGameEvent(event, addLog);
    },
    onError: (error) => {
      addLog(`错误: ${error.message}`);
    },
  });

  const addLog = useCallback((message: string) => {
    setGameLog((prev) => [...prev.slice(-49), message]);
  }, []);

  // 获取玩家视角状态
  const playerView = game.getPlayerState();
  const publicState = game.getPublicState();

  if (!game.isInitialized) {
    return <GameLobby onStart={() => game.initialize(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'])} />;
  }

  return (
    <div className="game-room">
      {/* 游戏头部信息 */}
      <GameHeader
        round={game.currentRound}
        phase={game.currentPhase}
        phaseEndTime={playerView?.phaseEndTime}
      />

      {/* 主游戏区域 */}
      <div className="game-main">
        {/* 左侧：玩家列表 */}
        <PlayerList
          players={publicState?.players}
          currentPlayerId={playerId}
          onSelectTarget={setSelectedTarget}
          selectedTarget={selectedTarget}
        />

        {/* 中间：游戏区域 */}
        <div className="game-center">
          <PhaseInfo
            phase={game.currentPhase}
            canAdvance={game.canAdvancePhase()}
            onAdvance={game.advancePhase}
          />

          {/* 根据阶段显示不同UI */}
          {game.currentPhase === GamePhase.DAY && (
            <DayPhasePanel
              log={gameLog}
              onSendMessage={(msg) => addLog(`[${playerId}] ${msg}`)}
            />
          )}

          {game.currentPhase === GamePhase.VOTING && (
            <VotingPanel
              players={publicState?.players}
              currentPlayerId={playerId}
              onVote={game.vote}
            />
          )}

          {game.currentPhase === GamePhase.NIGHT && (
            <NightPhasePanel
              playerView={playerView}
              selectedCard={selectedCard}
              selectedTarget={selectedTarget}
              onSelectCard={setSelectedCard}
              onUseCard={() => {
                if (selectedCard && selectedTarget) {
                  game.useCard(selectedCard, selectedTarget);
                  setSelectedCard(null);
                  setSelectedTarget(null);
                }
              }}
              onPass={game.pass}
              isImprisoned={isPlayerImprisoned(publicState, playerId)}
            />
          )}

          {game.currentPhase === GamePhase.MORNING && (
            <MorningPanel
              deaths={publicState?.deaths}
              currentRound={game.currentRound}
            />
          )}
        </div>

        {/* 右侧：我的手牌 */}
        <HandPanel
          hand={playerView?.player.hand}
          isWitch={playerView?.player.isWitch}
          hasBarrier={playerView?.player.hasBarrier}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCard}
          canAct={canPlayerAct(game.currentPhase, playerView, publicState, playerId)}
        />
      </div>

      {/* 底部：游戏日志 */}
      <GameLog log={gameLog} />
    </div>
  );
}

// ==================== 子组件 ====================

function GameLobby({ onStart }: { onStart: () => void }): React.JSX.Element {
  return (
    <div className="game-lobby">
      <h2>🎭 魔女审判</h2>
      <p>等待游戏开始...</p>
      <button onClick={onStart}>开始游戏（7人局）</button>
    </div>
  );
}

function GameHeader({
  round,
  phase,
  phaseEndTime,
}: {
  round: number;
  phase: GamePhase | null;
  phaseEndTime: number | undefined;
}): React.JSX.Element {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!phaseEndTime) return;
    
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((phaseEndTime - Date.now()) / 1000));
      setTimeLeft(left);
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseEndTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-header">
      <div className="game-title">
        <h1>🎭 魔女审判</h1>
      </div>
      <div className="game-info">
        <span className="round">第 {round} 天</span>
        <span className="phase">{phase ? getPhaseName(phase) : '等待中'}</span>
        {timeLeft > 0 && (
          <span className="timer">⏱️ {formatTime(timeLeft)}</span>
        )}
      </div>
    </div>
  );
}

function PlayerList({
  players,
  currentPlayerId,
  onSelectTarget,
  selectedTarget,
}: {
  players: Record<string, PublicPlayerInfo> | undefined;
  currentPlayerId: string;
  onSelectTarget: (id: string) => void;
  selectedTarget: string | null;
}): React.JSX.Element {
  if (!players) return <div className="player-list">加载中...</div>;

  return (
    <div className="player-list">
      <h3>玩家列表</h3>
      {Object.entries(players).map(([id, player]) => {
        const isSelf = id === currentPlayerId;
        const isDead = player.status === PlayerStatus.DEAD;
        const isSelected = selectedTarget === id;

        return (
          <div
            key={id}
            className={`player-item ${isSelf ? 'self' : ''} ${isDead ? 'dead' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => !isDead && onSelectTarget(id)}
          >
            <span className="seat">#{player.seatNumber}</span>
            <span className="name">{id} {isSelf && '(你)'}</span>
            <span className={`status ${player.status}`}>
              {getStatusText(player.status)}
            </span>
            {/* 注意：不显示手牌数量和结界状态 */}
          </div>
        );
      })}
    </div>
  );
}

function PhaseInfo({
  phase,
  canAdvance,
  onAdvance,
}: {
  phase: GamePhase | null;
  canAdvance: boolean;
  onAdvance: () => void;
}): React.JSX.Element {
  const phaseDescriptions: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: '等待玩家加入',
    [GamePhase.SETUP]: '游戏准备中',
    [GamePhase.MORNING]: '公布夜间死亡信息',
    [GamePhase.DAY]: '讨论、交易、分析',
    [GamePhase.VOTING]: '投票决定监禁对象',
    [GamePhase.NIGHT]: '使用卡牌行动（被监禁者无法行动）',
    [GamePhase.RESOLUTION]: '结算所有行动',
    [GamePhase.ENDED]: '游戏结束',
  };

  return (
    <div className="phase-info">
      <h2>{phase ? getPhaseName(phase) : '等待中'}</h2>
      <p>{phase ? phaseDescriptions[phase] : ''}</p>
      {canAdvance && (
        <button onClick={onAdvance} className="advance-btn">
          进入下一阶段
        </button>
      )}
    </div>
  );
}

function DayPhasePanel({
  log,
  onSendMessage,
}: {
  log: string[];
  onSendMessage: (msg: string) => void;
}): React.JSX.Element {
  const [message, setMessage] = useState('');

  return (
    <div className="day-phase">
      <h3>☀️ 日间讨论</h3>
      <div className="chat-box">
        {log.slice(-10).map((entry, i) => (
          <div key={i} className="chat-entry">{entry}</div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && message) {
              onSendMessage(message);
              setMessage('');
            }
          }}
        />
        <button
          onClick={() => {
            if (message) {
              onSendMessage(message);
              setMessage('');
            }
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}

function VotingPanel({
  players,
  currentPlayerId,
  onVote,
}: {
  players: Record<string, PublicPlayerInfo> | undefined;
  currentPlayerId: string;
  onVote: (targetId: string) => void;
}): React.JSX.Element {
  if (!players) return <div>加载中...</div>;
  // 简化：实际应该检查玩家是否已经投票
  const hasVoted = false;
  if (hasVoted) return <div className="voting-panel">✅ 你已投票</div>;

  // 不能投给已死亡的玩家
  const votablePlayers = Object.entries(players).filter(
    ([, p]) => p.status !== PlayerStatus.DEAD
  );

  return (
    <div className="voting-panel">
      <h3>🗳️ 监禁投票</h3>
      <p>选择一名玩家监禁（被监禁者夜间无法行动）：</p>
      <div className="vote-options">
        {votablePlayers.map(([id]) => (
          <button
            key={id}
            onClick={() => onVote(id)}
            disabled={id === currentPlayerId}
            className="vote-btn"
          >
            {id} {id === currentPlayerId && '(自己)'}
          </button>
        ))}
      </div>
    </div>
  );
}

function NightPhasePanel({
  playerView,
  selectedCard,
  selectedTarget,
  onSelectCard,
  onUseCard,
  onPass,
  isImprisoned,
}: {
  playerView: PlayerViewState | null;
  selectedCard: string | null;
  selectedTarget: string | null;
  onSelectCard: (id: string) => void;
  onUseCard: () => void;
  onPass: () => void;
  isImprisoned: boolean;
}): React.JSX.Element {
  if (isImprisoned) {
    return (
      <div className="night-phase imprisoned">
        <h3>🌙 夜间行动</h3>
        <div className="imprisoned-notice">
          🔒 你已被监禁，本回合无法使用手牌
        </div>
        <button onClick={onPass}>确认</button>
      </div>
    );
  }

  if (!playerView) return <div>加载中...</div>;

  const { player } = playerView;
  const isWitchKillerHolder = player.witchKillerHolder;

  return (
    <div className="night-phase">
      <h3>🌙 夜间行动</h3>
      
      {player.isWitch && (
        <div className="witch-warning">
          ⚠️ 你已魔女化！必须在本回合击杀目标，否则将残骸化死亡！
          {player.consecutiveNoKillRounds > 0 && (
            <span>（已连续{player.consecutiveNoKillRounds}晚未击杀）</span>
          )}
        </div>
      )}

      {isWitchKillerHolder && (
        <div className="witch-killer-notice">
          🔪 你持有【魔女杀手】！只能使用魔女杀手或放弃行动
        </div>
      )}

      {selectedCard && selectedTarget ? (
        <div className="action-confirm">
          <p>使用 {getCardName(player.hand, selectedCard)} 攻击 {selectedTarget}?</p>
          <button onClick={onUseCard}>确认</button>
          <button onClick={() => onSelectCard('')}>取消</button>
        </div>
      ) : (
        <div className="action-hint">
          <p>💡 从右侧选择一张卡牌，然后点击左侧玩家列表选择目标</p>
          <button onClick={onPass} className="pass-btn">
            放弃行动
          </button>
        </div>
      )}

      {player.hasBarrier && (
        <div className="barrier-status">
          🛡️ 你当前有结界保护
        </div>
      )}
    </div>
  );
}

function MorningPanel({
  deaths,
  currentRound,
}: {
  deaths: { round: number; playerId: string; died: true }[] | undefined;
  currentRound: number;
}): React.JSX.Element {
  // 只显示昨晚的死亡
  const lastNightDeaths = deaths?.filter((d) => d.round === currentRound - 1) || [];

  return (
    <div className="morning-panel">
      <h3>🌅 晨间公布</h3>
      {lastNightDeaths.length === 0 ? (
        <p>☀️ 昨夜平安无事，无人死亡</p>
      ) : (
        <>
          <p>☠️ 昨夜有人死亡：</p>
          <ul>
            {lastNightDeaths.map((death) => (
              <li key={death.playerId}>
                {death.playerId} 死亡
                <span className="death-cause-unknown">（死因未知，需使用检定魔法查验）</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function HandPanel({
  hand,
  isWitch,
  hasBarrier,
  selectedCard,
  onSelectCard,
  canAct,
}: {
  hand: { type: CardType; name: string; description: string; consumable: boolean }[] | undefined;
  isWitch: boolean | undefined;
  hasBarrier: boolean | undefined;
  selectedCard: string | null;
  onSelectCard: (id: string) => void;
  canAct: boolean;
}): React.JSX.Element {
  if (!hand) return <div className="hand-panel">加载中...</div>;

  return (
    <div className="hand-panel">
      <h3>🎴 我的手牌</h3>
      {isWitch && (
        <div className="witch-badge">🧙 魔女化</div>
      )}
      {hasBarrier && (
        <div className="barrier-badge">🛡️ 结界保护中</div>
      )}
      <div className="hand-cards">
        {hand.map((card, index) => {
          const cardId = `${card.type}-${index}`; // 简化的ID
          const isSelected = selectedCard === cardId;
          
          return (
            <div
              key={index}
              className={`card ${card.type} ${isSelected ? 'selected' : ''} ${!canAct ? 'disabled' : ''}`}
              onClick={() => canAct && onSelectCard(cardId)}
              title={card.description}
            >
              <div className="card-name">{card.name}</div>
              <div className="card-type">{getCardTypeText(card.type)}</div>
              {card.consumable && <span className="consumable">消耗</span>}
            </div>
          );
        })}
      </div>
      {!canAct && (
        <div className="cannot-act">当前阶段无法使用手牌</div>
      )}
    </div>
  );
}

function GameLog({ log }: { log: string[] }): React.JSX.Element {
  return (
    <div className="game-log">
      <h4>📜 游戏日志</h4>
      <div className="log-entries">
        {log.map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>
    </div>
  );
}

// ==================== 辅助函数 ====================

function getPhaseName(phase: GamePhase): string {
  const names: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: '等待加入',
    [GamePhase.SETUP]: '准备中',
    [GamePhase.MORNING]: '晨间',
    [GamePhase.DAY]: '日间',
    [GamePhase.VOTING]: '投票',
    [GamePhase.NIGHT]: '夜间',
    [GamePhase.RESOLUTION]: '结算',
    [GamePhase.ENDED]: '已结束',
  };
  return names[phase] || phase;
}

function getStatusText(status: PlayerStatus): string {
  const texts: Record<PlayerStatus, string> = {
    [PlayerStatus.ALIVE]: '存活',
    [PlayerStatus.DEAD]: '死亡',
    [PlayerStatus.WITCH]: '存活', // 魔女化对外显示为存活
    [PlayerStatus.WRECK]: '残骸',
  };
  return texts[status] || status;
}

function getCardTypeText(type: CardType): string {
  const texts: Record<CardType, string> = {
    [CardType.WITCH_KILLER]: '魔女杀手',
    [CardType.BARRIER]: '结界魔法',
    [CardType.KILL]: '杀人魔法',
    [CardType.DETECT]: '探知魔法',
    [CardType.CHECK]: '检定魔法',
  };
  return texts[type] || type;
}

function getCardName(
  hand: { type: CardType; name: string }[],
  selectedId: string
): string {
  const index = parseInt(selectedId.split('-')[1] || '0');
  return hand[index]?.name || '未知卡牌';
}

function isPlayerImprisoned(
  publicState: PublicGameState | null,
  playerId: string
): boolean {
  // 简化实现：实际应该从投票结果中判断
  return false;
}

function canPlayerAct(
  phase: GamePhase | null,
  playerView: PlayerViewState | null,
  publicState: PublicGameState | null,
  playerId: string,
): boolean {
  if (phase !== GamePhase.NIGHT) return false;
  if (!playerView) return false;
  
  // 检查是否被监禁（简化实现）
  const isImprisoned = isPlayerImprisoned(publicState, playerId);
  if (isImprisoned) return false;
  
  // 检查是否已死亡
  if (playerView.player.status === PlayerStatus.DEAD) return false;
  
  return true;
}

function handleGameEvent(
  event: { type: string; data: unknown },
  addLog: (msg: string) => void,
): void {
  switch (event.type) {
    case GameEventType.PLAYER_DIE:
      {
        const data = event.data as { playerId: string };
        addLog(`☠️ ${data.playerId} 死亡`);
      }
      break;
    case GameEventType.WITCH_TRANSFORM:
      {
        const data = event.data as { playerId: string };
        addLog(`🧙 ${data.playerId} 魔女化！`);
      }
      break;
    case GameEventType.WRECK_TRANSFORM:
      {
        const data = event.data as { playerId: string };
        addLog(`💀 ${data.playerId} 残骸化死亡！`);
      }
      break;
    case GameEventType.CARD_USED:
      {
        const data = event.data as { actorId: string; cardType: string; result: string };
        addLog(`🎴 ${data.actorId} 使用 ${data.cardType}`);
      }
      break;
    case GameEventType.VOTE_RESULT:
      {
        const data = event.data as { imprisonedId: string | null; isTie: boolean };
        if (data.isTie) {
          addLog('🗳️ 投票平票，无人被监禁');
        } else if (data.imprisonedId) {
          addLog(`🗳️ ${data.imprisonedId} 被监禁`);
        }
      }
      break;
  }
}

// ==================== 样式 ====================

// 建议的CSS样式（可根据实际项目调整）
export const gameStyles = `
.game-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  color: #eee;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #16213e;
  border-bottom: 2px solid #0f3460;
}

.game-info {
  display: flex;
  gap: 2rem;
  font-size: 1.2rem;
}

.game-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.player-list {
  width: 200px;
  padding: 1rem;
  background: #16213e;
  overflow-y: auto;
}

.player-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #0f3460;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.player-item:hover:not(.dead) {
  background: #1a4a7a;
}

.player-item.self {
  border: 2px solid #e94560;
}

.player-item.dead {
  opacity: 0.5;
  cursor: not-allowed;
}

.player-item.selected {
  background: #e94560;
}

.game-center {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.hand-panel {
  width: 250px;
  padding: 1rem;
  background: #16213e;
  overflow-y: auto;
}

.hand-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card {
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #0f3460;
}

.card:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.card.selected {
  border: 2px solid #e94560;
}

.card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card.witch_killer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card.kill {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card.barrier {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card.detect {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card.check {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.game-log {
  height: 150px;
  padding: 1rem;
  background: #0f0f1e;
  border-top: 2px solid #0f3460;
}

.log-entries {
  height: calc(100% - 2rem);
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.9rem;
}

.witch-warning {
  background: #e94560;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.witch-killer-notice {
  background: #764ba2;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.imprisoned-notice {
  background: #666;
  color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  font-size: 1.2rem;
}

.death-cause-unknown {
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
}
`;

export default GameRoom;
