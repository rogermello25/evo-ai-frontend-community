import React, { createContext, useLayoutEffect, useMemo } from 'react';

export type Theme = 'light' | 'dark';

export interface DarkModeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = 'dark';

  useLayoutEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // No-op: always dark mode
  };

  const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <DarkModeContext.Provider value={contextValue}>{children}</DarkModeContext.Provider>;
}
