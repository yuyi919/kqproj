# 项目文档（AI Agent 参考）

## 项目概述

本项目是一个**基于聊天的多人联机类狼人杀文字游戏平台（魔女审判）**，内置管理面板。项目代号 `whole-ends-kneel`，采用 Next.js + Refine + Supabase 技术栈构建，支持实时多人游戏、卡牌系统、监禁投票等功能。

### 核心功能

- **魔女审判游戏引擎**：完整的游戏逻辑（卡牌管理、魔女化机制、昼夜循环、监禁投票、攻击结算）
- **实时聊天系统**：游戏内文字交流（昼夜频道分离）
- **游戏房间管理**：创建/加入/离开游戏房间，支持多房间并行
- **内置管理面板**：用户管理、游戏数据监控、系统配置
- **卡牌系统**：魔女杀手、结界魔法、杀人魔法、探知魔法、检定魔法等五种卡牌

### 技术栈

| 类别       | 技术                                   |
| ---------- | -------------------------------------- |
| 框架       | Next.js 16 (App Router)                |
| UI 框架    | React 19 + Ant Design 6 + Ant Design X |
| 管理框架   | Refine (@refinedev/core)               |
| 后端       | Supabase (PostgreSQL + Auth)           |
| ORM/数据库 | Prisma 7                               |
| API 框架   | Hono 4                                 |
| 实时通信   | Socket.IO 4 + Supabase Realtime        |
| 语言       | TypeScript 5                           |
| 包管理器   | pnpm                                   |

## 架构设计

### 目录结构

```
├── apps/
│   └── web/
│       └── src/
│           ├── app/                    # Next.js App Router
│           │   ├── (auth)/             # 认证路由组
│           │   │   ├── login/          # 登录
│           │   │   ├── register/       # 注册
│           │   │   └── forgot-password/# 忘记密码
│           │   ├── (protected)/        # 受保护路由组 (Refine Admin)
│           │   │   ├── users/          # 用户管理
│           │   │   ├── rooms/          # 游戏房间管理
│           │   │   ├── games/          # 游戏记录管理
│           │   │   └── settings/       # 系统配置
│           │   ├── api/[[...route]]/   # Hono API 路由处理器
│           │   ├── game/               # 游戏相关页面
│           │   │   ├── rooms/          # 游戏房间列表
│           │   │   └── room/[id]/      # 游戏房间（游戏大厅）
│           │   ├── lobby/              # 游戏大厅页面
│           │   ├── layout.tsx          # 根布局（Refine 提供者）
│           │   └── page.tsx            # 首页
│           ├── components/             # React 组件
│           │   ├── game/               # 游戏组件
│           │   │   ├── GameRoom/       # 游戏房间组件
│           │   │   ├── GameBoard/      # 游戏面板（昼夜界面）
│           │   │   ├── PlayerList/     # 玩家列表
│           │   │   ├── RoleCard/       # 角色卡
│           │   │   ├── VotePanel/      # 投票面板
│           │   │   └── ChatBox/        # 游戏内聊天
│           │   ├── chat/               # 聊天组件
│           │   ├── auth-page/          # 认证页面组件
│           │   ├── header/             # 头部组件
│           │   ├── ui/                 # 通用 UI 组件
│           │   └── layout/             # 布局组件
│           ├── contexts/               # React 上下文
│           │   ├── color-mode/         # 主题（暗黑/亮色）
│           │   ├── server-auth.tsx     # 服务端认证上下文
│           │   └── game/               # 游戏状态上下文 (Legacy)
│           ├── hooks/                  # 自定义 React Hooks
│           │   ├── use-socket.ts       # Socket.IO Hook
│           │   └── use-user.ts         # 用户状态 Hook
│           ├── interfaces/             # TypeScript 接口
│           │   ├── socket.ts           # Socket 事件类型
│           │   ├── game.ts             # 游戏相关类型
│           │   ├── role.ts             # 角色类型定义
│           │   └── user.ts             # 用户类型定义
│           ├── lib/                    # 核心逻辑库 (详见各子目录 README)
│           │   ├── clerk-router/       # 自定义路由库
│           │   └── utils/              # 工具函数
│           ├── middleware.ts           # Next.js 认证中间件
│           ├── pages/api/              # Next.js Pages Router（Socket.IO）
│           │   └── socket.ts           # Socket.IO 服务器初始化
│           ├── providers/              # Refine 提供者
│           │   ├── auth-provider/      # 认证提供者（Supabase）
│           │   ├── data-provider/      # 数据提供者（Supabase）
│           │   ├── live-provider/      # 实时提供者（Socket.IO）
│           │   └── devtools/           # Refine 开发工具
│           ├── server/                 # 服务端代码
│           │   └── api/
│           │       ├── app.ts          # Hono 应用入口
│           │       ├── middleware/     # Hono 中间件
│           │       ├── routes/         # API 路由（认证、数据、游戏）
│           │       ├── socket-io.ts    # Socket.IO 事件处理器
│           │       └── game/           # 游戏服务端逻辑
│           ├── utils/                  # 工具函数
│           │   ├── api/rpc.ts          # Hono RPC 客户端
│           │   └── supabase/           # Supabase 客户端工具
│           └── generated/prisma/       # Prisma 生成的客户端
├── packages/
│   └── bgio-engine/            # BoardGame.io 游戏引擎 (Active)
│       ├── src/
│       │   ├── game/           # 核心逻辑
│       │   ├── components/     # UI 组件
│       │   └── legacy-core/    # 原始算法复用 (Legacy Core)
├── prisma/
│   ├── schema.prisma           # 数据库 Schema
│   └── config.ts               # Prisma 配置
├── public/                     # 静态资源
└── .env                        # 环境变量
```

### 待办事项 / Known Issues

1. **路由重构**：当前管理后台路由位于 `(protected)` 组下，需要重构以恢复 `/admin/*` 的路由结构，与文档描述保持一致。

### 应用架构

1. **前端层**：Next.js App Router + Refine 框架
   - Refine 提供认证、数据获取、路由和状态管理
   - Ant Design 用于 UI 组件
   - Ant Design X 用于聊天 UI
   - 游戏界面使用自定义组件

2. **API 层**：Hono.js 框架挂载于 `/api`
   - RESTful 端点用于认证、CRUD 操作、游戏逻辑
   - 使用 Zod 进行请求验证
   - 与 Supabase 集成进行数据库操作

3. **实时层**：Socket.IO 为主
   - 游戏状态实时同步
   - 聊天消息广播
   - 玩家行动（投票、技能使用）实时通知

4. **游戏引擎层**：独立的魔女审判逻辑库
   - 卡牌管理与分配
   - 游戏阶段管理（晨间/午间/夜间/结算）
   - 魔女化与残骸化判定
   - 监禁投票与攻击结算
   - 手牌遗落分配

5. **数据层**：Supabase
   - PostgreSQL 数据库 + RLS
   - 内置认证系统
   - 连接池通过 Supabase Pooler

### 数据库 Schema

核心数据表：

- **users**：用户档案（id, username, email, avatar_url, stats, created_at）
- **game_rooms**：游戏房间（id, name, host_id, status, config, max_players, created_at）
- **game_players**：游戏玩家（id, game_room_id, user_id, role, status, seat_number）
- **game_rounds**：游戏回合（id, game_room_id, round_number, phase, actions, results）
- **messages**：聊天消息（id, game_room_id, user_id, content, channel, created_at）
- **votes**：投票记录（id, game_room_id, round_id, voter_id, target_id, vote_type）

## 构建和开发命令

```bash
# 安装依赖
pnpm install

# 开发服务器（增加内存）
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 数据库命令
pnpm db:pull      # 从数据库拉取 schema
pnpm db:gen       # 生成 Prisma 客户端
pnpm db:migrate   # 执行数据库迁移
pnpm db:seed      #  seed 初始数据
```

### 环境要求

- Node.js >= 20
- pnpm 包管理器
- Supabase 项目（云端或自建）

## 配置文件

### 环境变量（.env）

```env
# Supabase 连接（连接池）
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"

# 直接连接（用于迁移）
DIRECT_URL="postgresql://...:5432/postgres"

# Zero sync 数据库（可选）
ZERO_UPSTREAM_DB="postgresql://...:5432/postgres"

DB_PWD="your-password"

# 游戏配置
GAME_DEFAULT_ROLES="villager:4,werewolf:2,seer:1,witch:1"
GAME_DAY_DURATION=300
GAME_NIGHT_DURATION=60
```

### 关键配置文件

| 文件                  | 用途                                            |
| --------------------- | ----------------------------------------------- |
| `next.config.mjs`     | Next.js 配置（standalone 输出、启用 turbopack） |
| `tsconfig.json`       | TypeScript 路径别名（`@*` → `./src/*`）         |
| `prisma.config.ts`    | Prisma 配置（环境变量解析）                     |
| `pnpm-workspace.yaml` | pnpm 工作区配置                                 |

## 代码规范

### TypeScript 约定

1. **路径别名**：使用 `@` 前缀从 `src/` 导入
   - `@components/*` → `src/components/*`
   - `@providers/*` → `src/providers/*`
   - `@utils/*` → `src/utils/*`
   - `@lib/*` → `src/lib/*`

2. **严格模式**：在 `tsconfig.json` 中启用
   - 强制文件名大小写一致
   - 隔离模块
   - Bundler 模块解析

3. **纯注解**：对无副作用的构造函数调用使用 `/*#__PURE__*/`
   ```typescript
   export const app = /*#__PURE__*/ new Hono();
   ```

### 组件约定

1. **"use client" 指令**：显式标记客户端组件
2. **异步服务端组件**：用于 App Router 中的数据获取
3. **Refine 集成**：使用 Refine Hooks 进行 CRUD 操作
4. **游戏组件**：使用独立的游戏状态管理（Zustand 或 Context）

### API 约定

1. **RFC 7807 问题详情**：API 错误使用标准格式

   ```typescript
   {
     type: "ErrorType",
     title: "Error Title",
     status: 400,
     detail: "Error description",
     instance: "/api/path"
   }
   ```

2. **Hono RPC**：客户端使用 Hono 的 RPC 客户端进行类型安全的 API 调用

### 游戏引擎约定

1. **纯函数**：游戏逻辑尽量使用纯函数，便于测试
2. **不可变状态**：游戏状态更新返回新对象
3. **事件驱动**：玩家行动通过事件触发，经引擎处理后更新状态

### 游戏引擎说明

游戏引擎核心逻辑位于 `packages/bgio-engine/` 下。为了保持文档简洁，详细的使用说明和 API 文档已移动到各子目录的 `README.md` 中：

- **[BoardGame.io Engine (Active)](packages/bgio-engine/README.md)**: 基于 BoardGame.io 的新版引擎
- **[Game Engine (Legacy)](packages/bgio-engine/src/legacy-core/README.md)**: 原版自定义游戏引擎适配版本

## Socket.IO 事件定义

### 客户端 → 服务器

```typescript
// 房间相关
"room:join"; // 加入房间
"room:leave"; // 离开房间
"room:ready"; // 准备/取消准备

// 游戏相关
"game:start"; // 开始游戏（房主）
"game:action"; // 玩家行动（投票、技能）
"game:chat"; // 发送聊天消息
```

### 服务器 → 客户端

```typescript
// 房间广播
"room:updated"; // 房间状态更新
"player:joined"; // 玩家加入
"player:left"; // 玩家离开
"player:ready"; // 玩家准备状态变化

// 游戏广播
"game:started"; // 游戏开始
"game:phase"; // 阶段变化（昼夜切换）
"game:action"; // 玩家行动结果
"game:result"; // 回合结果
"game:ended"; // 游戏结束
"game:chat"; // 接收聊天消息
```

## 测试说明

目前项目未配置自动化测试，主要通过以下方式测试：

1. **开发服务器**：`pnpm dev` 进行手动测试
2. **类型检查**：TypeScript 编译时验证
3. **ESLint**：`pnpm lint` 代码质量检查

### 手动测试场景

- 用户认证流程（登录/注册）
- 游戏房间创建/加入/离开
- 游戏流程完整测试（开始→昼夜循环→结束）
- 各角色技能测试
- 投票和结算测试
- 聊天系统测试
- 多客户端并发测试

## 安全考虑

### 认证与授权

1. **Supabase Auth**：用户认证
   - JWT Token 存储在 Cookie
   - 所有表启用 RLS（行级安全）
   - 中间件（`src/middleware.ts`）自动刷新会话

2. **Cookie 安全**：
   - HTTPOnly Cookie 存储认证 Token
   - Max age 限制约 400 天（合规）

3. **CORS**：开发环境 Socket.IO 配置为通配符

### 数据库安全

- 所有表启用 RLS 策略（需要显式配置）
- 生产环境使用连接池
- 迁移使用单独的直接连接

### API 安全

- 所有端点使用 Zod Schema 进行输入验证
- 所有 API 路由使用认证中间件
- 错误响应不泄露敏感信息

### 游戏安全

- 服务器端验证所有玩家行动
- 防止作弊（夜间偷看、重复行动等）
- 游戏状态变更需通过引擎验证

## 部署

### Docker 部署

项目包含多阶段构建的 `Dockerfile`：

1. **deps 阶段**：安装依赖
2. **builder 阶段**：构建应用
3. **runner 阶段**：生产镜像（standalone 输出）

```dockerfile
# 构建命令
docker build -t whole-ends-kneel .

# 运行命令
docker run -p 3000:3000 whole-ends-kneel
```

### 生产环境配置

1. 设置所有必需的环境变量
2. 确保 Supabase 项目正确配置
3. 执行数据库迁移
4. 使用 `pnpm build` 构建
5. 使用 `pnpm start` 启动

## 开发者注意事项

1. **Socket.IO 初始化**：Socket.IO 服务器通过 `/api/socket` 端点（Pages Router）初始化，但应用主要使用 App Router。

2. **游戏引擎位置**：游戏核心逻辑位于 `packages/bgio-engine/src/`，与 UI 分离，便于单元测试。

3. **实时同步策略**：游戏状态使用 Socket.IO 进行实时同步，聊天消息可选择使用 Supabase Realtime 作为备选。

4. **Refine 资源映射**：在 Refine 配置中，部分资源使用特殊的 URL 映射：
   - `game_rooms` 资源映射到 `/admin/rooms/*`
   - `users` 资源映射到 `/admin/users/*`

5. **Prisma 使用**：Prisma 用于 Schema 管理和客户端生成，但运行时使用 Supabase 客户端进行数据库操作。

6. **游戏状态管理**：游戏状态较为复杂，使用 Zustand 或 Context 进行管理，注意处理乐观更新和错误回滚。

---

## 游戏规则概述（魔女生存/审判游戏）

本项目实现的是《魔女生存/审判游戏》，一款以卡牌运用、监禁投票和生存为核心的非对称生存游戏。

### 核心机制

| 机制         | 说明                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| **胜利条件** | 存活至最后（标准游戏7日，存活玩家剩1人时提前结束）                                |
| **手牌系统** | 5种卡牌：魔女杀手(唯一/不消耗)、结界魔法、杀人魔法、探知魔法、检定魔法            |
| **魔女化**   | 持有【魔女杀手】或使用【杀人魔法】成功击杀后获得，连续2夜未击杀则残骸化死亡       |
| **攻击上限** | 每晚最多3人可发动攻击；魔女杀手持有者发动攻击时占1名额，不发动则杀人魔法有3个名额 |
| **监禁投票** | 夜间阶段进行，得票最高者当夜无法使用手牌（但可被攻击）                            |
| **手牌遗落** | 死者手牌由击杀者/尸体第一发现者分配，魔女杀手击杀时击杀者无法获取手牌             |

### 关键规则确认

#### 攻击上限规则

- 魔女杀手持有者**不发动攻击**：当晚最多3个杀人魔法攻击名额
- 魔女杀手持有者**发动攻击**：当晚最多2个杀人魔法攻击名额

#### 探知魔法时机

- 优先结算，以目标**使用手牌前**的状态为准
- 可看到目标**即将使用的那张牌**

#### 魔女杀手持有者的绝对限制

- **只能**使用魔女杀手 或 放弃行动
- **不能**使用杀人魔法、结界、探知、检定等其他手牌（即使手牌中有）

#### 攻击落空定义

- 目标被其他人**先行击杀** → 算落空，杀人魔法**消耗**

#### 魔女杀手转移

- **残骸化死亡**：随机分配给存活玩家
- **被杀人魔法击杀**：转移给击杀者

### 游戏卡牌说明

| 卡牌名称     | 数量     | 消耗 | 效果                                                   |
| ------------ | -------- | ---- | ------------------------------------------------------ |
| **魔女杀手** | 1张      | 否   | 对目标发动攻击（优先度最高），持有者魔女化             |
| **结界魔法** | 约人数×2 | 是   | 保护自身当夜免受攻击，成功防御时通知                   |
| **杀人魔法** | 若干     | 是   | 对目标发动攻击（优先度低于魔女杀手），成功击杀后魔女化 |
| **探知魔法** | 若干     | 是   | 探知目标手牌总数并随机获悉其中一张名称                 |
| **检定魔法** | 若干     | 是   | 查验已死亡玩家的死因是否为魔女杀手所致                 |

### 推荐牌池配置

| 人数   | 魔女杀手 | 结界 | 探知 | 检定 | 杀人 |
| ------ | -------- | ---- | ---- | ---- | ---- |
| 七人局 | 1        | 15   | 5    | 4    | 3    |
| 八人局 | 1        | 18   | 5    | 4    | 4    |
| 九人局 | 1        | 20   | 6    | 4    | 5    |

### 详细规则文档

完整规则书位于 `docs/rule.md`，包含卡牌系统、游戏流程、交易机制、手牌遗落等详细规则。
