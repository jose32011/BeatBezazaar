import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = 'original' | 'default' | 'card-match' | 'black-white' | 'red-black' | 'blue-purple' | 'green-dark' | 'orange-dark' | 'pink-purple' | 'cyan-dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getThemeColors: () => ThemeColors;
  isLoading: boolean;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  gradient: string;
  cardBackground: string;
  inputBackground: string;
  buttonPrimary: string;
  buttonSecondary: string;
  hover: string;
}

const themes: Record<Theme, ThemeColors> = {
  original: {
    primary: 'hsl(210, 90%, 55%)',
    secondary: 'hsl(210, 90%, 45%)',
    background: '#363C48',
    surface: 'rgba(0, 0, 0, 0.4)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#3b82f6',
    gradient: 'from-slate-700 to-slate-800',
    cardBackground: 'backdrop-blur-sm bg-black/20',
    inputBackground: 'bg-black/20',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-black/30 hover:bg-black/40',
    hover: 'hover:bg-black/20'
  },
  default: {
    primary: 'hsl(262, 83%, 58%)',
    secondary: 'hsl(262, 83%, 48%)',
    background: 'linear-gradient(135deg, #4c63d2 0%, #5a4fcf 100%)',
    surface: 'rgba(255, 255, 255, 0.15)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(255, 255, 255, 0.2)',
    accent: '#f59e0b',
    gradient: 'from-purple-900 via-blue-900 to-indigo-900',
    cardBackground: 'backdrop-blur-sm bg-white/10',
    inputBackground: 'bg-white/10',
    buttonPrimary: 'bg-purple-600 hover:bg-purple-700',
    buttonSecondary: 'bg-white/20 hover:bg-white/30',
    hover: 'hover:bg-white/20'
  },
  'card-match': {
    primary: 'hsl(210, 90%, 55%)',
    secondary: 'hsl(210, 90%, 45%)',
    background: 'hsl(210, 40%, 5%)',
    surface: 'hsl(215, 30%, 12%)',
    text: 'hsl(210, 15%, 95%)',
    textSecondary: 'hsl(210, 10%, 70%)',
    border: 'hsl(215, 20%, 25%)',
    accent: 'hsl(210, 90%, 55%)',
    gradient: 'from-slate-900 to-slate-800',
    cardBackground: 'bg-card border-card-border',
    inputBackground: 'bg-card',
    buttonPrimary: 'bg-primary hover:bg-primary/90',
    buttonSecondary: 'bg-secondary hover:bg-secondary/80',
    hover: 'hover:bg-accent'
  },
  'black-white': {
    primary: '#000000',
    secondary: '#333333',
    background: 'linear-gradient(135deg, #000000 0%, #0d0d0d 100%)',
    surface: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#ffffff',
    gradient: 'from-black via-gray-900 to-black',
    cardBackground: 'backdrop-blur-sm bg-white/5',
    inputBackground: 'bg-white/5',
    buttonPrimary: 'bg-black hover:bg-gray-900',
    buttonSecondary: 'bg-white/10 hover:bg-white/20',
    hover: 'hover:bg-white/10'
  },
  'red-black': {
    primary: '#dc2626',
    secondary: '#b91c1c',
    background: 'linear-gradient(135deg, #b91c1c 0%, #000000 100%)',
    surface: 'rgba(220, 38, 38, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(220, 38, 38, 0.25)',
    accent: '#fbbf24',
    gradient: 'from-red-900 via-black to-red-900',
    cardBackground: 'backdrop-blur-sm bg-red-900/20',
    inputBackground: 'bg-red-900/10',
    buttonPrimary: 'bg-red-600 hover:bg-red-700',
    buttonSecondary: 'bg-red-900/30 hover:bg-red-900/40',
    hover: 'hover:bg-red-900/20'
  },
  'blue-purple': {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
    surface: 'rgba(59, 130, 246, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(59, 130, 246, 0.3)',
    accent: '#f59e0b',
    gradient: 'from-blue-900 via-purple-900 to-indigo-900',
    cardBackground: 'backdrop-blur-sm bg-blue-900/20',
    inputBackground: 'bg-blue-900/10',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-blue-900/30 hover:bg-blue-900/40',
    hover: 'hover:bg-blue-900/20'
  },
  'green-dark': {
    primary: '#10b981',
    secondary: '#059669',
    background: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
    surface: 'rgba(16, 185, 129, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(16, 185, 129, 0.3)',
    accent: '#f59e0b',
    gradient: 'from-green-900 via-emerald-900 to-teal-900',
    cardBackground: 'backdrop-blur-sm bg-green-900/20',
    inputBackground: 'bg-green-900/10',
    buttonPrimary: 'bg-green-600 hover:bg-green-700',
    buttonSecondary: 'bg-green-900/30 hover:bg-green-900/40',
    hover: 'hover:bg-green-900/20'
  },
  'orange-dark': {
    primary: '#f97316',
    secondary: '#ea580c',
    background: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
    surface: 'rgba(249, 115, 22, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(249, 115, 22, 0.3)',
    accent: '#fbbf24',
    gradient: 'from-orange-900 via-red-900 to-amber-900',
    cardBackground: 'backdrop-blur-sm bg-orange-900/20',
    inputBackground: 'bg-orange-900/10',
    buttonPrimary: 'bg-orange-600 hover:bg-orange-700',
    buttonSecondary: 'bg-orange-900/30 hover:bg-orange-900/40',
    hover: 'hover:bg-orange-900/20'
  },
  'pink-purple': {
    primary: '#ec4899',
    secondary: '#be185d',
    background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)',
    surface: 'rgba(236, 72, 153, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(236, 72, 153, 0.3)',
    accent: '#f59e0b',
    gradient: 'from-pink-900 via-purple-900 to-rose-900',
    cardBackground: 'backdrop-blur-sm bg-pink-900/20',
    inputBackground: 'bg-pink-900/10',
    buttonPrimary: 'bg-pink-600 hover:bg-pink-700',
    buttonSecondary: 'bg-pink-900/30 hover:bg-pink-900/40',
    hover: 'hover:bg-pink-900/20'
  },
  'cyan-dark': {
    primary: '#06b6d4',
    secondary: '#0891b2',
    background: 'linear-gradient(135deg, #0891b2 0%, #0c4a6e 100%)',
    surface: 'rgba(6, 182, 212, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(6, 182, 212, 0.3)',
    accent: '#f59e0b',
    gradient: 'from-cyan-900 via-blue-900 to-sky-900',
    cardBackground: 'backdrop-blur-sm bg-cyan-900/20',
    inputBackground: 'bg-cyan-900/10',
    buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700',
    buttonSecondary: 'bg-cyan-900/30 hover:bg-cyan-900/40',
    hover: 'hover:bg-cyan-900/20'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage immediately to prevent flash
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('beatbazaar-theme') as Theme;
    return (savedTheme && themes[savedTheme]) ? savedTheme : 'original';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load theme from database on mount
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const userTheme = data.user?.theme as Theme;
          if (userTheme && themes[userTheme]) {
            setTheme(userTheme);
          }
        } else {
          // Fallback to localStorage if not authenticated
          const savedTheme = localStorage.getItem('beatbazaar-theme') as Theme;
          if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('beatbazaar-theme') as Theme;
        if (savedTheme && themes[savedTheme]) {
          setTheme(savedTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to CSS variables when theme changes
  useEffect(() => {
    const themeColors = themes[theme];
    const root = document.documentElement;
    
    // Apply theme colors as CSS variables
    root.style.setProperty('--theme-primary', themeColors.primary);
    root.style.setProperty('--theme-secondary', themeColors.secondary);
    root.style.setProperty('--theme-background', themeColors.background);
    root.style.setProperty('--theme-surface', themeColors.surface);
    root.style.setProperty('--theme-text', themeColors.text);
    root.style.setProperty('--theme-text-secondary', themeColors.textSecondary);
    root.style.setProperty('--theme-border', themeColors.border);
    root.style.setProperty('--theme-accent', themeColors.accent);
    
    // Update the body class for gradient backgrounds
    root.className = `theme-${theme}`;
  }, [theme]);

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save to localStorage as fallback
    localStorage.setItem('beatbazaar-theme', newTheme);
    
    // Save to database
    try {
      const response = await fetch('/api/auth/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ theme: newTheme }),
      });
      
      if (!response.ok) {
        console.error('Failed to save theme to database');
      }
    } catch (error) {
      console.error('Error saving theme to database:', error);
    }
  };

  const getThemeColors = () => themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, getThemeColors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
