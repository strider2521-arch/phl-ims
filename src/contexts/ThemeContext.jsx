// Theme Context — dark/light mode with glass tokens + tech blue accent

import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'pims_theme';

const themes = {
  dark: {
    name: 'dark',
    // Glass background layers
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassHover: 'rgba(255,255,255,0.07)',
    // Page / main backgrounds
    bg: '#080B12',
    bgSecondary: 'rgba(255,255,255,0.03)',
    bgTertiary: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.04)',
    // Text
    text: '#E8EDF5',
    textSecondary: '#8892A8',
    textMuted: '#4A5568',
    // Tech blue accent (was purple #6366F1)
    accent: '#3B82F6',
    accentHover: '#2563EB',
    accentGlass: 'rgba(59,130,246,0.15)',
    // Status colors
    danger: '#EF4444',
    dangerBg: 'rgba(239,68,68,0.12)',
    dangerBorder: 'rgba(239,68,68,0.25)',
    success: '#22C55E',
    successBg: 'rgba(34,197,94,0.12)',
    successBorder: 'rgba(34,197,94,0.25)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.12)',
    // Inputs
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputFocus: 'rgba(59,130,246,0.3)',
    modalOverlay: 'rgba(0,0,0,0.6)',
    // Sidebar
    sidebarBg: 'rgba(255,255,255,0.02)',
    sidebarWidth: 220,
  },
  light: {
    name: 'light',
    glass: 'rgba(255,255,255,0.6)',
    glassBorder: 'rgba(255,255,255,0.3)',
    glassHover: 'rgba(255,255,255,0.8)',
    bg: '#EFF2F7',
    bgSecondary: '#FFFFFF',
    bgTertiary: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.04)',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentGlass: 'rgba(37,99,235,0.1)',
    danger: '#DC2626',
    dangerBg: 'rgba(220,38,38,0.08)',
    dangerBorder: 'rgba(220,38,38,0.2)',
    success: '#16A34A',
    successBg: 'rgba(22,163,74,0.08)',
    successBorder: 'rgba(22,163,74,0.2)',
    warning: '#D97706',
    warningBg: 'rgba(217,119,6,0.08)',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(0,0,0,0.15)',
    inputFocus: 'rgba(37,99,235,0.2)',
    modalOverlay: 'rgba(0,0,0,0.3)',
    sidebarBg: '#FFFFFF',
    sidebarWidth: 220,
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return themes[saved] || themes.dark;
    } catch {
      return themes.dark;
    }
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme.name);
    document.body.style.background = theme.bg;
    // Inject scrollbar styles
    const styleId = 'pims-theme-scrollbar';
    let el = document.getElementById(styleId);
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: ${theme.name === 'dark' ? '#080B12' : '#EFF2F7'}; }
      ::-webkit-scrollbar-thumb { background: ${theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}; border-radius: 3px; }
      :root { --bg: ${theme.bg}; --text: ${theme.text}; --accent: ${theme.accent}; }
    `;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t.name === 'dark' ? themes.light : themes.dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
