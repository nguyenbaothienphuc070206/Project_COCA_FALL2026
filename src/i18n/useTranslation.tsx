'use client';

/**
 * Tính năng: Context cung cấp đa ngôn ngữ (VI/EN) và chế độ giao diện (Light/Dark) cho toàn bộ ứng dụng.
 * Trường hợp sử dụng: Bọc quanh ứng dụng để mọi component đọc chuỗi dịch thuật qua hook useTranslation().
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { DICTIONARIES, Dictionary, Locale } from './dictionaries';
import { safeGetStorage, safeSetStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../config/constants';
import {
  buildLanguageSwitchUrl,
  extractLocaleFromPathname,
} from '../lib/navigation';

interface AppContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Dictionary;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Provider quản lý trạng thái ngôn ngữ và giao diện Sáng/Tối, đồng bộ đẳng cấu (SSR + Client) với đường dẫn /en và /vi.
 * @param children - Các component con
 * @returns JSX Provider
 */
export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathLocale = extractLocaleFromPathname(pathname || '/');

  const [manualLocale, setManualLocale] = useState<Locale | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);

  const locale: Locale = manualLocale ?? pathLocale ?? 'vi';

  // Đọc tùy chọn đã lưu trong localStorage sau khi hydrate xong để tránh Hydration Mismatch giữa Server và Client
  useEffect(() => {
    const savedTheme = safeGetStorage<'light' | 'dark'>(
      STORAGE_KEYS.theme,
      'light',
    );
    if (savedTheme === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(true);
    }
    if (!pathLocale) {
      const savedLocale = safeGetStorage<Locale>(STORAGE_KEYS.locale, 'vi');
      if (savedLocale === 'en' || savedLocale === 'vi') {
        setManualLocale(savedLocale);
      }
    }
  }, [pathLocale]);

  useEffect(() => {
    const syncFromPopState = () => {
      const nextPathLocale = extractLocaleFromPathname(
        window.location.pathname,
      );
      if (nextPathLocale) {
        setManualLocale(nextPathLocale);
        safeSetStorage(STORAGE_KEYS.locale, nextPathLocale);
      }
    };
    window.addEventListener('popstate', syncFromPopState);
    return () => window.removeEventListener('popstate', syncFromPopState);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.lang = locale;
    }
  }, [isDark, locale]);

  const setLocale = useCallback((next: Locale) => {
    setManualLocale(next);
    safeSetStorage(STORAGE_KEYS.locale, next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
    if (typeof window !== 'undefined') {
      const nextUrl = buildLanguageSwitchUrl(
        window.location.pathname,
        window.location.search,
        next,
      );
      if (
        nextUrl !== `${window.location.pathname}${window.location.search}` &&
        !window.location.pathname.startsWith('/eval')
      ) {
        window.history.replaceState(window.history.state, '', nextUrl);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      safeSetStorage(STORAGE_KEYS.theme, next ? 'dark' : 'light');
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      return next;
    });
  }, []);

  const value: AppContextValue = {
    locale,
    setLocale,
    t: DICTIONARIES[locale],
    isDark,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook truy xuất từ điển đa ngôn ngữ và trạng thái giao diện Sáng/Tối.
 * @returns Đối tượng chứa locale, setLocale, từ điển t, isDark và toggleTheme
 */
export function useTranslation(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error(
      'useTranslation must be used within AppPreferencesProvider',
    );
  }
  return ctx;
}
