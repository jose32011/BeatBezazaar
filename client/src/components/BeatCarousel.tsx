import { useState, useEffect } from "react";
import { Play, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

import type { Beat } from "@shared/schema";

export type CarouselBeat = Beat;

interface BeatCarouselProps {
  beats: CarouselBeat[];
  userPlaylist?: CarouselBeat[];
  onPlayBeat?: (beat: CarouselBeat) => void;
  onAddToCart?: (beat: CarouselBeat) => void;
}

export default function BeatCarousel({ beats, userPlaylist = [], onPlayBeat, onAddToCart }: BeatCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % beats.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [beats.length]);

  const scrollPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + beats.length) % beats.length);
  };

  const scrollNext = () => {
    setCurrentIndex((prev) => (prev + 1) % beats.length);
  };

  // Calculate position and styling for each card with responsive adjustments
  const getCardStyle = (index: number) => {
    const position = (index - currentIndex + beats.length) % beats.length;
    const totalCards = Math.min(beats.length, 5); // Show max 5 cards
    
    if (position > Math.floor(totalCards / 2) && position < beats.length - Math.floor(totalCards / 2)) {
      return { display: 'none' }; // Hide cards that are too far
    }

    let adjustedPosition = position;
    if (position > beats.length / 2) {
      adjustedPosition = position - beats.length;
    }

    const absPosition = Math.abs(adjustedPosition);
    
    // Responsive scaling and spacing based on screen size
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // Device type detection with orientation consideration
    const isMobile = screenWidth < 640;
    const isSmallTablet = screenWidth >= 640 && screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    const isLargeTablet = screenWidth >= 1024 && screenWidth < 1280;
    
    let scale, translateX, rotateY;
    
    if (isMobile) {
      // Mobile: Keep unchanged - Card-like layout with minimal 3D effects
      scale = Math.max(0.85, 1 - absPosition * 0.15);
      translateX = adjustedPosition * 180; // Move cards much further out for maximum visibility
      rotateY = adjustedPosition * -8;
    } else if (isSmallTablet) {
      // Small Tablet: Larger cards, maximum separation
      if (isPortrait) {
        scale = Math.max(0.75, 1 - absPosition * 0.18);
        translateX = adjustedPosition * 240; // Maximum separation for visibility
        rotateY = adjustedPosition * -10;
      } else {
        scale = Math.max(0.7, 1 - absPosition * 0.2);
        translateX = adjustedPosition * 260; // Maximum visibility
        rotateY = adjustedPosition * -12;
      }
    } else if (isTablet) {
      // Medium Tablet: Even larger cards, maximum separation
      if (isPortrait) {
        scale = Math.max(0.7, 1 - absPosition * 0.2);
        translateX = adjustedPosition * 300; // Much more space between cards
        rotateY = adjustedPosition * -12;
      } else {
        scale = Math.max(0.65, 1 - absPosition * 0.22);
        translateX = adjustedPosition * 320; // Maximum card separation
        rotateY = adjustedPosition * -15;
      }
    } else {
      // Desktop: Large cards with maximum separation
      scale = Math.max(0.55, 1 - absPosition * 0.25);
      translateX = adjustedPosition * 400; // Maximum space for complete visibility
      rotateY = adjustedPosition * -20;
    }
    
    const translateZ = isMobile ? -absPosition * 50 : -absPosition * 100;
    const opacity = Math.max(isMobile ? 0.6 : 0.3, 1 - absPosition * 0.3);
    const zIndex = 10 - absPosition;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      transition: 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
    };
  };

  return (
    <div className="relative py-8 overflow-hidden">
      {/* 3D Carousel Container */}
      <div 
        className="relative h-[520px] sm:h-[500px] md:h-[580px] lg:h-[640px] xl:h-[700px] flex items-center justify-center w-full mb-12"
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: 'center center'
        }}
      >
        {beats.map((beat, index) => {
          const cardStyle = getCardStyle(index);
          const isCenter = (index - currentIndex + beats.length) % beats.length === 0;
          const isOwned = userPlaylist.some(playlistBeat => playlistBeat.id === beat.id);
          
          return (
            <div
              key={beat.id}
              className="absolute w-[320px] sm:w-[540px] md:w-[660px] lg:w-[780px] xl:w-[900px] 2xl:w-[1000px] cursor-pointer"
              style={cardStyle}
              data-testid={`carousel-slide-${beat.id}`}
              onClick={() => setCurrentIndex(index)}
            >
              <div className={`relative group transition-all duration-300 ${isCenter ? 'hover:scale-105' : ''}`}>
                {/* Mobile Card Layout (< 640px) */}
                <div className="sm:hidden">
                  <div 
                    className="relative rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    }}
                  >
                    {/* Square Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={beat.imageUrl}
                        alt={beat.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Hover Overlay with Play Button and Actions - Only on center card */}
                      {isCenter && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                          {/* Play Button */}
                          <Button
                            size="icon"
                            className="h-16 w-16 rounded-full mb-4"
                            style={{ 
                              backgroundColor: themeColors.primary,
                              color: '#ffffff'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayBeat?.(beat);
                            }}
                          >
                            <Play className="h-8 w-8 ml-1" />
                          </Button>
                          
                          {/* Add to Cart / Owned Button */}
                          {isOwned ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-white/20 border-white/50 text-white"
                              disabled
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            onAddToCart && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-white/20 border-white/50 text-white hover:bg-white/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart?.(beat);
                                }}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )
                          )}
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: themeColors.surface,
                            color: themeColors.text,
                            borderColor: themeColors.border
                          }}
                        >
                          {beat.bpm} BPM
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-4">
                      <h3 
                        className="font-semibold text-base mb-1 line-clamp-2"
                        style={{ color: themeColors.text }}
                      >
                        {beat.title}
                      </h3>
                      <p 
                        className="text-sm mb-3"
                        style={{ color: themeColors.textSecondary }}
                      >
                        by {beat.producer}
                      </p>
                      
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          className="text-xl font-bold"
                          style={{ color: themeColors.text }}
                        >
                          ${beat.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablet Layout (640px - 1024px) */}
                <div className="hidden sm:block lg:hidden">
                  <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Blurred Background */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${beat.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px)',
                        transform: 'scale(1.2)',
                      }}
                    />
                    
                    {/* Light overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/20" />
                    
                    {/* BPM Badge - Top Right Corner */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge 
                        variant="outline" 
                        className="text-sm backdrop-blur-sm"
                        style={{
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.text
                        }}
                      >
                        {beat.bpm} BPM
                      </Badge>
                    </div>
                    
                    {/* Card Content Layout - Tablet optimized */}
                    <div className="relative h-full flex flex-col p-6">
                      {/* Top Section - Album Art and Basic Info */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <img
                            src={beat.imageUrl}
                            alt={beat.title}
                            className="w-28 h-28 rounded-xl object-cover shadow-2xl border-2 border-white/20"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold mb-1 truncate text-white drop-shadow-lg">
                            {beat.title}
                          </h3>
                          <p className="text-sm text-white/90 truncate drop-shadow-md">
                            by {beat.producer}
                          </p>
                          <span className="text-xl font-bold text-white drop-shadow-lg">
                            ${beat.price}
                          </span>
                        </div>
                      </div>
                      
                      {/* Bottom Section - Action Buttons - Only show on center card */}
                      {isCenter && (
                        <div className="mt-auto">
                          <div className="flex gap-3">
                            <Button
                              className="flex-1 bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-sm text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayBeat?.(beat);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Play Preview
                            </Button>
                            
                            {isOwned ? (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-white/50 text-white bg-white/10 backdrop-blur-sm"
                                disabled
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              onAddToCart && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(beat);
                                  }}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout (>= 1024px) */}
                <div className="hidden lg:block">
                  <div className="relative h-[420px] md:h-[440px] lg:h-[460px] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Blurred Background */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${beat.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px)',
                        transform: 'scale(1.2)',
                      }}
                    />
                    
                    {/* Light overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/20" />
                    
                    {/* BPM Badge - Top Right Corner */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge 
                        variant="outline" 
                        className="text-sm backdrop-blur-sm"
                        style={{
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.text
                        }}
                      >
                        {beat.bpm} BPM
                      </Badge>
                    </div>
                    
                    {/* Card Content Layout */}
                    <div className="relative h-full flex p-4 md:p-6 gap-4 md:gap-6">
                      {/* Album Art - Left Side */}
                      <div className="flex-shrink-0 h-full">
                        <img
                          src={beat.imageUrl}
                          alt={beat.title}
                          className="h-full aspect-square rounded-xl md:rounded-2xl object-cover shadow-2xl border-2 sm:border-4 border-white/20"
                        />
                      </div>
                      
                      {/* Beat Info and Actions - Right Side */}
                      <div className="flex-1 flex flex-col justify-between text-white min-w-0">
                        {/* Top Section - Title, Producer */}
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold mb-2 truncate text-white drop-shadow-lg" data-testid={`text-title-${beat.id}`}>
                            {beat.title}
                          </h3>
                          <p className="text-base md:text-lg text-white/90 mb-3 truncate drop-shadow-md" data-testid={`text-producer-${beat.id}`}>
                            by {beat.producer}
                          </p>
                        </div>
                        
                        {/* Middle Section - Price */}
                        <div className="my-4">
                          <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg" data-testid={`text-price-${beat.id}`}>
                            ${beat.price}
                          </span>
                        </div>
                        
                        {/* Bottom Section - Action Buttons - Only show on center card */}
                        {isCenter && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button
                              className="flex-1 bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-sm text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayBeat?.(beat);
                              }}
                              data-testid={`button-play-${beat.id}`}
                            >
                              <Play className="h-5 w-5 mr-2" />
                              Play Preview
                            </Button>
                            
                            {isOwned ? (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-white/50 text-white bg-white/10 backdrop-blur-sm"
                                disabled
                                data-testid={`button-owned-${beat.id}`}
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                            ) : (
                              onAddToCart && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(beat);
                                  }}
                                  data-testid={`button-add-cart-${beat.id}`}
                                >
                                  <ShoppingCart className="h-5 w-5" />
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows - Bottom Center with more space */}
      <div className="flex justify-center gap-4 mt-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 backdrop-blur-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border,
            color: themeColors.text
          }}
          onClick={scrollPrev}
          data-testid="button-carousel-prev"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 backdrop-blur-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border,
            color: themeColors.text
          }}
          onClick={scrollNext}
          data-testid="button-carousel-next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Button>
      </div>
    </div>
  );
}