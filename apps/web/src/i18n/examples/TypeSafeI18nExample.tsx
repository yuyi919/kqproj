/**
 * Type-Safe i18n Usage Example
 *
 * This file demonstrates how to use the new type-safe i18n system
 */

"use client";

import React from "react";
import { useTypedTranslations } from "@/i18n";
import { Button } from "antd";

export function TypeSafeI18nExample() {
  // Get the typed translations object
  const t = useTypedTranslations();

  return (
    <div>
      {/* Direct call - clean and simple! */}
      <h1>{t.path.pages.login.title()}</h1>
      <p>{t.path.pages.login.fields.email()}</p>

      {/* With interpolation */}
      <p>{t.path.notifications.createSuccess({ resource: "User" })}</p>

      {/* Nested paths */}
      <span>{t.path.blog_posts.fields.status.published()}</span>

      {/* All paths have autocomplete! */}
      <div>
        <h2>{t.path.lobby.title()}</h2>
        <Button>{t.path.lobby.createRoom()}</Button>
        <Button>{t.path.lobby.joinRoom()}</Button>
      </div>

      {/* Error messages with parameters */}
      <div>{t.path.notifications.error({ statusCode: 404 })}</div>
    </div>
  );
}

// Type-safe path examples:
// ✅ t.path.pages.login.title()                    - Clean syntax!
// ✅ t.path.notifications.success({ resource })    - With options!
// ✅ t.path.blog_posts.fields.status.published()   - Deep nesting!
// ❌ t.path.invalid.path()                         - TypeScript error!
