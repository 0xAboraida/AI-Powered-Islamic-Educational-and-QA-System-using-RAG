import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type AccentColor = 'purple' | 'emerald' | 'amber' | 'blue';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('zad_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Default to light
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('zad_accent_color');
    return (saved === 'emerald' || saved === 'amber' || saved === 'blue' || saved === 'purple') ? saved : 'amber';
  });

  const THEME_COLORS: Record<Theme, Record<AccentColor, string>> = {
    dark: {
      purple: '#12041f',
      emerald: '#041413',
      amber: '#120d06',
      blue: '#050d1a',
    },
    light: {
      purple: '#faf7ff',
      emerald: '#f0fdfa',
      amber: '#fbf8f0',
      blue: '#eff6ff',
    },
  };

  useEffect(() => {
    localStorage.setItem('zad_theme', theme);
    localStorage.setItem('zad_accent_color', accentColor);
    document.documentElement.setAttribute('data-accent', accentColor);

    // Add/remove dark class from HTML body if needed for global Tailwind classes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const currentThemeColor = THEME_COLORS[theme]?.[accentColor] || (theme === 'dark' ? '#12041f' : '#fbf8f0');

    // Dynamic browser header / toolbar color for Chrome/Safari/Edge
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', currentThemeColor);

    // Windows / Edge nav button color
    let metaMsNav = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (!metaMsNav) {
      metaMsNav = document.createElement('meta');
      metaMsNav.setAttribute('name', 'msapplication-navbutton-color');
      document.head.appendChild(metaMsNav);
    }
    metaMsNav.setAttribute('content', currentThemeColor);
  }, [theme, accentColor]);

  // Clean up any legacy bgType storage
  useEffect(() => {
    localStorage.removeItem('zad_bg_type');
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      accentColor,
      setAccentColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
