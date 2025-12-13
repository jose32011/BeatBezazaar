import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useThemeHero } from "@/hooks/useThemeHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ThemeHeroPreviewProps {
  theme: Theme;
  onImageSelect?: (imageUrl: string) => void;
}

export function ThemeHeroPreview({ theme, onImageSelect }: ThemeHeroPreviewProps) {
  const { getThemeColors } = useTheme();
  const { themeHeroImages, themeHeroAlternatives, themeHeroDescriptions } = useThemeHero();
  const [selectedImage, setSelectedImage] = useState<string>(themeHeroImages[theme]);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const themeColors = getThemeColors();
  const allImages = [themeHeroImages[theme], ...themeHeroAlternatives[theme]];

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageError(null);
    onImageSelect?.(imageUrl);
  };

  const handleImageError = (imageUrl: string) => {
    setImageError(imageUrl);
  };

  return (
    <Card 
      className="p-4"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    >
      <h3 
        className="text-lg font-semibold mb-2 capitalize"
        style={{ color: themeColors.text }}
      >
        {theme.replace('-', ' ')} Theme
      </h3>
      
      <p 
        className="text-sm mb-4"
        style={{ color: themeColors.textSecondary }}
      >
        {themeHeroDescriptions[theme]}
      </p>

      {/* Main Preview */}
      <div className="mb-4">
        <div 
          className="relative h-32 rounded-lg overflow-hidden bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${selectedImage})`,
            backgroundColor: themeColors.background
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h4 
                className="text-lg font-bold mb-1"
                style={{ 
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                Sample Hero Title
              </h4>
              <p 
                className="text-sm"
                style={{ 
                  color: '#f8f9fa',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                Your premium beat marketplace
              </p>
            </div>
          </div>
          {imageError === selectedImage && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: themeColors.surface }}
            >
              <p style={{ color: themeColors.textSecondary }}>
                Image failed to load
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Options */}
      <div className="grid grid-cols-3 gap-2">
        {allImages.map((imageUrl, index) => (
          <button
            key={index}
            onClick={() => handleImageSelect(imageUrl)}
            className={`relative h-16 rounded overflow-hidden border-2 transition-all ${
              selectedImage === imageUrl ? 'ring-2' : ''
            }`}
            style={{
              borderColor: selectedImage === imageUrl ? themeColors.primary : themeColors.border,
              ringColor: themeColors.primary
            }}
          >
            <img
              src={imageUrl}
              alt={`Hero option ${index + 1}`}
              className="w-full h-full object-cover"
              onError={() => handleImageError(imageUrl)}
            />
            {imageError === imageUrl && (
              <div 
                className="absolute inset-0 flex items-center justify-center text-xs"
                style={{ 
                  backgroundColor: themeColors.surface,
                  color: themeColors.textSecondary
                }}
              >
                Error
              </div>
            )}
          </button>
        ))}
      </div>

      {onImageSelect && (
        <Button
          onClick={() => onImageSelect(selectedImage)}
          className="w-full mt-4"
          style={{
            backgroundColor: themeColors.primary,
            color: '#ffffff'
          }}
        >
          Use This Hero Image
        </Button>
      )}
    </Card>
  );
}

export default ThemeHeroPreview;