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
    
    // Responsive scaling and spacing
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    let scale, translateX, rotateY;
    
    if (isMobile) {
      // Mobile: More aggressive scaling, closer spacing
      scale = Math.max(0.7, 1 - absPosition * 0.25);
      translateX = adjustedPosition * 280; // Closer spacing for mobile
      rotateY = adjustedPosition * -10; // Less rotation for mobile
    } else if (isTablet) {
      // Tablet: Medium scaling and spacing
      scale = Math.max(0.65, 1 - absPosition * 0.22);
      translateX = adjustedPosition * 350;
      rotateY = adjustedPosition * -12;
    } else {
      // Desktop: Original values
      scale = Math.max(0.6, 1 - absPosition * 0.2);
      translateX = adjustedPosition * 450;
      rotateY = adjustedPosition * -15;
    }
    
    const translateZ = -absPosition * 100; // Depth
    const opacity = Math.max(0.3, 1 - absPosition * 0.3);
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
        className="relative h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px] flex items-center justify-center w-full mb-5"
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
              className="absolute w-[85vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] max-w-[800px] cursor-pointer"
              style={cardStyle}
              data-testid={`carousel-slide-${beat.id}`}
              onClick={() => setCurrentIndex(index)}
            >
              <div className={`relative group transition-all duration-300 ${isCenter ? 'hover:scale-105' : ''}`}>
                {/* Card with Blurred Album Art Background */}
                <div className="relative h-[260px] sm:h-[320px] md:h-[360px] lg:h-[400px] rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
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
                  <div className="relative h-full flex p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
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
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 truncate text-white drop-shadow-lg" data-testid={`text-title-${beat.id}`}>
                          {beat.title}
                        </h3>
                        <p className="text-sm sm:text-base md:text-lg text-white/90 mb-2 sm:mb-3 truncate drop-shadow-md" data-testid={`text-producer-${beat.id}`}>
                          by {beat.producer}
                        </p>
                      </div>
                      
                      {/* Middle Section - Price */}
                      <div className="my-2 sm:my-4">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg" data-testid={`text-price-${beat.id}`}>
                          ${beat.price}
                        </span>
                      </div>
                      
                      {/* Bottom Section - Action Buttons - Only show on center card */}
                      {isCenter && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            className="flex-1 bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-sm text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayBeat?.(beat);
                            }}
                            data-testid={`button-play-${beat.id}`}
                          >
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                            Play Preview
                          </Button>
                          
                          {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? (
                            <Button
                              variant="outline"
                              className="border-white/50 text-white bg-white/10 backdrop-blur-sm px-3 sm:px-6 text-xs sm:text-sm"
                              disabled
                              data-testid={`button-owned-${beat.id}`}
                            >
                              <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                              Owned
                            </Button>
                          ) : (
                            onAddToCart && (
                              <Button
                                variant="outline"
                                className="border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm px-3 sm:px-6 text-xs sm:text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart?.(beat);
                                }}
                                data-testid={`button-add-cart-${beat.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
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
          );
        })}
      </div>

      {/* Navigation Arrows - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-50">
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