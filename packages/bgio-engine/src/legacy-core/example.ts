/**
 * 魔女审判游戏引擎 - 完整游戏示例
 *
 * 本示例演示一个完整的7人局游戏流程，包含：
 * - 真实的玩家决策场景
 * - 信息隐藏机制展示
 * - 魔女化转变过程
 * - 残骸化判定
 * - 检定魔法揭示死法
 * - 手牌遗落分配
 */

import {
  GameEngine,
  GamePhase,
  GameEventType,
  SEVEN_PLAYER_CONFIG,
  createEngine,
  getRecommendedConfig,
  PlayerViewState,
  PublicGameState,
  CardType,
  PlayerStatus,
  DeathCause,
  GameEvent,
  PublicPlayerInfo,
} from "./index";

// ==================== 游戏场景配置 ====================

interface PlayerProfile {
  id: string;
  name: string;
  personality: string;
}

const PLAYER_PROFILES: PlayerProfile[] = [
  { id: "p1", name: "艾丽丝", personality: "激进攻击型" },
  { id: "p2", name: "鲍勃", personality: "保守防御型" },
  { id: "p3", name: "查理", personality: "狡猾欺诈型" },
  { id: "p4", name: "大卫", personality: "分析推理型" },
  { id: "p5", name: "艾娃", personality: "社交操纵型" },
  { id: "p6", name: "弗兰克", personality: "冲动冒险型" },
  { id: "p7", name: "格蕾丝", personality: "谨慎观察型" },
];

// ==================== 主要示例 ====================

/**
 * 运行完整的7人局游戏示例
 * 展示真实的游戏流程和信息隐藏机制
 */
export function runCompleteGameExample(): void {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║          🎭 魔女审判 - 完整7人局游戏示例 🎭                    ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n",
  );

  const engine = createGameEngine();
  const players = PLAYER_PROFILES.map((p) => p.id);

  // 初始化游戏
  console.log("📋 玩家名单:");
  PLAYER_PROFILES.forEach((p) => {
    console.log(`   ${p.id}: ${p.name} (${p.personality})`);
  });
  console.log();

  engine.initialize(players);

  // 展示初始手牌（仅GM视角可见）
  console.log("🎴 GM视角 - 初始手牌分配:\n");
  showGMPerspective(engine);

  // ==================== 第1天 ====================
  console.log("\n" + "=".repeat(60));
  console.log("📅 第1天：暗流涌动");
  console.log("=".repeat(60));

  // 晨间阶段
  console.log("\n🌅 晨间：昨夜无人死亡");

  // 日间阶段
  engine.advancePhase(); // DAY
  console.log("\n☀️ 日间：玩家们开始讨论和交易");
  console.log("   • 艾丽丝暗示自己持有强力卡牌");
  console.log("   • 鲍勃声称需要结界魔法保护自己");
  console.log("   • 查理在暗中观察每个人的反应");

  // 投票阶段
  engine.advancePhase(); // VOTING
  console.log("\n🗳️ 投票阶段：决定监禁对象");

  // 模拟投票逻辑
  console.log("   投票分析：");
  console.log("   • 艾丽丝投给鲍勃（怀疑他囤积结界）");
  console.log("   • 鲍勃投给艾丽丝（反击）");
  console.log("   • 查理、艾娃、弗兰克形成投票联盟，投给鲍勃");
  console.log("   • 大卫、格蕾丝分散投票");

  engine.vote({ voterId: "p1", targetId: "p2" }); // 艾丽丝->鲍勃
  engine.vote({ voterId: "p2", targetId: "p1" }); // 鲍勃->艾丽丝
  engine.vote({ voterId: "p3", targetId: "p2" }); // 查理->鲍勃
  engine.vote({ voterId: "p5", targetId: "p2" }); // 艾娃->鲍勃
  engine.vote({ voterId: "p6", targetId: "p2" }); // 弗兰克->鲍勃
  engine.vote({ voterId: "p4", targetId: "p3" }); // 大卫->查理
  engine.vote({ voterId: "p7", targetId: "p1" }); // 格蕾丝->艾丽丝

  console.log("   📊 结果：鲍勃获得4票，被监禁！\n");

  // 夜间阶段
  engine.advancePhase(); // NIGHT
  console.log("🌙 夜间行动阶段");
  console.log("   ⚠️ 鲍勃被监禁，无法使用手牌\n");

  // 玩家视角：艾丽丝（持有魔女杀手）决定动手
  const aliceView = engine.getPlayerState("p1");
  const aliceHand = aliceView.player.hand;
  const witchKillerCardId = getCardId(engine, "p1", CardType.WITCH_KILLER);

  if (witchKillerCardId && aliceView.player.witchKillerHolder) {
    console.log("   🎴 艾丽丝的视角：");
    console.log(`      手牌: ${aliceHand.map((c) => c.name).join(", ")}`);
    console.log(`      持有【魔女杀手】！只能使用魔女杀手或放弃行动`);

    // 艾丽丝使用魔女杀手攻击查理
    engine.useCard({
      playerId: "p1",
      cardId: witchKillerCardId,
      targetId: "p3", // 攻击查理
    });
    console.log("   → 艾丽丝使用【魔女杀手】攻击查理！\n");
  }

  // 其他玩家行动
  console.log("   其他玩家的行动：");
  console.log("   • 查理被攻击，但本回合他已无法行动");
  console.log("   • 大卫使用【探知魔法】探查艾娃的手牌");
  const p4DetectId = getCardId(engine, "p4", CardType.DETECT);
  if (p4DetectId)
    engine.useCard({ playerId: "p4", cardId: p4DetectId, targetId: "p5" });

  console.log("   • 艾娃、弗兰克、格蕾丝使用【结界魔法】自保");
  const p5BarrierId1 = getCardId(engine, "p5", CardType.BARRIER);
  const p6BarrierId = getCardId(engine, "p6", CardType.BARRIER);
  const p7BarrierId1 = getCardId(engine, "p7", CardType.BARRIER);
  if (p5BarrierId1) engine.useCard({ playerId: "p5", cardId: p5BarrierId1 });
  if (p6BarrierId) engine.useCard({ playerId: "p6", cardId: p6BarrierId });
  if (p7BarrierId1) engine.useCard({ playerId: "p7", cardId: p7BarrierId1 });

  // 结算阶段
  engine.advancePhase(); // RESOLUTION
  console.log("\n⚖️ 结算结果：");
  console.log("   ☠️ 查理被【魔女杀手】击杀！");
  console.log("   🧙 艾丽丝获得魔女杀手，魔女化！");
  console.log("   🔮 大卫探知到艾娃持有2张手牌");
  console.log("   🛡️ 艾娃、弗兰克、格蕾丝获得结界保护\n");

  // ==================== 第2天 ====================
  console.log("\n" + "=".repeat(60));
  console.log("📅 第2天：疑云重重");
  console.log("=".repeat(60));

  engine.advancePhase(); // MORNING
  console.log("\n🌅 晨间公布：");
  console.log("   ☠️ 查理死亡（死因不明）");
  console.log("   💬 玩家们讨论：是谁杀了查理？\n");

  // 展示公开视角（注意：不知道死因和凶手）
  console.log("📢 公开视角（所有玩家可见）：");
  showPublicPerspective(engine);

  console.log("\n🔒 注意：死因是隐藏的！其他玩家不知道：");
  console.log("   • 不知道查理是被魔女杀手还是杀人魔法杀死");
  console.log("   • 不知道凶手是谁");
  console.log("   • 艾丽丝的魔女化状态显示为【存活】\n");

  // 日间讨论
  engine.advancePhase(); // DAY
  console.log("☀️ 日间讨论：");
  console.log("   • 大卫提出需要有人使用【检定魔法】查验尸体");
  console.log("   • 艾丽丝（凶手）试图转移注意力，指控弗兰克");
  console.log("   • 格蕾丝保持沉默，暗中观察\n");

  // 投票
  console.log(engine.advancePhase()); // VOTING
  console.log("🗳️ 投票阶段：");
  engine.vote({ voterId: "p1", targetId: "p6" }); // 艾丽丝->弗兰克
  engine.vote({ voterId: "p5", targetId: "p6" }); // 艾娃->弗兰克
  engine.vote({ voterId: "p6", targetId: "p1" }); // 弗兰克->艾丽丝
  engine.vote({ voterId: "p7", targetId: "p1" }); // 格蕾丝->艾丽丝
  engine.vote({ voterId: "p4", targetId: "p1" }); // 大卫->艾丽丝
  console.log("   📊 结果：艾丽丝获得3票，弗兰克获得2票");
  console.log("   ⚖️ 平票！无人被监禁\n");

  // 夜间
  engine.advancePhase(); // NIGHT
  console.log("🌙 夜间行动阶段");

  // 艾丽丝（魔女化）必须继续杀人，否则会残骸化
  const aliceView2 = engine.getPlayerState("p1");
  if (aliceView2.player.isWitch) {
    console.log("   🧙 艾丽丝的视角（魔女化）：");
    console.log("      警告：已连续1晚未击杀，今晚必须杀人！");
    console.log("      否则明晚将残骸化死亡！\n");

    // 艾丽丝使用杀人魔法
    const killCardId = getCardId(engine, "p1", CardType.KILL);
    if (killCardId) {
      engine.useCard({
        playerId: "p1",
        cardId: killCardId,
        targetId: "p6", // 攻击弗兰克
      });
      console.log("   → 艾丽丝使用【杀人魔法】攻击弗兰克\n");
    }
  }

  // 大卫使用检定魔法查验查理的尸体
  console.log("   🔍 大卫使用【检定魔法】查验查理的尸体...");
  const checkCardId = getCardId(engine, "p4", CardType.CHECK);
  if (checkCardId) {
    engine.useCard({ playerId: "p4", cardId: checkCardId, targetId: "p3" });
    console.log("   📜 检定结果：查理是被【魔女杀手】击杀的！");
    console.log("   💡 大卫推断：凶手现在持有魔女杀手！\n");
  }

  // 其他玩家防御
  const p5BarrierId = getCardId(engine, "p5", CardType.BARRIER);
  const p7BarrierId = getCardId(engine, "p7", CardType.BARRIER);
  if (p5BarrierId) engine.useCard({ playerId: "p5", cardId: p5BarrierId });
  if (p7BarrierId) engine.useCard({ playerId: "p7", cardId: p7BarrierId });

  // 结算
  engine.advancePhase(); // RESOLUTION
  console.log("⚖️ 结算结果：");
  console.log("   ☠️ 弗兰克被【杀人魔法】击杀！");
  console.log("   💀 弗兰克遗落了3张手牌...");
  console.log("   🎴 艾丽丝获得弗兰克的手牌遗落\n");

  // ==================== 第3天 ====================
  console.log("\n" + "=".repeat(60));
  console.log("📅 第3天：真相浮现");
  console.log("=".repeat(60));

  engine.advancePhase(); // MORNING
  console.log("\n🌅 晨间公布：");
  console.log("   ☠️ 弗兰克死亡（死因不明）");
  console.log("   💬 大卫公布检定结果：查理是被魔女杀手击杀的！");
  console.log("   🔍  suspicion 指向艾丽丝...\n");

  // 展示当前状态
  showPublicPerspective(engine);

  // 继续简化展示...
  console.log("\n⚡ 游戏快速推进...\n");

  // 模拟后续几回合
  simulateQuickRounds(engine);

  // 游戏结束
  console.log("\n" + "=".repeat(60));
  console.log("🏁 游戏结束");
  console.log("=".repeat(60));

  const result = engine.checkEndCondition();
  if (result) {
    console.log("\n📊 最终结果：");
    console.log(`   幸存者: ${result.survivors.join(", ") || "无人生还"}`);
    console.log(`   进行回合: ${result.roundsPlayed}天`);
    console.log(`   死亡记录:`);
    result.deathLog.forEach((death) => {
      const causeMap: Record<DeathCause, string> = {
        [DeathCause.WITCH_KILLER]: "被魔女杀手击杀",
        [DeathCause.KILL_MAGIC]: "被杀人魔法击杀",
        [DeathCause.WRECK]: "残骸化死亡",
      };
      console.log(
        `      第${death.round}天: ${death.playerId} - ${
          causeMap[death.cause]
        }`,
      );
    });
  }

  console.log(
    "\n╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                  🎭 示例游戏结束 🎭                            ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n",
  );
}

// ==================== 辅助函数 ====================

function createGameEngine(): GameEngine {
  return createEngine("demo-room", {
    config: SEVEN_PLAYER_CONFIG,
    onPhaseChange: (phase, round) => {
      // 可以在这里添加日志
      console.log(`[当前阶段]: `, phase, `[回合]: ${round}`);
    },
    onEvent: (event) => {
      handleDetailedEvent(event);
    },
    onError: (error) => {
      console.error(`[游戏错误] ${error.code}: ${error.message}`);
    },
  });
}

function handleDetailedEvent(event: GameEvent): void {
  switch (event.type) {
    case GameEventType.PHASE_CHANGE:
      // 阶段变更已在主流程中处理
      break;
    case GameEventType.PLAYER_DIE:
      // 死亡事件已在主流程中处理
      break;
    case GameEventType.WITCH_TRANSFORM:
      console.log("   🧙 魔女化转变！");
      break;
    case GameEventType.WRECK_TRANSFORM:
      console.log("   💀 残骸化！");
      break;
  }
}

/**
 * GM视角：查看所有信息（实际游戏中只有服务器/GM能看到）
 */
function showGMPerspective(engine: GameEngine): void {
  const state = engine.getState();

  for (const [id, player] of state.players) {
    const profile = PLAYER_PROFILES.find((p) => p.id === id);
    const handNames = player.hand.map((c) => c.name).join(", ");
    const specialStatus = player.witchKillerHolder ? " [魔女杀手持有者]" : "";

    console.log(`   ${profile?.name || id}:${specialStatus}`);
    console.log(`      手牌: ${handNames}`);
  }
}

/**
 * 公开视角：玩家实际能看到的信息
 */
function showPublicPerspective(engine: GameEngine): void {
  const publicState = engine.getPublicState();

  console.log("   玩家状态：");
  for (const [id, player] of Object.entries(publicState.players)) {
    const profile = PLAYER_PROFILES.find((p) => p.id === id);
    const status = player.status === PlayerStatus.DEAD ? "💀 死亡" : "👤 存活";
    console.log(`      ${profile?.name || id}: ${status}`);
  }

  if (publicState.deaths.length > 0) {
    console.log("\n   死亡记录：");
    publicState.deaths.forEach((death) => {
      const profile = PLAYER_PROFILES.find((p) => p.id === death.playerId);
      console.log(
        `      第${death.round}天: ${profile?.name || death.playerId} 死亡`,
      );
      console.log(`      ❓ 死因：未知（需要使用检定魔法查验）`);
    });
  }
}

/**
 * 快速模拟后续回合
 */
function simulateQuickRounds(engine: GameEngine): void {
  // 第3-4天：艾丽丝继续杀戮，但逐渐被怀疑
  for (let day = 3; day <= 4; day++) {
    if (engine.isEnded()) break;

    console.log(`\n📅 第${day}天`);

    // 简化的流程推进
    engine.advancePhase(); // DAY
    engine.advancePhase(); // VOTING

    // 随机投票给艾丽丝（因为大家怀疑她）
    engine.vote({ voterId: "p4", targetId: "p1" });
    engine.vote({ voterId: "p5", targetId: "p1" });
    engine.vote({ voterId: "p7", targetId: "p1" });

    console.log("   艾丽丝被监禁！无法行动。");

    engine.advancePhase(); // NIGHT

    // 艾丽丝被监禁，无法杀人，将残骸化
    const aliceView = engine.getPlayerState("p1");
    if (aliceView.player.isWitch) {
      console.log("   🧙 艾丽丝（魔女化）被监禁，无法行动！");
      console.log("   ⚠️ 连续未击杀，即将残骸化...");
    }

    // 其他玩家互相攻击
    const p4KillId = getCardId(engine, "p4", CardType.KILL);
    const p5KillId = getCardId(engine, "p5", CardType.KILL);
    const p7BarrierId = getCardId(engine, "p7", CardType.BARRIER);
    if (p4KillId)
      engine.useCard({ playerId: "p4", cardId: p4KillId, targetId: "p5" });
    if (p5KillId)
      engine.useCard({ playerId: "p5", cardId: p5KillId, targetId: "p4" });
    if (p7BarrierId) engine.useCard({ playerId: "p7", cardId: p7BarrierId });

    engine.advancePhase(); // RESOLUTION
    console.log("   ⚔️ 夜间发生混战...");
  }

  // 最终结算
  if (!engine.isEnded()) {
    engine.advancePhase(); // MORNING
  }
}

/**
 * 获取玩家特定类型的卡牌ID（辅助函数）
 * 注意：需要从内部状态获取，因为 PublicCardInfo 不包含 id
 */
function getCardId(
  engine: GameEngine,
  playerId: string,
  cardType: CardType,
): string | null {
  // 使用内部状态获取完整卡牌信息（包括 id）
  const internalState = engine.getState();
  const player = internalState.players.get(playerId);
  if (!player) return null;
  const card = player.hand.find((c) => c.type === cardType);
  return card?.id || null;
}

// ==================== 其他示例函数 ====================

/**
 * 展示信息隐藏对比
 * 演示同一状态下，GM视角 vs 玩家视角的区别
 */
export function demonstrateInfoHiding(): void {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║              🔒 信息隐藏机制演示 🔒                            ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n",
  );

  const engine = createEngine("demo-info-hiding", {
    config: SEVEN_PLAYER_CONFIG,
  });
  const players = ["p1", "p2", "p3"];
  engine.initialize(players);

  // 模拟一些游戏进程
  engine.advancePhase(); // DAY
  engine.advancePhase(); // VOTING
  engine.vote({ voterId: "p1", targetId: "p2" });
  engine.vote({ voterId: "p3", targetId: "p2" });
  engine.advancePhase(); // NIGHT
  // p1使用魔女杀手攻击p2
  const witchKillerId = getCardId(engine, "p1", CardType.WITCH_KILLER);
  if (witchKillerId) {
    engine.useCard({ playerId: "p1", cardId: witchKillerId, targetId: "p2" });
  }

  engine.advancePhase(); // RESOLUTION

  console.log("场景：第1天夜间，p1使用魔女杀手攻击p2\n");

  // GM视角（完整信息）
  console.log("👑 GM视角（完整信息）：");
  console.log("-".repeat(50));
  const gmState = engine.getState();
  for (const [id, player] of gmState.players) {
    console.log(`\n玩家 ${id}:`);
    console.log(
      `  状态: ${player.status},  魔女化: ${player.isWitch},  手牌数: ${
        player.hand.length
      },  结界: ${player.hasBarrier},  死因: ${player.deathCause || "N/A"}`,
    );
  }

  // 玩家p3视角（自己的完整信息 + 他人的公开信息）
  console.log("\n\n👤 玩家p3的视角：");
  console.log("-".repeat(50));
  const p3View = engine.getPlayerState("p3");

  console.log("\n【自己的信息】");
  console.log(`  手牌: ${p3View.player.hand.map((c) => c.name).join(", ")}`);
  console.log(`  魔女化: ${p3View.player.isWitch}`);
  console.log(`  结界: ${p3View.player.hasBarrier}`);

  console.log("\n【其他玩家的公开信息】");
  for (const [id, player] of Object.entries(p3View.players)) {
    if (id === "p3") continue;
    console.log(`\n  玩家 ${id}:`);
    console.log(`    状态: ${player.status} ⚠️ 注意：魔女化显示为ALIVE！`);
    // 注意：handCount, hasBarrier 等都不公开
  }

  console.log("\n【死亡记录】");
  for (const death of p3View.deaths) {
    console.log(`  第${death.round}天: ${death.playerId} 死亡`);
    console.log(`    ❓ 死因: 未知（需要通过检定魔法查验）`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("💡 关键结论：");
  console.log("   1. p1魔女化后，对其他玩家显示为【ALIVE】");
  console.log("   2. p3不知道p1的手牌数量和结界状态");
  console.log("   3. p3不知道p2的死因（除非使用检定魔法）");
  console.log("=".repeat(60) + "\n");
}

/**
 * 快速开始游戏（用于测试）
 */
export function quickStart(playerCount: number = 7): GameEngine {
  const config = getRecommendedConfig(playerCount);
  const engine = createEngine("quick-test", { config });

  const players = Array.from(
    { length: playerCount },
    (_, i) => `Player${i + 1}`,
  );
  engine.initialize(players);

  return engine;
}

/**
 * 运行所有示例
 */
export function runAllExamples(): void {
  // 1. 信息隐藏演示
  demonstrateInfoHiding();

  console.log("\n" + "=".repeat(70) + "\n");

  // 2. 完整游戏示例
  runCompleteGameExample();
}

// 如果直接运行此文件
if (typeof window === "undefined" && require.main === module) {
  runAllExamples();
}
