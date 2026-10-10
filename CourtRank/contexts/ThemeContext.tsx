import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  preference: ThemePreference;
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = 'courtrank.themePreference';

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  scheme: 'light',
  colors: Colors.light,
  isDark: false,
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch((error) => console.error('Error loading theme preference:', error));
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch((error) =>
      console.error('Error saving theme preference:', error)
    );
  };

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({
      preference,
      scheme,
      colors: Colors[scheme],
      isDark: scheme === 'dark',
      setPreference,
    }),
    [preference, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Builds a StyleSheet from the active palette, rebuilt only when the scheme changes.
// Usage: const styles = useThemedStyles(makeStyles);
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
