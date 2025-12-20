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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    // Set initial orientation
    handleOrientationChange();

    // Listen for resize events (orientation changes trigger resize)
    window.addEventListener('resize', handleOrientationChange);
    
    // Also listen for orientation change event if available
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

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
    
    // Responsive scaling and spacing based on screen size and orientation
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isLandscape = screenWidth > screenHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // Device type detection with orientation consideration
    const isMobile = screenWidth < 640;
    const isTabletPortrait = screenWidth >= 640 && screenWidth < 1024 && isPortrait;
    const isTabletLandscape = screenWidth >= 640 && screenWidth < 1024 && isLandscape;
    const isSmallTablet = screenWidth >= 640 && screenWidth < 768;
    const isMediumTablet = screenWidth >= 768 && screenWidth < 1024;
    const isLargeTablet = screenWidth >= 1024 && screenWidth < 1280;
    const isDesktop = screenWidth >= 1280 && screenWidth < 1536;
    const isLargeDesktop = screenWidth >= 1536;
    
    let scale, translateX, rotateY;
    
    if (isMobile) {
      // Mobile: Card-like layout with minimal 3D effects
      scale = Math.max(0.85, 1 - absPosition * 0.15);
      translateX = adjustedPosition * 200; // 280px card width - closer spacing
      rotateY = adjustedPosition * -5; // Minimal rotation for mobile cards
    } else if (isTabletPortrait) {
      // Tablet Portrait: Smaller cards, closer spacing for vertical screens
      if (isSmallTablet) {
        scale = Math.max(0.8, 1 - absPosition * 0.15);
        translateX = adjustedPosition * 260; // Tighter spacing for portrait
        rotateY = adjustedPosition * -6;
      } else {
        scale = Math.max(0.75, 1 - absPosition * 0.18);
        translateX = adjustedPosition * 320; // Medium spacing for portrait
        rotateY = adjustedPosition * -8;
      }
    } else if (isTabletLandscape) {
      // Tablet Landscape: Larger cards, more spacing for horizontal screens
      if (isSmallTablet) {
        scale = Math.max(0.7, 1 - absPosition * 0.2);
        translateX = adjustedPosition * 300; // More spacing for landscape
        rotateY = adjustedPosition * -8;
      } else {
        scale = Math.max(0.65, 1 - absPosition * 0.22);
        translateX = adjustedPosition * 380; // Generous spacing for landscape
        rotateY = adjustedPosition * -10;
      }
    } else if (isLargeTablet) {
      // Large Tablet: Adjust based on orientation
      if (isPortrait) {
        scale = Math.max(0.7, 1 - absPosition * 0.2);
        translateX = adjustedPosition * 400; // Portrait spacing
        rotateY = adjustedPosition * -10;
      } else {
        scale = Math.max(0.65, 1 - absPosition * 0.22);
        translateX = adjustedPosition * 460; // Landscape spacing
        rotateY = adjustedPosition * -12;
      }
    } else if (isDesktop) {
      // Desktop: Standard desktop layout
      scale = Math.max(0.55, 1 - absPosition * 0.25);
      translateX = adjustedPosition * 460; // Desktop spacing
      rotateY = adjustedPosition * -15;
    } else {
      // Large Desktop: Maximum spacing and effects
      scale = Math.max(0.5, 1 - absPosition * 0.3);
      translateX = adjustedPosition * 520; // Large desktop spacing
      rotateY = adjustedPosition * -18;
    }
    
    const translateZ = isMobile ? -absPosition * 50 : -absPosition * 100; // Less depth on mobile
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
    <div className="relative py-8 overflow-hidden ">
      {/* 3D Carousel Container */}
      <div 
        className="relative h-[420px] sm:h-[400px] md:h-[450px] lg:h-[480px] xl:h-[500px] flex items-center justify-center w-full mb-5"
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: 'center center'
        }}
      >
        {beats.map((beat, index) => {
          const cardStyle = getCardStyle(index);
          const isCenter = (index - currentIndex + beats.length) % beats.length === 0;
          
          return (
            <div
              key={beat.id}
              className="absolute w-[280px] sm:w-[320px] md:w-[400px] lg:w-[480px] xl:w-[560px] 2xl:w-[640px] cursor-pointer"
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
                      
                      {/* Play Button Overlay */}
                      <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isCenter ? 'opacity-100' : 'opacity-0'}`}
                           style={{ backgroundColor: `${themeColors.background}80` }}>
                        <Button
                          size="icon"
                          className="h-16 w-16 rounded-full"
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
                      </div>
                      
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
                        
                        {isCenter && (
                          <div className="flex gap-2">
                            {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled
                                style={{ 
                                  backgroundColor: themeColors.primary + '20',
                                  color: themeColors.primary,
                                  borderColor: themeColors.primary
                                }}
                              >
                                <Check className="h-4 w-4" />
                                Owned
                              </Button>
                            ) : (
                              onAddToCart && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  style={{ 
                                    backgroundColor: themeColors.surface,
                                    color: themeColors.text,
                                    borderColor: themeColors.border
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(beat);
                                  }}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  Add
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop/Tablet Layout (>= 640px) */}
                <div className="hidden sm:block">
                  <div className="relative h-[280px] md:h-[300px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl">
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
                            
                            {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? (
                              <Button
                                variant="outline"
                                className="border-white/50 text-white bg-white/10 backdrop-blur-sm px-6 text-sm"
                                disabled
                                data-testid={`button-owned-${beat.id}`}
                              >
                                <Check className="h-5 w-5 mr-2" />
                                Owned
                              </Button>
                            ) : (
                              onAddToCart && (
                                <Button
                                  variant="outline"
                                  className="border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm px-6 text-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(beat);
                                  }}
                                  data-testid={`button-add-cart-${beat.id}`}
                                >
                                  <ShoppingCart className="h-5 w-5 mr-2" />
                                  Add to Cart
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

      {/* Navigation Arrows - Bottom Center */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 backdrop-blur-sm border-white/30 text-white"
          style={{
            backgroundColor: themeColors.primary + '20' // Add 20% opacity
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
            backgroundColor: themeColors.buttonSecondary.includes('bg-') ? undefined : themeColors.secondary,
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