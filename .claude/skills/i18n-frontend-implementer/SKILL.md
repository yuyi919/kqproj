---
name: i18n-frontend-implementer
description: Adds internationalization (i18n) infrastructure using the project's type-safe system. Use when implementing "internationalization", "translations", "multi-language support", or "i18n".
---

# i18n Frontend Implementer

Implement internationalization using the project's **Type-Safe i18n System** (wrapping `next-intl`).

## Core Setup

**1. Import Hook**: Use `useTypedTranslations` from `@/i18n`.
**2. Typed Access**: Access keys via dot notation on the returned object.
**3. Autocomplete**: TypeScript will suggest available paths.

## Usage Examples

### Basic Usage

```tsx
import { useTypedTranslations } from "@/i18n";

export function MyComponent() {
  const t = useTypedTranslations();

  return (
    <div>
      {/* 1. Direct Text */}
      <h1>{t.path.home.title()}</h1>

      {/* 2. With Parameters */}
      <p>{t.path.validation.min({ field: "Password", min: 8 })}</p>

      {/* 3. Nested Fields */}
      <Button>{t.path.actions.save()}</Button>
    </div>
  );
}
```

### With Ant Design

```tsx
import { Form, Input, Button } from "antd";
import { useTypedTranslations } from "@/i18n";

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
      <Form.Item>
        <Button type="primary">{t.path.pages.login.buttons.submit()}</Button>
      </Form.Item>
    </Form>
  );
};
```

## Best Practices

1.  **Always use `useTypedTranslations`**. Do not use `useTranslations` from `next-intl` directly unless necessary for dynamic keys.
2.  **Avoid Raw Strings**. All UI text must come from `t.path...`.
3.  **Parameters**. Pass variables as an object to the function call: `key({ param: value })`.
4.  **No String Concatenation**. Use replacement parameters in the translation file.
