## 目标
- 使用 Hono 在 Next.js App Router 下重构现有 /api/auth/* 端点
- 采用单一可选 catch-all 路由：src/app/api/[[...route]]/route.ts，使用 slug（/auth/:action）风格统一分发
- 保留 zod 校验与 RFC7807 错误响应；与 Supabase SSR 会话兼容

## 依赖与适配
- 新增依赖：hono（使用 hono/vercel 适配导出 GET/POST/PUT/DELETE）
- 校验：继续使用 zod；集成 hono/zod-validator 进行入参校验
- 运行时：保持 Node runtime（与现有 SSR 一致）；如需 Edge 可之后切换

## 路由设计（单文件）
- 文件：src/app/api/[[...route]]/route.ts
- Hono 应用：basePath("/api")，在其下挂载 /auth/*
- 具体路径：
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/register
  - GET  /api/auth/check
  - GET  /api/auth/permissions
  - GET  /api/auth/identity
  - POST /api/auth/forgot-password
  - POST /api/auth/update-password
- 命名导出：export const GET = handle(app); export const POST = handle(app)

## Supabase 集成
- 在 Hono 中实现 createServerClient cookies 适配：
  - get：从 c.req.header("cookie") 解析
  - set/remove：通过 c.cookie(name, value, options) 设置 Set-Cookie
- 保持现有匿名密钥与常量来源：@utils/supabase/constants

## 校验与错误
- 通过 hono/zod-validator 校验 body/query，失败统一返回 400
- 错误响应采用 RFC7807（application/problem+json）：{ type, title, status, detail, instance }
- 成功响应沿用现有结构（success/redirectTo/数据）以兼容当前 authProvider

## 与现有代码的衔接
- authProvider（API 版）保持 base /api/auth，不需要改动路径
- 替换：删除/废弃 src/app/api/auth/* 多文件实现，全部由 [[...route]]/route.ts 承载
- 共享封装：src/app/api/_lib/supabase.ts 将被合并到 Hono 路由文件或抽为 server 层工具（可选）

## 实施步骤
1. 安装 hono 依赖
2. 新增 src/app/api/[[...route]]/route.ts（Hono + 端点 + Supabase cookie 适配 + zod 校验）
3. 移除旧的多路由文件 src/app/api/auth/*，避免重复匹配
4. 保持 providers/auth-provider/api.ts 不变（已指向 /api/auth/*）
5. 运行开发服务并验证各流：登录/登出/注册、OAuth 跳转、身份/权限、找回与更新密码

## 验证与回滚
- 验证：在受保护布局与登录页核对重定向与会话
- 如发现适配问题，可快速回滚为原多文件 route.ts 实现（保留在 VCS 历史）

## 交付内容
- 单文件 Hono 路由（catch-all + slug 分发）
- 删除旧 API 路由文件
- 与 Supabase SSR cookie 兼容的适配逻辑
- zod + RFC7807 一致的校验与错误输出

确认后我将开始实施，并完成替换与验证。