## 目标
- 在 Next.js App Router 下新增 /api/auth/* 路由，封装所有与 Supabase 的交互
- 引入 Zod 完成端点入参/出参校验与错误结构化，符合社区常见实践
- 重构 authProvider，使其通过内部 API 端点（fetch）完成登录、登出、注册、鉴权、身份信息、密码找回/更新

## 现状与依据
- 项目采用 App Router，无现有 API 路由：[layout.tsx](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/app/layout.tsx)、[page.tsx](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/app/page.tsx)
- authProvider 直接使用 Supabase：核心实现在 [public.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/providers/auth-provider/public.ts#L5-L237)
- Supabase SSR 客户端与中间件已就绪：[server.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/utils/supabase/server.ts#L6-L35)、[middleware.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/utils/supabase/middleware.ts#L5-L57)

## 依赖与“标准做法”
- 新增依赖：zod（运行时 schema 校验，社区主流）
- 错误响应采用 RFC 7807（application/problem+json）结构：{ type, title, status, detail, instance }
- 路由采用 NextResponse.json 与明确的状态码（200/400/401/403/500）
- 在每个路由文件内定义 requestSchema 与 responseSchema；统一由一个 jsonRoute(wrapper) 执行校验与响应
- 代码遵循 @tsdoc；对纯函数调用添加 /*#__PURE__*/ 标记；需要惰性计算的回调添加 /*LAZY*/ 标记

## 路由设计
- 目录结构：在 src/app/api/auth 下创建下述路由（每个文件一个 route.ts）
  - POST /api/auth/login：邮箱密码登录或 OAuth 启动
  - POST /api/auth/logout：登出并清理会话 cookie
  - POST /api/auth/register：邮箱注册
  - GET /api/auth/check：返回 { authenticated, redirectTo?, logout? }
  - GET /api/auth/permissions：返回当前用户 role 或 null
  - GET /api/auth/identity：返回用户合成信息（合并 users 表元数据）
  - POST /api/auth/forgot-password：触发邮件找回（body 可携带 redirectTo）
  - POST /api/auth/update-password：已登录用户更新密码

## 路由实现要点
- 共享封装：新增 src/app/api/_lib/supabase.ts
  - 提供 withSupabase(request, handler)：按 [middleware.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/utils/supabase/middleware.ts#L12-L52) 的 cookie 读写模式创建 createServerClient，并将 cookie 写回 NextResponse
  - 提供 jsonRoute({ requestSchema, responseSchema, handler })：统一解析/校验 body，捕获错误并输出 RFC7807 问题详情
- 登录（/login）
  - providerName 存在：调用 supabase.auth.signInWithOAuth；返回 { success:true, redirectTo:data.url }（客户端据此跳转）
  - 邮箱密码：调用 supabase.auth.signInWithPassword；通过 cookies 回调写入会话；返回 { success:true }
- 登出（/logout）
  - 调用 supabase.auth.signOut；清理会话 cookie；返回 { success:true, redirectTo:"/login" }
- 注册（/register）
  - 调用 supabase.auth.signUp；返回 { success, redirectTo:"/" }（与现有行为保持一致）
- 鉴权（/check）
  - 调用 supabase.auth.getUser；按现有 [public.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/providers/auth-provider/public.ts#L106-L138) 逻辑返回 CheckResponse
- 权限（/permissions）
  - 读 supabase.auth.getUser().data.user?.role，返回字符串或 null
- 身份（/identity）
  - 读 supabase.auth.getUser；查询 users 表单行；合并为 { id, email, name, avatar, meta }
- 找回密码（/forgot-password）
  - 调用 supabase.auth.resetPasswordForEmail(email, { redirectTo })；返回 { success }
- 更新密码（/update-password）
  - 调用 supabase.auth.updateUser({ password })；返回 { success, redirectTo:"/" }

## authProvider 重构
- 新增 src/providers/auth-provider/api.ts：以 fetch 调用上述端点，导出 createApiAuthProvider
  - 定义与路由相同的 zod schema，确保前后端一致
  - 保持返回结构与 refine 的 AuthProvider 约定一致；OAuth 登录用返回的 redirectTo 进行前端跳转
- 客户端/服务端入口替换
  - [auth-provider.client.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/providers/auth-provider/auth-provider.client.ts#L7-L9)：改为导出 createApiAuthProvider()
  - [auth-provider.server.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/providers/auth-provider/auth-provider.server.ts#L5-L47)：改为通过 API 端点实现 check/getIdentity/logout（避免直接服务端 Supabase）

## 安全与一致性
- 不暴露服务角色密钥；沿用现有匿名密钥 [constants.ts](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/utils/supabase/constants.ts#L1-L3)
- 所有错误输出遵循 RFC7807，便于前端统一处理
- 路由与 provider 的 schema 保持一致，防止契约漂移

## 测试方案
- 登录/登出/注册流：在 /login 及受保护布局（如 [users/layout.tsx](file:///d:/workspace/@yuyi919/external/whole-ends-kneel/src/app/users/layout.tsx#L6-L18)）验证重定向与状态
- OAuth：调用 /api/auth/login providerName=github，验证返回 redirectTo 并完成跳转
- 身份与权限：使用 authProvider.getIdentity/getPermissions，核对 users 表与角色
- 找回/更新密码：验证邮件触发与已登录用户密码更新

## 交付内容
- 8 个 API 路由文件 + 1 个共享封装文件
- 新的 API 型 authProvider，并替换客户端/服务端入口引用
- zod 依赖新增与端到端 schema 校验；所有新增代码含 @tsdoc 与纯函数调用 /*#__PURE__*/ 标记

请确认以上方案，我将按该计划实现并提交改动。