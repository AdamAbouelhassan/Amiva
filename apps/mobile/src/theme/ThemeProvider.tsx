import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { CategoryId } from '@amiva/core';
import { radius, shadow, spacing } from './spacing';
import { categoryColor, categoryTextColor, darkColors, lightColors, ThemeColors } from './themes';
import { makeType, TypeScale } from './typography';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Theme {
  colors: ThemeColors;
  type: TypeScale;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  /** Category hue for fills / icons / radar. */
  category: (c: CategoryId) => string;
  /** Category hue safe as small text (WCAG AA on theme surfaces). */
  categoryText: (c: CategoryId) => string;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = 'amiva.themeMode';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .catch(() => {
        /* first launch / storage unavailable — stay on 'system' */
      });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<Theme>(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      colors,
      type: makeType(colors),
      spacing,
      radius,
      shadow,
      category: (c) => categoryColor(c, isDark),
      categoryText: (c) => categoryTextColor(c, isDark),
      isDark,
      mode,
      setMode,
    };
  }, [isDark, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
