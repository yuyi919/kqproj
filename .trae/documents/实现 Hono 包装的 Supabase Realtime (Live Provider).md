## 任务目标
在 Hono 中实现基于 SSE (Server-Sent Events) 的可靠实时消息包装器，通过“断点续传”机制模拟 WebSocket 的实时效果，同时确保在 Next.js Serverless 环境下的高可用性。

## 核心机制：SSE + Last Event ID
1. **接收 (Pull/Push)**: 客户端通过 SSE 订阅变更。如果连接断开，重连时带上最后接收到的消息 ID (`last_id`)。
2. **补偿 (Compensation)**: 服务端接收到 `last_id` 后，先从数据库查询并补发缺失的消息，再进入实时监听状态。
3. **发送 (Post)**: 客户端通过标准的 HTTP POST 发送消息。

## 实施步骤

### 1. 后端 (Hono) 实现
- **创建路由**: `src/server/api/routes/live.ts`。
- **核心逻辑**:
  - 解析 `resource` 和 `last_id`。
  - **补发逻辑**: 若有 `last_id`，查询该 ID 之后的记录并推送。
  - **流式监听**: 调用 `streamSSE`，服务端订阅 Supabase 变更并实时转发。
  - **健壮性**: 实现 30s 一次的心跳包 (`ping`) 维持连接。

### 2. 前端 (Refine) 实现
- **创建 Provider**: `src/providers/live-provider/api.ts`。
- **核心逻辑**:
  - 内部维护 `lastEventId` 状态。
  - 实现自动重连逻辑，重连时动态构建含 `last_id` 的 URL。
  - 映射 Supabase 载荷为 Refine 标准的 `LiveEvent`。

### 3. 注册与导出
- 在 `src/server/api/app.ts` 挂载 `live` 路由。
- 在 `src/providers/data-provider/index.ts` 导出此 `liveProvider`。

## 验证方案
- **断网测试**: 手动断开网络并在此期间产生数据，恢复后确认数据是否自动补全。
- **并发测试**: 多个客户端同时订阅，确认消息推送的独立性与实时性。

是否开始执行？