## 目标
重构 [api.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/providers/auth-provider/api.ts)，移除手写的 `fetch` 调用，改为使用 Hono RPC 客户端（`rpc`）以获得更好的类型安全和开发体验。

## 修改方案
### 1. 移除旧实现
- 移除 `BASE` 常量。
- 移除手写的 `api<T>` 工具函数，其职责将由 Hono RPC 客户端和统一的错误处理逻辑替代。

### 2. 引入 RPC 客户端
- 从 `@utils/api/rpc` 导入 `rpc`。

### 3. 重构 AuthProvider 方法
使用 `rpc.auth` 下的对应方法替换原有的 `api` 调用：
- `login`: 改为 `rpc.auth.login.$post({ json: payload })`
- `logout`: 改为 `rpc.auth.logout.$post()`
- `register`: 改为 `rpc.auth.register.$post({ json: { email, password } })`
- `check`: 改为 `rpc.auth.check.$get()`
- `getPermissions`: 改为 `rpc.auth.permissions.$get()`
- `getIdentity`: 改为 `rpc.auth.identity.$get()`
- `forgotPassword`: 改为 `rpc.auth["forgot-password"].$post({ json: { email, redirectTo } })`
- `updatePassword`: 改为 `rpc.auth["update-password"].$post({ json: { password } })`

### 4. 统一错误处理
- 封装一个通用的 `handleResponse` 函数（或在各方法内处理），检查 `res.ok`。
- 如果返回 `application/problem+json`，则按照 RFC 7807 规范解析并抛出错误，保持与现有逻辑一致。
- 利用 Hono 的 `InferResponseType` 确保返回数据的类型正确性。

## 预期效果
- 代码更加简洁，去除了冗余的路径字符串定义。
- 前后端接口契约通过 TypeScript 自动同步，减少因接口变更导致的运行时错误。
- 保持原有的错误处理行为，对 UI 层无感知。

确认此方案后，我将开始实施。