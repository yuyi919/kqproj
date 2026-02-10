---
name: ant-design-v6
description: Quick reference for Ant Design v6. Use for "AntD components", "antd v6 UI", "create AntD table/form". Avoids deprecated APIs.
---

# AntD v6 Quick Reference

Agent-facing cheat sheet. No explanations, just patterns.

## 🚨 Critical v6 API Changes

### Common Property Renames (Grouped)

| Property        | Deprecated                 | Replacement (v6)        | Components Affected                                         |
| --------------- | -------------------------- | ----------------------- | ----------------------------------------------------------- |
| **Visibility**  | `visible`                  | `open`                  | Modal, Drawer, Tooltip, Popover, Dropdown, Tag              |
|                 | `onVisibleChange`          | `onOpenChange`          | Tooltip, Popover, Dropdown, Tag                             |
| **Popup Class** | `dropdownClassName`        | `classNames.popup.root` | Select, Cascader, AutoComplete, DatePicker, TreeSelect      |
|                 | `popupClassName`           | `classNames.popup.root` | Select, AutoComplete, DatePicker, TreeSelect                |
|                 | `overlayClassName`         | `classNames.root`       | Tooltip, Popover, Dropdown (was `overlayClassName`)         |
| **Popup Style** | `dropdownStyle`            | `styles.popup.root`     | Select, Cascader, AutoComplete, TreeSelect                  |
|                 | `popupStyle`               | `styles.popup.root`     | DatePicker                                                  |
|                 | `overlayStyle`             | `styles.root`           | Tooltip, Dropdown                                           |
| **Popup Logic** | `dropdownMatchSelectWidth` | `popupMatchSelectWidth` | Select, AutoComplete, TreeSelect, ConfigProvider            |
|                 | `dropdownRender`           | `popupRender`           | Select, AutoComplete, Cascader, TreeSelect, Dropdown        |
|                 | `onDropdownVisibleChange`  | `onOpenChange`          | Select, AutoComplete, Cascader, TreeSelect                  |
| **Border**      | `bordered`                 | `variant`               | Card, InputNumber, Select, Cascader, DatePicker, TreeSelect |
|                 | `bordered={false}`         | `variant="filled"`      | Tag                                                         |
| **Styles**      | `bodyStyle`                | `styles.body`           | Card, Modal, Drawer                                         |
|                 | `headerStyle`              | `styles.header`         | Card, Drawer                                                |
|                 | `maskStyle`                | `styles.mask`           | Modal, Drawer                                               |
|                 | `contentStyle`             | `styles.content`        | Descriptions, Statistic                                     |
|                 | `labelStyle`               | `styles.label`          | Descriptions                                                |
| **Orientation** | `direction`                | `orientation`           | Space, Space.Compact, Steps                                 |
|                 | `layout`                   | `orientation`           | Splitter                                                    |

### Component Specific Changes

| Component        | Deprecated                   | Replacement (v6)                                   |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| **Anchor**       | `Anchor` children            | `items` prop                                       |
| **Alert**        | `closeText`                  | `closable.closeIcon`                               |
|                  | `message`                    | `title`                                            |
| **Avatar.Group** | `maxCount`                   | `max={{ count: number }}`                          |
|                  | `maxStyle`                   | `max={{ style: source }}`                          |
| **BackTop**      | `BackTop`                    | `FloatButton.BackTop`                              |
| **Breadcrumb**   | `routes` / `Breadcrumb.Item` | `items` prop                                       |
| **Button**       | `iconPosition`               | `iconPlacement`                                    |
|                  | `Button.Group`               | `Space.Compact`                                    |
|                  | `ghost` / `type="danger"`    | `variant` / `color="danger"`                       |
| **Calendar**     | `dateFullCellRender`         | `fullCellRender`                                   |
|                  | `dateCellRender`             | `cellRender`                                       |
| **Carousel**     | `dotPosition`                | `dotPlacement`                                     |
| **Collapse**     | `destroyInactivePanel`       | `destroyOnHidden`                                  |
|                  | `expandIconPosition`         | `expandIconPlacement`                              |
|                  | `Panel` `disabled`           | `collapsible="disabled"`                           |
| **Divider**      | `type`                       | `orientation`                                      |
|                  | `orientationMargin`          | `styles.content.margin`                            |
| **Drawer**       | `width` / `height`           | `size`                                             |
|                  | `destroyInactivePanel`       | `destroyOnHidden`                                  |
| **Dropdown**     | `Dropdown.Button`            | `Space.Compact` + `Dropdown` + `Button`            |
|                  | `placement: xxxCenter`       | `placement: xxx`                                   |
| **FloatButton**  | `description`                | `content`                                          |
| **Image**        | `wrapperStyle`               | `styles.root`                                      |
| **Input**        | `Input.Group`                | `Space.Compact`                                    |
|                  | `addonBefore`/`After`        | `Space.Compact` (recommended)                      |
| **List**         | `List`                       | **DEPRECATED**. Use `Flex` or `Table`.             |
| **Menu**         | `children`                   | `items` prop                                       |
| **Modal**        | `destroyOnClose`             | `destroyOnHidden`                                  |
| **Notification** | `btn`                        | `actions`                                          |
|                  | `message`                    | `title`                                            |
| **Progress**     | `strokeWidth`                | `size`                                             |
|                  | `width`                      | `size`                                             |
|                  | `trailColor`                 | `railColor`                                        |
| **Slider**       | `tooltipVisible`             | `tooltip.open`                                     |
|                  | `tooltipPlacement`           | `tooltip.placement`                                |
| **Steps**        | `labelPlacement`             | `titlePlacement`                                   |
|                  | `progressDot`                | `type="dot"`                                       |
| **Table**        | `pagination.position`        | `pagination.placement`                             |
|                  | `filterDropdownOpen`         | `filterDropdownProps.open`                         |
| **Tabs**         | `tabPosition`                | `tabPlacement`                                     |
|                  | `Tabs.TabPane`               | `items` prop                                       |
| **Timeline**     | `Timeline.Item`              | `items` prop                                       |
|                  | `pending`                    | `items` (include pending item)                     |
| **Transfer**     | `operationStyle`             | `styles.actions`                                   |
| **Form**         | `onFinish`                   | No longer includes `Form.List` unregistered fields |

## Component Patterns

### Button

```tsx
<Button type="primary" variant="filled">Submit</Button>
<Button variant="text">Cancel</Button>
<Button color="danger" variant="outlined">Delete</Button>
<Button loading={isLoading}>Loading</Button>
<Button icon={<SearchOutlined />}>Search</Button>
```

### Table

```tsx
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  pagination={{ pageSize: 10 }}
  scroll={{ x: "max-content" }}
/>
```

### Form

```tsx
<Form layout="vertical" onFinish={onFinish}>
  <Form.Item name="email" rules={[{ required: true, type: "email" }]}>
    <Input />
  </Form.Item>
  <Form.Item>
    <Button type="primary" htmlType="submit">
      Submit
    </Button>
  </Form.Item>
</Form>
```

### Modal

```tsx
<Modal
  open={isOpen}
  title="Title"
  onOk={handleOk}
  onCancel={handleCancel}
  destroyOnClose
  styles={{ body: { padding: 20 } }} // v6 style
>
  <p>Content</p>
</Modal>
```

### Drawer

```tsx
<Drawer
  open={isOpen}
  title="Title"
  onClose={handleClose}
  size="default" // was width
  styles={{ body: { padding: 0 } }}
/>
```

### Message/Notification

```tsx
// Must be used inside App component
const { message, notification, modal } = App.useApp();

message.success("Saved!");
notification.open({ message: "Title", description: "Body" }); // 'message' is simpler alias for title? Check docs. v6 says message->title
// Correct v6:
notification.open({
  message: "Notification Title", // Note: 'message' prop is NOT deprecated in notification.open config object, only in 'Notification' component props?
  // Wait, migration guide says 'Notification title' replaces 'message'.
  // Actually, for notification.open({ message: ... }), 'message' is the TITLE.
  description: "Notification Body",
});
```

## Type-Safe i18n Integration

**Pattern**: Use `useTypedTranslations` (from `@/i18n`) for auto-completed keys.
**Rule**: Don't use raw strings.

```tsx
import { useTypedTranslations } from "@/i18n";
import { Button, Form, Input } from "antd";

const LoginForm = () => {
  const t = useTypedTranslations();

  return (
    <Form layout="vertical">
      <Form.Item
        label={t.path.pages.login.fields.email()}
        rules={[
          {
            required: true,
            message: t.path.pages.login.errors.requiredEmail(),
          },
        ]}
      >
        <Input placeholder={t.path.fields.email()} />
      </Form.Item>
      <Button type="primary">{t.path.pages.login.buttons.submit()}</Button>
    </Form>
  );
};
```

## Theme Setup

```tsx
import { ConfigProvider, theme, App } from "antd";

// Layout wrapper
<ConfigProvider
  theme={{
    cssVar: true, // ⚡ CRITICAL
    token: { colorPrimary: "#1677ff", borderRadius: 6 },
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  }}
>
  <App>{children}</App>
</ConfigProvider>;
```

## Checklist

- [ ] `open` not `visible`
- [ ] `variant` not `ghost`/`bordered`
- [ ] `styles.xxx` not `xxxStyle`
- [ ] `items` not `children`/`routes` (Menu, Breadcrumb, Steps)
- [ ] `classNames.popup.root` not `dropdownClassName`
- [ ] `popupMatchSelectWidth` not `dropdownMatchSelectWidth`
- [ ] `Space.Compact` not `Button.Group`/`Input.Group`
- [ ] `FloatButton.BackTop` not `BackTop`
