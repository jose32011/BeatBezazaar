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
    { 
      loop: true,
      align: 'center',
      containScroll: 'trimSnaps',
      slidesToScroll: 1
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative py-16 bg-gradient-to-b from-black/20 to-black/60">
      {/* Carousel Container */}
      <div className="overflow-hidden mx-8" ref={emblaRef}>
        <div className="flex gap-6">
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="flex-[0_0_80%] md:flex-[0_0_60%] lg:flex-[0_0_40%] xl:flex-[0_0_30%] min-w-0"
              data-testid={`carousel-slide-${beat.id}`}
            >
              <div className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105">
                {/* Card Background */}
                <div 
                  className="relative h-[300px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.primary}40, ${themeColors.secondary}40)`,
                  }}
                >
                  {/* Beat Image */}
                  <div className="absolute top-6 left-6 right-6">
                    <img
                      src={beat.imageUrl}
                      alt={beat.title}
                      className="w-16 h-16 rounded-lg object-cover shadow-lg"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2 truncate" data-testid={`text-title-${beat.id}`}>
                      {beat.title}
                    </h3>
                    <p className="text-sm opacity-80 mb-3 truncate" data-testid={`text-producer-${beat.id}`}>
                      by {beat.producer}
                    </p>
                    
                    {/* Beat Info */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {beat.bpm} BPM
                        </Badge>
                      </div>
                      <span className="text-lg font-bold" data-testid={`text-price-${beat.id}`}>
                        ${beat.price}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => onPlayBeat?.(beat)}
                        data-testid={`button-play-${beat.id}`}
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </Button>
                      
                      {userPlaylist.some(playlistBeat => playlistBeat.id === beat.id) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled
                          data-testid={`button-owned-${beat.id}`}
                        >
                          <Check className="h-3 w-3" />
                          Owned
                        </Button>
                      ) : (
                        onAddToCart && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => onAddToCart?.(beat)}
                            data-testid={`button-add-cart-${beat.id}`}
                          >
                            <ShoppingCart className="h-3 w-3" />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/10 hover:bg-white/20 border-white/30 text-white w-12 h-12 backdrop-blur-sm"
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
          className="rounded-full bg-white/10 hover:bg-white/20 border-white/30 text-white w-12 h-12 backdrop-blur-sm"
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