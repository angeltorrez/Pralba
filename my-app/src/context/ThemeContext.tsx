import React, { createContext, useState, useContext, ReactNode } from 'react';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  fontSize: FontSize;
  theme: ThemeMode;
  setFontSize: (size: FontSize) => void;
  setTheme: (mode: ThemeMode) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    danger: string;
    shadow: string;
  };
  fontScaling: {
    base: number;
    heading1: number;
    heading2: number;
    heading3: number;
    body: number;
    small: number;
  };
}

const defaultLight = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#eeeeee',
  primary: '#3498db',
  success: '#2ecc71',
  danger: '#ff6b6b',
  shadow: '#000000',
};

const defaultDark = {
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#bbbbbb',
  border: '#444444',
  primary: '#3498db',
  success: '#2ecc71',
  danger: '#ff6b6b',
  shadow: '#000000',
};

const fontScalings = {
  small: {
    base: 12,
    heading1: 20,
    heading2: 16,
    heading3: 14,
    body: 12,
    small: 10,
  },
  medium: {
    base: 14,
    heading1: 28,
    heading2: 18,
    heading3: 16,
    body: 14,
    small: 12,
  },
  large: {
    base: 16,
    heading1: 32,
    heading2: 20,
    heading3: 18,
    body: 16,
    small: 14,
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<ThemeMode>('light');

  const colors = theme === 'light' ? defaultLight : defaultDark;
  const fontScaling = fontScalings[fontSize];

  const value: ThemeContextType = {
    fontSize,
    theme,
    setFontSize,
    setTheme,
    colors,
    fontScaling,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};
