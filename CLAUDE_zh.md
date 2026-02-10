# CLAUDE.md

本文档为在该代码库中使用 Claude Code (claude.ai/code) 的开发提供指导。

## 仓库概览

**项目类型：** 单工作区单体仓库（Monorepo），包含一个 Next.js 应用
**主应用：** `apps/web` - 一个全栈 Web 应用，特色是多人"女巫审判"桌游
**包管理器：** pnpm（工作区单体仓库）
**运行时：** Node.js 20+，Bun（用于测试和 WebSocket 服务器）

## 架构

### 技术栈

- **框架：** Next.js 16（App Router）
- **UI 框架：** Refine（管理/B2B 框架）+ Ant Design v6
- **游戏引擎：** boardgame.io（实时多人游戏逻辑）
- **数据库：** PostgreSQL + Prisma ORM + ROCICORP Zero（实时同步）
- **认证：** Supabase（集成 Clerk Router 实现自定义认证）
- **实时通信：** Socket.IO + Postgres 适配器
- **API：** Hono（轻量级 Web 框架，兼容边缘函数）
- **国际化：** next-intl（支持英文和中文）
- **样式：** Tailwind CSS v4 + Ant Design
- **状态管理：** TanStack React Query（服务器状态），Zustand（客户端状态，根据依赖推断）
- **验证：** Zod

### 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                   │
│  apps/web/src/app/                                          │
│  ├── (auth)/       → 登录、注册、密码重置                   │
│  ├── (protected)/  → 受保护页面（博客、用户、聊天）         │
│  ├── api/          → Hono API 路由（通过 Vercel 适配器）   │
│  ├── game/         → 主游戏页面                            │
│  ├── lobby/        → 游戏房间大厅                          │
│  └── room/[id]/    → 独立游戏房间                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Refine Core  │  │  boardgame.io   │  │  Socket.IO   │
│  + Ant Design │  │  Game Engine    │  │  (实时)      │
└───────────────┘  └─────────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  Data Providers  │
                  │  (Refine 模式)   │
                  └──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Prisma     │   │   Zero Sync  │   │  PostgreSQL  │
│  + Postgres  │   │  (实时)      │   │   (Supabase) │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 关键目录

- `apps/web/src/app/` - Next.js App Router 页面和布局
- `packages/bgio-engine/src/` - boardgame.io 游戏实现（女巫审判游戏）
- `apps/web/src/providers/` - Refine 提供者（认证、数据、实时、i18n）
- `apps/web/src/contexts/` - React 上下文（颜色模式、服务器认证）
- `apps/web/src/components/` - 可复用 UI 组件
- `apps/web/prisma/` - 数据库模式
- `apps/web/src/generated/` - 生成的代码（Prisma 客户端、Zero 类型）
- `apps/web/src/hooks/` - 自定义 Hooks（认证、Socket、应用）
- `apps/web/src/i18n/` - 国际化（语言：英文、简体中文）

### 游戏架构（boardgame.io）

核心游戏逻辑位于 `packages/bgio-engine/src/`：

- `game/` - 游戏定义、移动操作、阶段、夜间行动结算
- `components/` - 游戏板 UI 的 React 组件
- `hooks/` - 游戏状态管理的自定义 Hooks
- `contexts/` - 游戏状态的 React Context
- `utils.ts` - Selectors（派生状态）和工具函数
- `types.ts` - TypeScript 类型定义

模式：使用 boardgame.io 的 Reducer 模式，包含明确的 `moveFunctions`、`phaseConfigs` 和 `resolveNightActions`。

## 开发命令

### 根目录（单体仓库）

```bash
pnpm dev          # 启动所有应用的开发模式
pnpm build        # 构建所有应用
pnpm start        # 以生产模式启动所有应用
pnpm lint         # 对所有应用进行 Lint 检查
pnpm test         # 在所有应用中运行测试
```

### 应用特定（apps/web）

```bash
pnpm ---filter @whole-ends-kneel/web dev     # 启动开发服务器
pnpm --filter @whole-ends-kneel/web build    # 构建生产版本
pnpm --filter @whole-ends-kneel/web start    # 启动生产服务器
pnpm --filter @whole-ends-kneel/web lint     # 运行 ESLint
pnpm --filter @whole-ends-kneel/web test     # 运行 Bun 测试套件
pnpm --filter @whole-ends-kneel/web test:watch  # 监听模式
```

### 数据库命令

```bash
pnpm --filter @whole-ends-kneel/web db:pull   # 从数据库拉取模式
pnpm --filter @whole-ends-kneel/web db:gen    # 生成 Prisma 客户端
```

### WebSocket/聊天服务器

`apps/web/` 目录下的 `bot.ts` 文件是一个独立的 Bun WebSocket 服务器，用于聊天功能。运行方式：

```bash
cd apps/web && bun run bot.ts
```

服务器默认在 3000 端口运行（可通过 `PORT` 环境变量配置）。

## 配置文件

- `pnpm-workspace.yaml` - 工作区配置（apps/_, packages/_）
- `apps/web/next.config.mjs` - Next.js 配置，包含 next-intl 插件和独立输出
- `apps/web/tsconfig.json` - TypeScript 配置，包含路径别名（`@/*`）
- `apps/web/.eslintrc.json` - 继承自 `next/core-web-vitals`
- `apps/web/.env` - 环境变量（切勿提交敏感数据）
- `apps/web/prisma/schema.prisma` - 数据库模式（包含 Zero 生成器）

## 环境变量

位于 `apps/web/.env`：

- `DATABASE_URL` - PostgreSQL 连接池地址（Supabase）
- `DIRECT_URL` - 迁移使用的直接连接
- `ZERO_UPSTREAM_DB` - Zero 同步数据库地址
- `DB_PWD` - 数据库密码（脚本中使用）

可能需要其他变量（检查代码）：

- Supabase 凭证（匿名密钥、服务角色密钥、URL）
- Clerk/NextAuth 密钥（JWT 密钥、Clerk 密钥）
- Socket.IO 服务器配置

## 测试

测试使用 **Bun 内置测试运行器**。

测试文件与源文件共存，使用 `__tests__/` 模式或 `.test.ts` 扩展名。

示例：

```bash
# 运行所有测试
pnpm test

# 运行特定应用的测试
pnpm --filter @whole-ends-kneel/web test

# 监听模式
pnpm --filter @whole-ends-kneel/web test:watch

# 运行特定测试文件
bun test packages/bgio-engine/src/__tests__/game.test.ts
```

测试结构：使用 `bun:test` 中的 `describe`, `it`, `expect`。游戏逻辑测试使用模拟函数。

## 代码风格

- TypeScript 严格模式：`strict: true`
- ESLint 继承自 `next/core-web-vitals`
- Prettier 配置在 `.prettierrc`
- 使用路径别名：`@/*` → `apps/web/src/*`
- 推荐使用 Conventional Commits（目前尚未强制执行）
- `.npmrc` 设置 `legacy-peer-dependencies=true` 和 `strict-peer-dependencies=false`（依赖解析所需）

## 数据库模式

### 主要模型

- `users` - 用户账户（集成 Supabase 认证）
- `groups` - 用户群组/团队
- `group_members` - 用户与群组的多对多关系
- `messages` - 聊天消息（关联到群组）
- `game_rooms` - 多人游戏房间
- `game_players` - 游戏房间中的玩家（带状态）

关键特性：

- 某些表启用了行级安全（RLS）（查看 Prisma 模式注释）
- UUID 作为主键（通过 `dbgenerated("gen_random_uuid()")` 生成）
- 带有 `@db.Timestamptz(6)` 的时间戳（UTC）
- 枚举：`GameRoomStatus`（WAITING, PLAYING, FINISHED, DESTROYED），`GamePlayerStatus`（JOINED, READY, LEFT）

Prisma 生成：

- 客户端：`apps/web/src/generated/prisma/client.ts`
- Zero（实时）：`apps/web/src/generated/zero/schema.ts`（如果配置了生成器）

## API 架构

API 路由集中在 `apps/web/src/app/api/[[...route]]/route.ts`，使用 Hono。

路由处理器使用 Hono Vercel 适配器处理所有 HTTP 方法（GET, POST, PATCH, DELETE）。

数据提供者（`apps/web/src/providers/data-provider/api.ts`）实现 Refine 的 `DataProvider` 接口，通过 `@utils/api/rpc` 调用 Hono API（自动生成的类型安全 RPC 客户端）。

模式：

- 客户端使用 Refine Hooks（`useList`, `useCreate`, `useCustom` 等）
- 数据提供者封装对 Hono API 的 RPC 调用
- Hono API 通过 Prisma 处理业务逻辑和数据库操作

## 认证流程

- 使用 Supabase 作为认证后端
- 服务端：`auth-provider.server.ts` 包装 Supabase 服务端客户端
- 客户端：`auth-provider.client.ts` 包装 Supabase 浏览器客户端
- `ServerAuthProvider` 上下文将服务端认证用户传递到客户端
- 访问令牌存储在 Cookie 中（Supabase SSR 辅助函数）
- `public.ts` 提供 Refine 兼容的认证提供者封装

## 实时功能

两个实时系统：

1. **Zero (ROCICORP)** - 数据库级实时同步（Prisma → 客户端）
   - 用于 Refine 表格的实时数据更新
   - 通过 Prisma Zero 生成器配置

2. **Socket.IO** - 游戏状态同步
   - 用于多人游戏状态更新
   - `live-provider/socketio.ts` 实现 Refine 的 LiveProvider
   - 游戏移动和状态通过 Socket.IO 房间广播

## 国际化（i18n）

- 使用 `next-intl` 配合 App Router
- 语言：英语（`en`）和简体中文（`zh-CN`）
- 配置位置：`apps/web/src/i18n/`
- 消息文件：`apps/web/src/i18n/locales/*.ts`
- 类型安全方法（`next.config.mjs` 中有插件配置）

检查 i18n 完整性的脚本：`apps/web/scripts/check-i18n.ts`（结果在 `i18n-check-results.txt`）

## 游戏与引擎

`bgio-engine` 是围绕 boardgame.io 的封装，用于"女巫审判"游戏（类似狼人杀/杀人游戏的社交推理游戏）。

关键文件：

- `packages/bgio-engine/src/game/index.ts` - 主游戏定义（`WitchTrialGame`）
- `packages/bgio-engine/src/types.ts` - 游戏状态和类型
- `packages/bgio-engine/src/utils.ts` - Selectors（派生状态）和工具函数
- `packages/bgio-engine/src/components/Board/` - 主游戏板 UI
- `packages/bgio-engine/src/components/` - 玩家列表、手牌、投票、聊天等
- `packages/bgio-engine/src/hooks/useWitchTrial.ts` - 游戏集成的 Hook

游戏流程：

- 夜间阶段 → 白天阶段 → 投票 → 结算
- 角色：女巫、猎人、村民等
- 使用 boardgame.io 的基于回合的多人模型，服务器权威

## 重要模式和约定

### Refine 资源

`RefineProvider.tsx` 中配置的资源映射到页面：

- `groups` → 显示在 `/blog-posts`（注意：名称不匹配，但页面在 `app/(protected)/blog-posts/`）
- `messages` → 房间列表在 `/room`
- `users` → CRUD 在 `/users`
- `categories` → CRUD 在 `/categories`

### Next.js App Router

- 默认使用 React Server Components
- 交互式组件使用 `"use client"` 指令
- 布局可以分组：`(auth)`、`(protected)` 用于路由组
- 未明显使用 Server Actions；改用 API 路由

### 路径别名

- `@/*` → `apps/web/src/*`（在 tsconfig.json 中配置）
- `@providers/*`, `@components/*`, `@hooks/*`, `@lib/*`, `@utils/*`, `@contexts/*`

### Socket.IO 集成

- 服务端：通过 Hono API 路由的自定义集成（查看 `providers/live-provider/api.ts` 和 `socketio.ts`）
- 客户端：Socket.IO 客户端，带访问令牌认证
- WebSocket 端点：`/api/socket.io`（标准 Socket.IO 路径）

## 自定义技能

此仓库包含定制的 Claude Code 技能：

- `.agents/skills/antd-design/` - Ant Design 特定指导
- `.agents/skills/boardgame-io-docs/` - boardgame.io 文档
- `.agents/skills/es-toolkit-docs/` - ES Toolkit 文档
- `.claude/skills/` - 额外的标准 Claude Code 技能

这些技能在使用这些库时提供上下文感知的辅助。

## 常见开发任务

### 开始开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认在 http://localhost:3000）
pnpm dev
```

### 开发游戏引擎

- 游戏逻辑：`packages/bgio-engine/src/game/`
- 游戏 UI：`packages/bgio-engine/src/components/`
- 测试：`packages/bgio-engine/src/__tests__/`

修改游戏逻辑时频繁运行测试。

### 数据库变更

1. 更新 `apps/web/prisma/schema.prisma`
2. 生成 Prisma 客户端：`pnpm --filter @whole-ends-kneel/web db:gen`
3. 创建并应用迁移：在 apps/web 目录运行 `npx prisma migrate dev --name <名称>`
4. 检查 `apps/web/src/generated/prisma/` 中的生成类型

### 添加 API 端点

- 在 `apps/web/src/app/api/[[...route]]/route.ts` 中扩展 Hono 应用或创建新的路由段
- 遵循 Hono 的路由模式：`app.get('/path', handler)` 等
- 如果需要新资源，更新 `providers/data-provider/api.ts` 中的 Refine DataProvider

### 添加 i18n 字符串

1. 在 `apps/web/src/i18n/locales/en.ts` 和 `zh-CN.ts` 中添加键
2. 在组件中使用 `useTranslation()` hook 或 `t('key')`
3. 运行 `pnpm --filter @whole-ends-kneel/write exec tsx scripts/check-i18n.ts` 验证完整性

### 格式化与 Lint

```bash
pnpm lint          # 运行 ESLint（Next.js 配置）
# 如果 IDE 配置了 Prettier，保存时自动运行；否则使用：
pnpm --filter @whole-ends-kneel/write   #（如果安装了 prettier）
```

### Socket.IO 调试

- 确保挂载了 Socket.IO 服务器（检查 `socketio.ts` 和 API 路由）
- 浏览器开发工具 → Network → WS 标签
- 服务器日志在运行 API 的终端中
- 聊天服务器（`bot.ts`）是独立的；用于一般 WebSocket 示例，不是游戏用的

## 部署说明

- Next.js 输出：`standalone`（容器友好）
- Vercel 兼容（使用 Vercel 适配器用于 Hono）
- 构建命令：`pnpm build`（根目录）或 `pnpm --filter @whole-ends-kneel/web build`
- 启动命令：`pnpm start` 或 `pnpm --filter @whole-ends-kneel/web start`

所需环境：

- PostgreSQL 数据库（推荐 Supabase）
- Supabase 认证凭证
- 配置了 Zero 同步（上游数据库）

## 注意事项与重要说明

- **认证提供者分离**：`auth-provider.server.ts` 和 `auth-provider.client.ts` - 确保正确区分客户端和服务端使用
- **Zero 生成器**：Prisma 模式有 `generator zero`，但实际的 Zero 客户端可能在 `@rocicorp/zero` 中。生成文件位于 src/generated/zero/
- **boardgame.io 客户端与服务端**：游戏同时使用客户端和服务端组件。主对局由 boardgame.io 服务器管理（可能通过独立进程或无服务器函数？）。查看 `packages/bgio-engine/src/example.tsx` 了解集成模式。
- **Socket.IO 传输**：游戏可能使用 Socket.IO 进行实时移动。`liveProvider` 使用 socketio 进行 Refine 实时查询；游戏专用的 socket 可能独立。
- **TypeScript 严格模式**：已启用。注意 `any` 类型（测试/模拟中存在一些）。
- **单体仓库**：目前只有一个应用（`web`）。尚无内部包。
- **中文语言**：i18n 包含简体中文（`zh-CN`）。添加新字符串时保持两种语言同步。
- **Ant Design v6**：使用最新主要版本。查看 `.claude/skills/antd-design/` 了解模式。
- **Next.js 16**：支持 React 19。`next.config` 中 `reactStrictMode: false`（如果设为 true 在开发中可能引起双重渲染）。

## 调试技巧

1. **游戏状态问题**：检查 `packages/bgio-engine/src/utils.ts` 中的 Selectors 了解派生状态。游戏逻辑是 `game/` 目录中的纯函数。
2. **认证错误**：验证 Supabase 连接和 Cookie 处理。检查 `ServerAuthProvider` 和认证提供者实现。
3. **API 错误**：Hono 路由位于 `app/api/[[...route]]/route.ts`。数据提供者使用 RPC 调用。检查网络标签中的请求/响应。
4. **实时功能不工作**：Zero 和 Socket.IO 都需要正确的 DB/WS 设置。检查连接和订阅。
5. **i18n 缺少键**：如果键缺失则回退到英文。使用 `scripts/check-i18n.ts` 查找未翻译的键。

## 资源

- [Next.js 16 文档](https://nextjs.org/docs)
- [Refine 文档](https://refine.dev/docs)
- [Ant Design v6](https://ant.design/docs/react/use-with-next)
- [boardgame.io](https://boardgame.io/docs)
- [Prisma](https://www.prisma.io/docs)
- [Zero (ROCICORP)](https://zero.rocicorp.dev/docs)
- [Hono](https://hono.dev/docs)
- [Socket.IO](https://socket.io/docs/v4)
- [next-intl](https://next-intl-docs.vercel.app/)

## CLAUDE.md 维护

在以下情况更新此文件：

- 添加新的主要依赖
- 架构发生重大变化
- 常见工作流变化（构建、测试、部署）
- 出现非显而易见的新模式

不要为每次微小更改更新；保持高层面并专注于操作知识。
