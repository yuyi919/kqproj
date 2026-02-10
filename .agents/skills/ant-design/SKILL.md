---
name: antd-design
description: Ant Design 6 React UI 组件库使用指南。涵盖组件 API、TypeScript 类型、设计模式、主题定制、常见陷阱及升级迁移。使用场景：(1) 使用 Ant Design 组件构建 UI，(2) 处理 TypeScript 类型问题，(3) 主题定制和样式覆盖，(4) 组件组合和布局，(5) 从旧版本升级，(6) 解决 Ant Design 相关问题。
---

# Ant Design 技能

## 核心原则

- 优先使用 Ant Design 6 的组件，保持设计一致性
- 使用 TypeScript 严格类型，避免 `any`
- 遵循 Ant Design 的设计模式，不要过度自定义

## 快速参考

### 常用组件导入

```typescript
import { 
  Button, Card, Modal, Form, Input, Select, Table,
  Layout, Menu, Badge, Tag, Tooltip, message, theme 
} from 'antd';

const { Header, Content, Sider } = Layout;
const { useToken } = theme;
```

### 主题令牌使用

```typescript
const { token } = theme.useToken();

// 常用令牌
// token.colorPrimary      - 主色
// token.colorSuccess      - 成功色
// token.colorWarning      - 警告色
// token.colorError        - 错误色
// token.colorText         - 主文本色
// token.colorTextSecondary - 次要文本色
// token.colorBorder       - 边框色
// token.colorBgContainer  - 容器背景色
// token.borderRadius      - 圆角
// token.padding           - 标准间距
```

## Ant Design 6 破坏性变更

### Tag 组件
- **移除** `size` 属性，使用 `style` 自定义
- 错误：`<Tag size="small">标签</Tag>`
- 正确：`<Tag style={{ fontSize: 12, padding: '0 4px' }}>标签</Tag>`

### Alert 组件
- **移除** `message` 属性，使用 `title`
- 错误：`<Alert message="内容" />`
- 正确：`<Alert title="内容" />`

### Divider 组件
- **移除** `type` 属性，使用 `orientation`
- 错误：`<Divider type="vertical" />`
- 正确：`<Divider orientation="vertical" />`

### Divider 组件
- **移除** `direction` 属性，使用 `orientation`
- 错误：`<Space direction="vertical" />`
- 正确：`<Space orientation="vertical" />`

## 组件模式

### 紧凑布局模式

```typescript
// 卡片紧凑模式
<Card size="small">

// 列表紧凑模式  
<List size="small" dataSource={items} renderItem={...} />

// 表格紧凑模式
<Table size="small" dataSource={data} columns={columns} />
```

### 表单处理

```typescript
import { Form, Input, Button, message } from 'antd';

interface FormValues {
  name: string;
  email: string;
}

function MyForm() {
  const [form] = Form.useForm<FormValues>();
  
  const onFinish = (values: FormValues) => {
    console.log(values);
    message.success('提交成功');
  };
  
  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item 
        name="name" 
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  );
}
```

### Modal 对话框

```typescript
import { Modal, Button } from 'antd';
import { useState } from 'react';

function MyModal() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>打开</Button>
      <Modal
        title="标题"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        内容
      </Modal>
    </>
  );
}
```

### Table 表格

```typescript
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DataType {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

const columns: ColumnsType<DataType> = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status',
    render: (status) => (
      <Tag color={status === 'active' ? 'success' : 'default'}>
        {status === 'active' ? '启用' : '禁用'}
      </Tag>
    )
  },
];

<Table 
  rowKey="id"
  dataSource={data} 
  columns={columns}
  pagination={{ pageSize: 10 }}
/>
```

## 布局组件

### Layout 基础布局

```typescript
import { Layout } from 'antd';

const { Header, Sider, Content } = Layout;

<Layout style={{ minHeight: '100vh' }}>
  <Sider width={200}>
    <Menu items={menuItems} />
  </Sider>
  <Layout>
    <Header style={{ padding: '0 24px', background: '#fff' }}>
      标题
    </Header>
    <Content style={{ padding: 24 }}>
      内容区域
    </Content>
  </Layout>
</Layout>
```

### Space 间距

```typescript
import { Space } from 'antd';

<Space direction="vertical" size="large" style={{ width: '100%' }}>
  <div>项目1</div>
  <div>项目2</div>
</Space>

<Space wrap>
  <Button>按钮1</Button>
  <Button>按钮2</Button>
</Space>
```

### Grid 栅格

```typescript
import { Row, Col } from 'antd';

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    内容
  </Col>
</Row>
```

## 反馈组件

### Message 全局提示

```typescript
import { message } from 'antd';

message.success('操作成功');
message.error('操作失败');
message.warning('警告信息');
message.info('提示信息');

// 带 loading
const hide = message.loading('加载中...', 0);
hide(); // 关闭
```

## 类型定义

### 组件 Props 类型

```typescript
import type { ButtonProps, TableProps, FormProps } from 'antd';

interface MyButtonProps extends ButtonProps {
  customProp?: string;
}

// Table 数据类型
type DataType = TableProps<DataType>['dataSource'];

// Form 值类型  
interface FormValues {
  name: string;
}
type FormOnFinish = FormProps<FormValues>['onFinish'];
```

## 常见问题

### 样式覆盖

```typescript
// 使用 CSS-in-JS
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  container: {
    padding: token.padding,
    backgroundColor: token.colorBgContainer,
  },
}));
```

### 服务端渲染 (SSR)

```typescript
// 在 Next.js 中使用
'use client'; // 客户端组件需要标记

// 或使用 @ant-design/nextjs-registry
import { AntdRegistry } from '@ant-design/nextjs-registry';
```

### 图标使用

```typescript
import { UserOutlined, LockOutlined } from '@ant-design/icons';

<Button icon={<UserOutlined />}>用户</Button>
<Input prefix={<LockOutlined />} placeholder="密码" />
```

## 最佳实践

1. **表单验证**：始终提供清晰的验证消息
2. **表格**：使用 `rowKey` 指定唯一键，启用 `scroll` 处理大量数据
3. **加载状态**：异步操作显示 loading 状态
4. **错误处理**：API 调用失败时显示错误提示
5. **响应式**：使用 Grid 的响应式断点 (xs, sm, md, lg, xl)
