/**
 * Type-safe translation hook
 *
 * Usage:
 *   const t = useTypedTranslations();
 *   const title = t.path.pages.login.title();
 *   const message = t.path.notifications.success({ resource: 'User' });
 */

"use client";

import { useGetLocale, useTranslate } from "@refinedev/core";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import type { Translations } from "../locales/zh-CN";
import { createPathBuilder, type DeepProxy } from "../utils/pathBuilder";

export type TypedTranslations = {
  (
    key: string,
    options?: Record<any, any>,
    defaultMessage?: string | undefined,
  ): string;
  (key: string, defaultMessage?: string | undefined): string;
  path: DeepProxy<Translations>;
};

export function useTypedTranslations(): TypedTranslations {
  const t = useTranslate();
  const locale = useLocale();
  return useMemo(() => {
    // Create path builder with translation function
    const pathBuilder = createPathBuilder<Translations>((path, options) => {
      return t(path as any, options);
    });
    // console.log("useTypedTranslations", pathBuilder);
    return Object.assign((...args: [any, any?, any?]) => t(...args), {
      path: pathBuilder,
    });
  }, [t, locale]);
}

// Export a simpler alias
export { useTypedTranslations as useT };
