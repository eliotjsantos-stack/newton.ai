'use client';

import { createContext, useContext } from 'react';

const ThemeContext = createContext({ theme: 'light' });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}
