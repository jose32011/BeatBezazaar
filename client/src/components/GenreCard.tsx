import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

interface GenreCardProps {
  name: string;
  beatCount: number;
  imageUrl: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function GenreCard({ name, beatCount, imageUrl, onClick, isSelected = false }: GenreCardProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <Card
      className={`group relative overflow-hidden cursor-pointer hover-elevate transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
      data-testid={`card-genre-${name.toLowerCase()}`}
      style={{
        backgroundColor: themeColors.surface,
        borderColor: isSelected ? themeColors.primary : themeColors.border,
        color: themeColors.text
      }}
    >
      <div className="aspect-[2/1] relative">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
          style={{
            background: `linear-gradient(to top, ${themeColors.background}, ${themeColors.background}80, transparent)`
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 
            className="text-sm font-bold font-display mb-0.5" 
            data-testid={`text-genre-name-${name.toLowerCase()}`}
            style={{ color: themeColors.text }}
          >
            {name}
          </h3>
          <p 
            className="text-xs" 
            data-testid={`text-genre-count-${name.toLowerCase()}`}
            style={{ color: themeColors.textSecondary }}
          >
            {beatCount} beats
          </p>
        </div>
      </div>
    </Card>
  );
}
