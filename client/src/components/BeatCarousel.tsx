import { useCallback } from "react";
import { Play, ShoppingCart, Check } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
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
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative overflow-visible">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="flex-[0_0_100%] min-w-0 relative"
              data-testid={`carousel-slide-${beat.id}`}
            >
              <div className="relative h-[400px] lg:h-[500px] overflow-hidden rounded-lg">
                {/* Blurred background image */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${beat.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(40px)',
                    transform: 'scale(1.1)',
                  }}
                />
                
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Album art on the left - not stretched */}
                <div className="absolute left-0 top-0 bottom-0 w-[400px] lg:w-[500px] flex items-center justify-center p-8">
                  <img
                    src={beat.imageUrl}
                    alt={beat.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="max-w-4xl ml-[420px] lg:ml-[520px]">
                    <div className="flex gap-3 mb-4">
                      <Badge variant="secondary" data-testid={`badge-genre-${beat.id}`}>
                        {beat.genre}
                      </Badge>
                      <Badge variant="secondary" data-testid={`badge-bpm-${beat.id}`}>
                        {beat.bpm} BPM
                      </Badge>
                    </div>
                    
                    <h3 className="text-3xl lg:text-5xl font-bold font-display mb-2" data-testid={`text-title-${beat.id}`}>
                      {beat.title}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-4" data-testid={`text-producer-${beat.id}`}>
                      by {beat.producer}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={() => onPlayBeat?.(beat)}
                        data-testid={`button-play-${beat.id}`}
                      >
                        <Play className="h-5 w-5" />
                        Preview
                      </Button>
                      <div className="flex gap-2">
                        {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? (
                          <Button
                            size="lg"
                            variant="outline"
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
                            <Check className="h-5 w-5" />
                            Owned
                          </Button>
                        ) : (
                          onAddToCart && (
                            <Button
                              size="lg"
                              variant="outline"
                              className="gap-2"
                              onClick={() => onAddToCart?.(beat)}
                              data-testid={`button-add-cart-${beat.id}`}
                            >
                              <ShoppingCart className="h-5 w-5" />
                              Add to Cart
                            </Button>
                          )
                        )}
                      </div>
                      <span className="text-2xl font-bold font-display" data-testid={`text-price-${beat.id}`}>
                        {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? 'Owned' : `$${beat.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left Navigation Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 rounded-full backdrop-blur-sm bg-black/60 hover:bg-black/80 border-2 border-white/40 text-white w-14 h-14 shadow-xl -translate-x-1/2"
        onClick={scrollPrev}
        data-testid="button-carousel-prev"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </Button>

      {/* Right Navigation Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-50 rounded-full backdrop-blur-sm bg-black/60 hover:bg-black/80 border-2 border-white/40 text-white w-14 h-14 shadow-xl translate-x-1/2"
        onClick={scrollNext}
        data-testid="button-carousel-next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </Button>
    </div>
  );
}
