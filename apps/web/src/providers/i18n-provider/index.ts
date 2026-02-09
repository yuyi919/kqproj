"use client";

import type { I18nProvider } from "@refinedev/core";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LOCALE_COOKIE_NAME } from "@/i18n/config";

/**
 * Creates Refine i18nProvider using next-intl
 * This adapter bridges Refine's i18n interface with next-intl's API
 */
export function useRefineI18nProvider(): I18nProvider {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  return {
    translate: (key: string, options?: any, defaultMessage?: string) => {
      // next-intl uses dot notation for nested keys
      // e.g., "refine.buttons.create" -> t('refine.buttons.create')
      if (!t.has(key)) {
        // console.warn(`Missing translation key: ${key}`);
        return typeof options === "string" ? options : (defaultMessage ?? key);
      }
      return t(key, options);
    },
    changeLocale: async (newLocale: string) => {
      // Set locale cookie
      Cookies.set(LOCALE_COOKIE_NAME, newLocale, {
        expires: 365, // 1 year
        path: "/",
      });

      // Refresh the page to apply new locale
      router.refresh();
    },
    getLocale: () => locale,
  };
}
