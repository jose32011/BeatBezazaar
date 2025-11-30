import { Play, Pause, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";

import type { Beat } from "@shared/schema";

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  isOwned?: boolean;
  isInCart?: boolean;
  hasAudioError?: boolean;
  onPlayPause?: () => void;
  onAddToCart?: () => void;
}

export default function BeatCard({ 
  beat, 
  isPlaying = false, 
  isOwned = false,
  isInCart = false,
  hasAudioError = false,
  onPlayPause,
  onAddToCart
}: BeatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const [, setLocation] = useLocation();

  // Optional: Preload audio on hover for better UX
  const handleMouseEnter = () => {
    setIsHovered(true);
    // Preload audio when hovering over the card
    if (beat.audioUrl && !hasAudioError) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = beat.audioUrl;
      document.head.appendChild(link);
    }
  };

  const handleCardClick = () => {
    setLocation(`/beats/${beat.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 theme-card cursor-pointer hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text,
        outlineColor: themeColors.primary
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${beat.title} by ${beat.producer}, ${beat.bpm} BPM, ${isOwned ? 'Owned' : `$${beat.price.toFixed(2)}`}`}
      data-testid={`card-beat-${beat.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageError ? '/placeholder-beat.png' : beat.imageUrl}
          alt={`Cover art for ${beat.title}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImageError(true)}
          data-testid={`img-beat-${beat.id}`}
        />
        <div 
          className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isHovered || isPlaying ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: `${themeColors.background}80` }}
        >
          <Button
            size="icon"
            className={`h-16 w-16 rounded-full theme-button-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${isPlaying ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
            style={{ 
              backgroundColor: hasAudioError ? themeColors.textSecondary : themeColors.primary,
              color: '#ffffff',
              cursor: hasAudioError ? 'not-allowed' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasAudioError && onPlayPause) {
                onPlayPause();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!hasAudioError && onPlayPause) {
                  onPlayPause();
                }
              }
            }}
            disabled={hasAudioError}
            aria-label={hasAudioError ? 'Audio unavailable' : isPlaying ? `Pause ${beat.title}` : `Play ${beat.title}`}
            aria-pressed={isPlaying}
            data-testid={`button-play-${beat.id}`}
          >
            {hasAudioError ? (
              <AlertCircle className="h-8 w-8" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="h-8 w-8" aria-hidden="true" />
            ) : (
              <Play className="h-8 w-8 ml-1" aria-hidden="true" />
            )}
          </Button>
          {hasAudioError && (
            <div 
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded"
              style={{ 
                backgroundColor: themeColors.surface,
                color: themeColors.textSecondary
              }}
            >
              Audio unavailable
            </div>
          )}
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
            {isOwned ? 'Owned' : `$${beat.price.toFixed(2)}`}
          </span>
          <div className="flex gap-2">
            {isOwned ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 transition-all duration-200 min-h-[44px] sm:min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                disabled
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  backgroundColor: themeColors.primary + '20',
                  color: themeColors.primary,
                  borderColor: themeColors.primary,
                  cursor: 'not-allowed'
                }}
                aria-label={`${beat.title} is already owned`}
                data-testid={`button-owned-${beat.id}`}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Owned
              </Button>
            ) : isInCart ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 transition-all duration-200 min-h-[44px] sm:min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                disabled
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  backgroundColor: themeColors.primary + '20',
                  color: themeColors.primary,
                  borderColor: themeColors.primary,
                  cursor: 'not-allowed'
                }}
                aria-label={`${beat.title} is already in cart`}
                data-testid={`button-in-cart-${beat.id}`}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                In Cart
              </Button>
            ) : (
              onAddToCart && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 theme-button-secondary transition-all duration-200 hover:scale-105 hover:shadow-md min-h-[44px] sm:min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ 
                    backgroundColor: themeColors.surface,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToCart) {
                      onAddToCart();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onAddToCart) {
                        onAddToCart();
                      }
                    }
                  }}
                  aria-label={`Add ${beat.title} to cart`}
                  data-testid={`button-add-cart-${beat.id}`}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
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
