# bgio-engine Effect-TS 重构 ToDo

## 目标与范围

- 目标：完成 `bgio-engine` 的 Effect-TS 重构收敛，先保正确性与可测性，再做结构优化。
- 范围：`src/game/resolution/phase2-attack.ts`、`src/game/moves.ts`、`src/game/assertions.ts`、`src/effect/context/*`、`src/effect/services/*`、`src/effect/layers/*`。
- 非范围：UI 组件、`apps/web`、数据库层。

## 优先级 ToDo

- [x] `[P0]` 修复 `phase2` 失败吞掉问题  
      文件：`src/game/resolution/phase2-attack.ts`  
      结果：失败时不再静默返回空结果，改为可观测失败路径（抛出统一错误或返回显式失败结果并中断结算）。

- [x] `[P0]` 统一服务返回签名为 Effect  
      文件：`src/effect/services/attackResolutionService.ts`、`src/effect/services/playerStateService.ts`、`src/effect/services/messageService.ts`  
      结果：服务方法改为 `Effect.Effect<A, E, R>`，移除同步 `throw` 和 `null` 语义。

- [x] `[P0]` 补齐 `GameStateRef` 可变 Context 接口  
      文件：`src/effect/context/gameStateRef.ts`  
      结果：提供 `get/set/update` 三个入口；服务层通过这些入口读写状态，不直接依赖裸对象副作用。

- [x] `[P1]` 错误建模统一为 `Data.TaggedError`  
      文件：`src/effect/errors.ts`、`src/effect/services/*.ts`  
      结果：业务失败走 typed error，不混用 `throw` 与字符串 reason。
      进度：`PlayerStateService` 已提炼统一的 `requirePlayer/requireSecret` Effect 断言，并改为严格 `PlayerNotFoundError/PlayerNotAliveError`；`MessageService` 的 `addRevealedInfo` 等路径已改为严格 `PlayerNotFoundError`，移除缺失玩家静默返回；`AttackResolutionService` 的规则失败路径改为内部 `TaggedError`（`ActorDeadError/QuotaExceededError/BarrierProtectedError/TargetAlreadyDeadError/TargetWitchKillerFailedError`）并直接向外保留 `AttackError`（`NightAction.failedReason` / `failedActions.reason`）；失败映射收敛为 `Effect.catchTags`，失败消息分发下沉到 `MessageService.handleAttackFailureByReason`。

- [x] `[P1]` 为 Effect 服务层补齐测试  
      文件新增：`src/effect/services/*.test.ts`、`src/effect/context/*.test.ts`、`src/effect/layers/*.test.ts`  
      结果：覆盖 `AttackResolutionService`、`PlayerStateService`、`MessageService`、`GameLayers` 关键路径。

- [ ] `[P2]` 推进 Branded Types 的真实落地  
      文件：`src/types/branded.ts`、`src/types/index.ts`、`src/game/*`、`src/effect/*`  
      结果：`PlayerId/CardId` 至少在服务边界和核心流程参数中生效。

- [ ] `[P2]` `moves/assertions` 收敛重构  
      文件：`src/game/moves.ts`、`src/game/assertions.ts`  
      结果：重复断言模式下沉，`moves.ts` 按交易/夜间行动/卡牌选择拆分。

- [ ] `[P3]` 文档对齐  
      文件：`plan/游戏核心代码 Effect-TS 重构计划.md`、`AGENTS.md`  
      结果：修正过期行数、移除 Schema 冲突描述、同步当前真实状态与里程碑。

## 接口变更（重要）

- [x] `GameStateRef` 从仅 `get` 扩展为 `get/set/update`。
- [x] `IAttackResolutionService`、`IPlayerStateService`、`IMessageService` 核心方法签名改为 `Effect.Effect<Success, Error, R>`。
- [x] `PlayerNotFound`、`QuotaExceeded`、`BarrierProtected` 等错误统一为 `Data.TaggedError`。
- [ ] `PlayerId/CardId` 在服务边界参数类型中启用（逐步替换裸 `string`）。

---

## Phase 3: 技术债务 - 经验总结

### 背景

Phase 3 目标是标准化日志记录（替换 console.log）和统一错误处理。执行过程中发现原有计划存在设计问题，需要修正。

### 问题发现

**原计划设计 (错误):**
```typescript
// 使用 Context 注入
const logger = yield* Logger;  // 错误！
yield* logger.info("message");
```

- 使用 `yield* Logger` 在非生成器函数中
- 尝试将 Logger 作为 Effect-TS Context 注入
- 使用了不存在的 `_` 导入

### 修正后的设计 (正确):

```typescript
// 直接调用模式
import { LoggerService } from "../effect/context/logger";

yield* LoggerService.info("message");
```

- LoggerService 直接导出，无需 Context 注入
- 方法返回 `Effect.Effect<void>`，由 wrapMove 自动执行
- 使用 `Effect.log` (3.19+ API)

### 学到的教训

1. **不要假设 Effect-TS 模式** - 不是所有服务都需要 Context 注入。简单的工具服务可以直接导出函数/对象。

2. **验证导入来源** - `_` 不是从 "effect" 导出的，需要直接使用 `yield*`

3. **Effect.gen 内直接调用** - `yield* LoggerService.info()` 在 `Effect.gen(function*() {})` 内直接调用

4. **测试驱动的修正** - typecheck 和测试帮助快速发现问题

5. **计划需要与实现对齐** - 计划文档应反映实际可行的实现方式

### 相关提交

- `6990e7d` - refactor(phase-3): correct LoggerService implementation
- `4a509d6` - docs(phase-3): update UAT report with LoggerService pattern
- `b96a1fe` - docs(phase-3): add SUMMARY files for all plans

## 测试场景（最小闭环）

- [x] `phase2` 执行失败时：不会静默返回“空成功结果”。
- [x] 攻击者已死：标记 `actor_dead` 且不误杀目标。
- [x] barrier 防御：目标存活，barrier 按规则消耗。
- [x] witch_killer 成功后：对持有者的后续攻击按规则失败。
- [x] 配额超限：超额动作失败且卡牌消耗行为符合规则。
- [x] kill 击杀 witch_killer 持有者：转移逻辑正确。
- [x] `GameStateRef.update`：服务写入可观察，状态一致性不回退。
- [x] 服务层 typed error：可被 `catchTag` 精确捕获。

## 验收标准

- [x] `pnpm build` 通过。
- [x] 关键规则场景回归通过（witch_killer 优先级、barrier 防御、配额超限、目标已死、魔女杀手转移）。
- [x] 新增服务测试可独立运行并覆盖失败路径。
- [x] `phase2` 不再存在失败吞掉的静默路径。
- [x] 重构后文档与代码现状一致。

## 默认约束

- [ ] 只维护当前包文档：`packages/bgio-engine/AGENTS.md`。
- [ ] 文档语言默认中文，采用可勾选待办格式（`- [ ]`）。
- [ ] 执行顺序默认：先做稳定性与可测性（`P0/P1`），再做结构优化与文档对齐（`P2/P3`）。

## 2026-02-14 增量记录（failedReason TaggedError 收敛）

- [x] `NightAction.failedReason` 全链路改为 `TaggedError`（`AttackError`），不再回转字符串 reason。
- [x] `AttackResolutionService` 失败收敛改为 `Effect.catchTags`，`failedActions.reason` 保持 `AttackError`。
- [x] `MessageService.handleAttackFailureByReason` 入参改为 `AttackError`，并下沉失败消息分发（通过 `_tag` 分支）。
- [x] `phase5-consume` 按 `failedReason._tag` 判定消耗策略。
- [x] 测试断言迁移为 `_tag`：
      `src/effect/services/attackResolutionService.test.ts`
      `src/game/resolution/phase2-attack.test.ts`
      `src/__tests__/attack.test.ts`
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts src/effect/services/messageService.test.ts src/effect/services/playerStateService.test.ts src/effect/context/gameStateRef.test.ts src/effect/layers/gameLayers.test.ts`
      `bun test src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase1-detect-barrier.test.ts src/game/resolution/phase3-check.test.ts src/game/resolution/applyPhaseResult.test.ts`
      `bun test src/__tests__/attack.test.ts`

## 2026-02-14 增量记录（phase2 全流程 Effect 下沉）

- [x] 新增 `AttackResolutionService.resolvePhase2(previousResult)`，在 Effect 内完成：
      攻击执行、`PhaseResult` 组装、barrier 消耗处理、`cardSelection/pendingDistributions` 后处理、私信提示发送。
- [x] `src/game/resolution/phase2-attack.ts` 下沉为纯入口：
      仅负责启动 Effect 与错误边界，不再在外层做结果拼装和后处理副作用。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts src/effect/services/messageService.test.ts src/effect/services/playerStateService.test.ts src/effect/context/gameStateRef.test.ts src/effect/layers/gameLayers.test.ts src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase1-detect-barrier.test.ts src/game/resolution/phase3-check.test.ts src/game/resolution/applyPhaseResult.test.ts`

## 2026-02-14 增量记录（attackResolutionService 结构优化）

- [x] `executedActionInfos` 从 `Map` 收敛为 `ReadonlyArray`，移除无读取价值的 key 索引结构，减少不必要转换。
- [x] 移除未被消费的 `transferredWitchKiller` 字段和相关赋值。
- [x] 移除不必要的 `Refinements + as never` 转换，改为 `CardType` 直接分支（`"kill"` / `"witch_killer"`）。
- [x] 抽出公共辅助函数，减少重复逻辑：
      `createConsumedBarrierSnapshot`
      `appendPendingDistribution`
- [x] 规则失败映射去重：`Effect.catchTags` 的 handler 统一复用 `asRuleFailure`。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts src/effect/services/messageService.test.ts src/effect/services/playerStateService.test.ts src/effect/context/gameStateRef.test.ts src/effect/layers/gameLayers.test.ts src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase1-detect-barrier.test.ts src/game/resolution/phase3-check.test.ts src/game/resolution/applyPhaseResult.test.ts src/__tests__/attack.test.ts`

## 2026-02-14 增量记录（phase2 消息清单回归补充）

- [x] 在 `src/effect/services/attackResolutionService.test.ts` 新增表驱动用例：
      `AttackResolutionService > phase2 message checklist (table-driven)`。
- [x] 覆盖并校验关键消息链路：
      `kill success`、`barrier protected`、`quota exceeded`、`target_witch_killer_failed`、`actor_dead`。
- [x] 同步校验成功/失败消息组合：
      `attack_result`、`dead_response`、`transform_witch`、`private_message`、`barrier_applied`、`attack_excess`。
- [x] 清理断言中的 `any`，改用 `TMessage` 判别联合断言，减少类型回退。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts`
      `bun test src/effect/services/attackResolutionService.test.ts src/effect/services/messageService.test.ts src/effect/services/playerStateService.test.ts src/effect/context/gameStateRef.test.ts src/effect/layers/gameLayers.test.ts src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase1-detect-barrier.test.ts src/game/resolution/phase3-check.test.ts src/game/resolution/applyPhaseResult.test.ts src/__tests__/attack.test.ts`

## 2026-02-14 增量记录（Refinements 判别收敛）

- [x] 按评审建议收敛：移除服务层 `=== "kill"` / `=== "witch_killer"` 字面量分支，统一改为 `Refinements` 判别。
- [x] `src/effect/services/attackResolutionService.ts`：
      `resolvePhase2` 中 `executedActionInfos` 分支改为 `Refinements.isKillMagicCard / isWitchKillerCard`；
      `processAttackActions` 中 kill 配额计数、死亡原因判定、witch_killer 分支均改为 `Refinements` 判别。
- [x] `src/game/resolution/services/priority.ts`：
      `isWitchKillerUsed` 改为复用 `Refinements.isWitchKillerCard`，不再直接比较字面量。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts src/game/resolution/services/priority.test.ts src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/__tests__/attack.test.ts`

## 2026-02-14 增量记录（WitchKillerObtainedNotification 结构化）

- [x] 新增结构化私密响应消息：`WitchKillerObtainedNotification`（`private_response`）：
      字段包含 `actorId`、`fromPlayerId`、`mode("active" | "passive")`。
- [x] 消息构建器新增：
      `TMessageBuilder.createWitchKillerObtainedNotification(...)`。
- [x] Effect 消息链路改造：
      `MessageService.handleWitchKillerObtained` 改为发结构化通知，不再写死文案字符串；
      `revealedInfo` 继续记录 `witch_killer_obtained`（`kill_holder` / `forced_wreck_transfer`）。
- [x] 强制转移提醒补齐（残骸化随机/规则转移）：
      `Mutations.killPlayer` 在 `wreck` 转移后写入 `witch_killer_obtained` 私密响应，并记录来源与模式。
- [x] 前端渲染改造：
      `src/components/ChatBox/MessageItem.tsx` 新增 `witch_killer_obtained` 分支，按 `mode` 展示文案。
- [x] 可观测性补充（Effect）：
      在 `AttackResolutionService` / `PlayerStateService` / `MessageService` 增加 `Effect.logInfo + annotateLogs`，
      输出归属变更链路（from/to/reason/source）。
- [x] 去重归属变更路径：
      移除 `PlayerStateService.killPlayer` 在 `kill_magic` 下的重复转移，避免与
      `AttackResolutionService -> transferWitchKiller` 双写导致的重复日志/重复入手牌风险。
- [x] 按重构收敛目标再次聚合到 `killPlayer`：
      `kill_magic/wreck(killer)` 下的魔女杀手归属转移与结构化通知统一由
      `PlayerStateService.killPlayer` 负责；
      `AttackResolutionService` 移除 `targetHadWitchKiller` 的手动转移/通知分支。
- [x] 纠偏并对齐 `Mutations.killPlayer`：
      `wreck` 且无 `killerId` 时，`PlayerStateService.killPlayer` 走随机存活玩家转移，
      并发送 `witch_killer_obtained(mode=passive)`。
- [x] `PlayerStateService` 依赖 `MessageService`，在转移发生时直接发送
      `witch_killer_obtained(mode=active|passive)` 并记录结构化日志。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/playerStateService.test.ts src/effect/services/messageService.test.ts src/effect/services/attackResolutionService.test.ts src/__tests__/resolution.test.ts src/__tests__/utils.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase2-attack.test.ts`

## 2026-02-14 增量记录（消息链路复核与修正）

- [x] 复核 `attackResolutionService` 消息链路后，恢复成功击杀后的目标死亡私信：
      `messageService.handleTargetDead(targetId, attackerId)`。
- [x] 恢复 `kill_magic` 成功后的魔女化私信：
      `messageService.handleTransformWitch(actorId)`（仅在未魔女化时发送，避免重复通知）。
- [x] 新增回归测试：
      `AttackResolutionService > emits dead response and transform message for successful kill_magic`。
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/attackResolutionService.test.ts src/effect/services/messageService.test.ts src/effect/services/playerStateService.test.ts src/effect/context/gameStateRef.test.ts src/effect/layers/gameLayers.test.ts src/game/resolution/phase2-attack.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase1-detect-barrier.test.ts src/game/resolution/phase3-check.test.ts src/game/resolution/applyPhaseResult.test.ts src/__tests__/attack.test.ts`

## 2026-02-14 增量记录（RandomAPI Context 直连与 killPlayer 分支收敛）

- [x] `GameRandom` 从 `Effect.Service` 改为 `Context.GenericTag<RandomAPI>`，并提供 `makeGameRandomLayer(random)` 与 `GameRandomDefault`。
- [x] `PlayerStateService.killPlayer` 引入 `WitchKillerTransferDecision` + `decideWitchKillerTransfer(...)`，去除嵌套 `Effect.gen` 导致的类型坍塌与 `{}` 推断。
- [x] 随机转移路径统一使用 `gameRandom.Die(...)`，移除服务内 `Math.random()`。
- [x] 移除 `PlayerStateService` 对 `GameRandomDefault` 的硬依赖，改为由外层显式注入随机层，避免默认层吞掉测试注入。
- [x] 注入点同步更新：
      `src/game/resolution/phase2-attack.ts` 使用 `makeGameRandomLayer(random)`
      `src/effect/services/playerStateService.test.ts` 显式提供 `makeGameRandomLayer(createMockRandom())`
      `src/effect/services/attackResolutionService.test.ts` 显式提供随机层
      `src/effect/layers/gameLayers.test.ts` 显式提供随机层
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/playerStateService.test.ts src/effect/services/messageService.test.ts src/effect/services/attackResolutionService.test.ts src/__tests__/resolution.test.ts src/game/resolution/integration.test.ts src/game/resolution/phase2-attack.test.ts`
      `bun test src/effect/layers/gameLayers.test.ts`

## 2026-02-14 增量记录（killPlayer 联合类型收敛 + 注释修复）

- [x] `IPlayerStateService.killPlayer` 入参改为联合类型 `KillPlayerInput`，按死因约束字段（`kill_magic/witch_killer` 必须带 `killerId`，`wreck` 可选）。
- [x] 删除 `WitchKillerTransferDecision` 与 `decideWitchKillerTransfer(...)`，在 `killPlayer` 内按联合类型直接分支，减少不必要的中间转换。
- [x] 保留 `RandomAPI` Context 用法：`wreck` 且无击杀者时，仍通过 `gameRandom.Die(...)` 随机选择接收者。
- [x] 同步调用方签名：
      `AttackResolutionService.executeKill` 改为接收 `KillPlayerInput`；
      `processAttackActions`/`gameLayers.test`/`playerStateService.test` 完成调用迁移。
- [x] 修复本轮变更涉及文件的中文注释乱码，并补充关键逻辑中文注释：
      `src/effect/services/playerStateService.ts`
      `src/effect/services/messageService.ts`
      `src/effect/context/gameStateRef.ts`
      `src/effect/layers/gameLayers.ts`
- [x] 验证通过：
      `pnpm build`
      `bun test src/effect/services/playerStateService.test.ts src/effect/services/attackResolutionService.test.ts src/effect/layers/gameLayers.test.ts src/game/resolution/phase2-attack.test.ts`

## 2026-02-14 增量记录（Selectors 去重收敛）
- [x] PlayerStateService 查询逻辑改为优先复用 `Selectors`，减少服务内重复状态计算。
- [x] 覆盖点：`isAlive`、`isImprisoned`、`getAlivePlayers`、`isWitchKillerHolder`、`getHandCount`、`hasBarrier`。
- [x] `killPlayer` 内 wreck 无击杀者分支改为复用 `Selectors.getAlivePlayers` 获取候选接收者。
- [x] `Selectors.isPlayerAlive` 语义保持为基于 `state.players` 判定（与你确认一致）。
- [x] 验证：`pnpm build` + phase2/effect 相关回归测试通过。
