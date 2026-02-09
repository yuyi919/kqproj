'use client';

import React from 'react';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLocale } from 'next-intl';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { locales, localeNames, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: Locale) => {
    // Set cookie
    Cookies.set(LOCALE_COOKIE_NAME, newLocale, {
      expires: 365,
      path: '/',
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
