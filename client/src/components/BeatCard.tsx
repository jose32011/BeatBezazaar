import { Play, Pause, ShoppingCart, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

import type { Beat } from "@shared/schema";

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  isOwned?: boolean;
  onPlayPause?: () => void;
  onAddToCart?: () => void;
}

export default function BeatCard({ 
  beat, 
  isPlaying = false, 
  isOwned = false,
  onPlayPause,
  onAddToCart
}: BeatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <Card 
      className="group overflow-hidden hover-elevate transition-all duration-300 theme-card"
      style={{ 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-beat-${beat.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.imageUrl}
          alt={beat.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-testid={`img-beat-${beat.id}`}
        />
        <div 
          className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: `${themeColors.background}80` }}
        >
          <Button
            size="icon"
            className="h-16 w-16 rounded-full theme-button-primary"
            style={{ 
              backgroundColor: themeColors.primary,
              color: '#ffffff'
            }}
            onClick={onPlayPause}
            data-testid={`button-play-${beat.id}`}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge 
            variant="secondary" 
            className="text-xs theme-surface" 
            style={{ 
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              borderColor: themeColors.border
            }}
            data-testid={`badge-genre-${beat.id}`}
          >
            {beat.genre}
          </Badge>
          <Badge 
            variant="secondary" 
            className="text-xs theme-surface"
            style={{ 
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              borderColor: themeColors.border
            }}
            data-testid={`badge-bpm-${beat.id}`}
          >
            {beat.bpm} BPM
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <h3 
          className="font-semibold text-base mb-1 line-clamp-2 theme-text" 
          style={{ color: themeColors.text }}
          data-testid={`text-title-${beat.id}`}
        >
          {beat.title}
        </h3>
        <p 
          className="text-sm mb-3 theme-text-secondary" 
          style={{ color: themeColors.textSecondary }}
          data-testid={`text-producer-${beat.id}`}
        >
          by {beat.producer}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          <span 
            className="text-2xl font-bold font-display theme-text" 
            style={{ color: themeColors.text }}
            data-testid={`text-price-${beat.id}`}
          >
            {isOwned ? 'Owned' : `$${beat.price}`}
          </span>
          <div className="flex gap-2">
            {isOwned ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled
                style={{ 
                  backgroundColor: themeColors.primary + '20',
                  color: themeColors.primary,
                  borderColor: themeColors.primary,
                  cursor: 'not-allowed'
                }}
                data-testid={`button-owned-${beat.id}`}
              >
                <Check className="h-4 w-4" />
                Owned
              </Button>
            ) : (
              onAddToCart && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 theme-button-secondary"
                  style={{ 
                    backgroundColor: themeColors.surface,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }}
                  onClick={onAddToCart}
                  data-testid={`button-add-cart-${beat.id}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
