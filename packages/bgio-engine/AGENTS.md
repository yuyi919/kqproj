# bgio-engine Effect-TS 重构 ToDo

## 目标与范围

- 目标：完成 `bgio-engine` 的 Effect-TS 重构收敛，先保正确性与可测性，再做结构优化。
- 范围：`src/game/resolution/phase2-attack.ts`、`src/game/moves.ts`、`src/game/assertions.ts`、`src/effect/context/*`、`src/effect/services/*`、`src/effect/layers/*`。
- 非范围：UI 组件、`apps/web`、数据库层。

## 优先级 ToDo

- [ ] `[P0]` 修复 `phase2` 失败吞掉问题  
      文件：`src/game/resolution/phase2-attack.ts`  
      结果：失败时不再静默返回空结果，改为可观测失败路径（抛出统一错误或返回显式失败结果并中断结算）。

- [ ] `[P0]` 统一服务返回签名为 Effect  
      文件：`src/effect/services/attackResolutionService.ts`、`src/effect/services/playerStateService.ts`、`src/effect/services/messageService.ts`  
      结果：服务方法改为 `Effect.Effect<A, E, R>`，移除同步 `throw` 和 `null` 语义。

- [ ] `[P0]` 补齐 `GameStateRef` 可变 Context 接口  
      文件：`src/effect/context/gameStateRef.ts`  
      结果：提供 `get/set/update` 三个入口；服务层通过这些入口读写状态，不直接依赖裸对象副作用。

- [ ] `[P1]` 错误建模统一为 `Data.TaggedError`  
      文件：`src/effect/errors.ts`、`src/effect/services/*.ts`  
      结果：业务失败走 typed error，不混用 `throw` 与字符串 reason。

- [ ] `[P1]` 为 Effect 服务层补齐测试  
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

- [ ] `GameStateRef` 从仅 `get` 扩展为 `get/set/update`。
- [ ] `IAttackResolutionService`、`IPlayerStateService`、`IMessageService` 核心方法签名改为 `Effect.Effect<Success, Error, R>`。
- [ ] `PlayerNotFound`、`QuotaExceeded`、`BarrierProtected` 等错误统一为 `Data.TaggedError`。
- [ ] `PlayerId/CardId` 在服务边界参数类型中启用（逐步替换裸 `string`）。

## 测试场景（最小闭环）

- [ ] `phase2` 执行失败时：不会静默返回“空成功结果”。
- [ ] 攻击者已死：标记 `actor_dead` 且不误杀目标。
- [ ] barrier 防御：目标存活，barrier 按规则消耗。
- [ ] witch_killer 成功后：对持有者的后续攻击按规则失败。
- [ ] 配额超限：超额动作失败且卡牌消耗行为符合规则。
- [ ] kill 击杀 witch_killer 持有者：转移逻辑正确。
- [ ] `GameStateRef.update`：服务写入可观察，状态一致性不回退。
- [ ] 服务层 typed error：可被 `catchTag` 精确捕获。

## 验收标准

- [ ] `pnpm build` 通过。
- [ ] 关键规则场景回归通过（witch_killer 优先级、barrier 防御、配额超限、目标已死、魔女杀手转移）。
- [ ] 新增服务测试可独立运行并覆盖失败路径。
- [ ] `phase2` 不再存在失败吞掉的静默路径。
- [ ] 重构后文档与代码现状一致。

## 默认约束

- [ ] 只维护当前包文档：`packages/bgio-engine/AGENTS.md`。
- [ ] 文档语言默认中文，采用可勾选待办格式（`- [ ]`）。
- [ ] 执行顺序默认：先做稳定性与可测性（`P0/P1`），再做结构优化与文档对齐（`P2/P3`）。
