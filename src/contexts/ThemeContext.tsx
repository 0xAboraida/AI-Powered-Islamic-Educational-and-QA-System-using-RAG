import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type AccentColor = 'purple' | 'emerald' | 'amber' | 'blue';

export const ACCENT_STYLES: Record<string, {
  strokeDark: string;
  strokeLight: string;
  pageBgLight: string;
  logoDark: string;
  logoLight: string;
  lightBorder: string;
  lightBorderHover: string;
  lightBgBadge: string;
  lightBgHover: string;
  lightText: string;
  darkBorder: string;
  darkBorderHover: string;
  darkBgBadge: string;
  darkText: string;
}> = {
  amber: {
    strokeDark: '#dfbf83',
    strokeLight: '#b88d46',
    pageBgLight: 'bg-[#fbf8f0]',
    logoDark: '#dfbf83',
    logoLight: '#b88d46',
    lightBorder: 'border-amber-300/70',
    lightBorderHover: 'hover:border-amber-500',
    lightBgBadge: 'bg-amber-100',
    lightBgHover: 'hover:bg-amber-50',
    lightText: 'text-amber-800',
    darkBorder: 'border-white/10',
    darkBorderHover: 'hover:border-[#dfbf83]/50',
    darkBgBadge: 'bg-[#dfbf83]/15',
    darkText: 'text-[#dfbf83]',
  },
  emerald: {
    strokeDark: '#2dd4bf',
    strokeLight: '#0d9488',
    pageBgLight: 'bg-[#f0fdfa]',
    logoDark: '#2dd4bf',
    logoLight: '#0d9488',
    lightBorder: 'border-teal-300/70',
    lightBorderHover: 'hover:border-teal-500',
    lightBgBadge: 'bg-teal-100',
    lightBgHover: 'hover:bg-teal-50',
    lightText: 'text-teal-800',
    darkBorder: 'border-white/10',
    darkBorderHover: 'hover:border-teal-400/50',
    darkBgBadge: 'bg-teal-500/15',
    darkText: 'text-teal-300',
  },
  blue: {
    strokeDark: '#60a5fa',
    strokeLight: '#2563eb',
    pageBgLight: 'bg-[#eff6ff]',
    logoDark: '#60a5fa',
    logoLight: '#2563eb',
    lightBorder: 'border-blue-300/70',
    lightBorderHover: 'hover:border-blue-500',
    lightBgBadge: 'bg-blue-100',
    lightBgHover: 'hover:bg-blue-50',
    lightText: 'text-blue-800',
    darkBorder: 'border-white/10',
    darkBorderHover: 'hover:border-blue-400/50',
    darkBgBadge: 'bg-blue-500/15',
    darkText: 'text-blue-300',
  },
  purple: {
    strokeDark: '#c020f0',
    strokeLight: '#7c3aed',
    pageBgLight: 'bg-[#faf7ff]',
    logoDark: '#c020f0',
    logoLight: '#7c3aed',
    lightBorder: 'border-purple-300/70',
    lightBorderHover: 'hover:border-purple-500',
    lightBgBadge: 'bg-purple-100',
    lightBgHover: 'hover:bg-purple-50',
    lightText: 'text-purple-800',
    darkBorder: 'border-white/10',
    darkBorderHover: 'hover:border-purple-400/50',
    darkBgBadge: 'bg-purple-500/15',
    darkText: 'text-purple-300',
  },
};

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
      purple: '#5b0e9c',
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

  /** Sync browser tab favicons with the active accent theme by replacing icon links cleanly. */
  const syncDocumentFavicon = (accent: AccentColor) => {
    const iconUrl = `/favicon-${accent}.png?v=4`;
    const linkSpecs = [
      { id: 'dynamic-favicon', rel: 'icon', type: 'image/png' },
      { id: 'dynamic-apple-icon', rel: 'apple-touch-icon' },
    ];

    const existingLinks = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]'));
    const alreadySynced =
      existingLinks.length === linkSpecs.length &&
      existingLinks.every((el) => el.getAttribute('href') === iconUrl);

    if (alreadySynced) return;

    // Remove all existing icon links (including any static injected ones) so Chromium repaints the tab icon.
    existingLinks.forEach((el) => el.remove());

    for (const spec of linkSpecs) {
      const link = document.createElement('link');
      link.id = spec.id;
      link.rel = spec.rel;
      if (spec.type) {
        link.type = spec.type;
      }
      link.href = iconUrl;
      document.head.appendChild(link);
    }
  };

  useEffect(() => {
    localStorage.setItem('zad_theme', theme);
    localStorage.setItem('zad_accent_color', accentColor);
    document.documentElement.setAttribute('data-accent', accentColor);
    syncDocumentFavicon(accentColor);

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
