---
alwaysApply: false
description: 项目开发规范与最佳实践 (Project Rules & Best Practices)
---
# 项目开发规范与最佳实践 (Project Rules & Best Practices)

本文档汇总了本项目的开发规范、常见问题解决方案及最佳实践，所有开发人员请遵循以下规则。

## 1. 基础环境与工具 (Basic Environment)

*   **包管理器**: 统一使用 `pnpm` 进行依赖管理。
*   **脚本执行**: 可使用 `bun` 执行 TypeScript 脚本文件（如测试脚本、工具脚本）。
*   **类型定义**: 通用类型定义文件应放置在 `@/interfaces/*` 目录下。

## 2. Next.js 16+ 开发规范

### 动态路由参数 (`params`)
Next.js 16 中，Page 组件的 `params` 属性变为 Promise，**必须**使用 `await` 或 `React.use()` 解包。

**❌ 错误写法**:
```typescript
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Error: Property 'id' does not exist on type 'Promise'
}
```

**✅ 正确写法**:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

## 3. Refine 框架使用规范

### 数据 Hooks 返回值
在本项目配置中，`useOne` / `useList` 等 Hooks 不会直接返回 React Query 结果对象，而是返回 `{ query, result }` 结构。

**❌ 错误写法**:
```typescript
const { data, isPending } = useOne({ ... });
```

**✅ 正确写法**:
```typescript
// 方式 A: 访问 React Query 原始状态 (推荐)
const { data, isPending } = useOne({ ... }).query;

// 方式 B: 直接使用 result (包含解包后的数据)
const { result } = useOne({ ... });
```

## 4. 数据库与类型系统 (Prisma & Supabase)

### 枚举类型 (Enums)
Prisma 生成的 Enum 是对象类型，而 Supabase API 返回的是字符串。前端接口应优先使用**字符串字面量联合类型**。

*   **推荐**: `status: "WAITING" | "PLAYING" | "FINISHED"`
*   **避免**: 直接引用 Prisma 的 Enum 类型作为前端接口类型，除非已处理类型转换。

### 日期时间字段
Supabase API 返回的 JSON 数据中，`created_at` 等时间字段为 ISO 8601 **字符串**。
Prisma Client 在服务端查询时会将其解析为 `Date` 对象。

*   **前端接口 (`interface`)**: 定义为 `string`。
    ```typescript
    interface IGameRoom { created_at: string; }
    ```
*   **服务端逻辑**: 处理 Prisma 返回数据时注意它是 `Date` 对象。

## 5. 组件架构设计

### 容器/展示组件分离 (Container/Presentational)
对于逻辑复杂的页面（如游戏房间），严禁在单一文件中堆砌所有逻辑。

*   **容器组件 (Container)**: 负责数据获取 (`useOne`)、状态管理、路由跳转、Loading/Error 处理。
    *   *示例*: `GameRoomClient.tsx`
*   **展示组件 (Presentational)**: 负责 UI 渲染和用户交互，通过 Props 接收数据和回调。
    *   *示例*: `GameLobby.tsx` (等待状态), `GameBoard.tsx` (游戏状态)
