import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function ThemeWrapper({ children, className = "" }: ThemeWrapperProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <div 
      className={className}
      style={{
        '--theme-primary': themeColors.primary,
        '--theme-secondary': themeColors.secondary,
        '--theme-background': themeColors.background,
        '--theme-surface': themeColors.surface,
        '--theme-text': themeColors.text,
        '--theme-text-secondary': themeColors.textSecondary,
        '--theme-border': themeColors.border,
        '--theme-accent': themeColors.accent,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
