## 目标
创建基于 Hono + Supabase 的 API 端点，并实现对应的 Refine Data Provider。这将使数据操作通过后端 API 转发，而不是直接在客户端调用 Supabase，从而增强安全性和可扩展性。

## 技术方案

### 1. Hono 后端实现
在 `src/server/api/routes` 下新增 `data.ts`，实现通用的数据操作接口：
- **动态资源路由**: 使用 `/:resource` 处理所有表。
- **CRUD 操作**:
  - `GET /:resource`: 获取列表，支持分页、排序和复杂过滤（参考 Supabase Data Provider 逻辑）。
  - `GET /:resource/:id`: 获取单条记录。
  - `POST /:resource`: 创建记录。
  - `PATCH /:resource/:id`: 更新记录。
  - `DELETE /:resource/:id`: 删除记录。
  - `getMany`, `createMany`, `updateMany`, `deleteMany` 等批量操作。
- **Zod 校验**: 为分页、过滤器和排序器定义 Zod Schema，确保入参类型安全。
- **Supabase 集成**: 利用现有的 `supabaseMiddleware` 获取已认证的 Supabase 客户端。

### 2. Refine Data Provider 实现
在 `src/providers/data-provider` 下新增 `api.ts`：
- **RPC 调用**: 使用 `rpc` 客户端调用上述 Hono 端点。
- **类型适配**: 将 Refine 的 `Filters`, `Sorters`, `Pagination` 转换为 API 所需的参数。
- **兼容性**: 确保返回的数据结构符合 Refine 的 `GetListResponse`, `GetOneResponse` 等约定。

### 3. 注册与应用
- 在 `src/server/api/app.ts` 中挂载 `data` 路由。
- 更新 `src/providers/data-provider/index.ts` 以导出新的 API Data Provider。

## 实施步骤

1.  **定义 Schema**: 在 `src/server/api/routes/data.ts` 中定义通用的请求参数 Zod Schema。
2.  **实现 Hono 逻辑**: 编写各 CRUD 方法，复用 Supabase 的查询构建能力。
3.  **挂载路由**: 修改 `src/server/api/app.ts`。
4.  **编写 Data Provider**: 实现 `src/providers/data-provider/api.ts`。
5.  **更新导出**: 修改 `src/providers/data-provider/index.ts` 以切换到新 provider。

## 验证方案
- 检查 `rpc` 类型推导是否正确覆盖了所有资源。
- 在前端页面（如 Blog Posts 或 Categories）测试列表加载、编辑和删除操作。
- 观察网络请求，确认所有数据操作均通过 `/api/data/*` 路径。

确认方案后，我将开始分步实现。