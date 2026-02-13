"use client";

import { GlobalOutlined } from "@ant-design/icons";
import { Select } from "antd";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import React from "react";
import {
  LOCALE_COOKIE_NAME,
  type Locale,
  localeNames,
  locales,
} from "@/i18n/config";

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: Locale) => {
    // Set cookie
    Cookies.set(LOCALE_COOKIE_NAME, newLocale, {
      expires: 365,
      path: "/",
    });

    // Refresh to apply new locale
    router.refresh();
  };

  return (
    <Select
      value={currentLocale}
      onChange={handleChange}
      style={{ width: 140 }}
      suffixIcon={<GlobalOutlined />}
      options={locales.map((locale) => ({
        value: locale,
        label: localeNames[locale],
      }))}
    />
  );
}
