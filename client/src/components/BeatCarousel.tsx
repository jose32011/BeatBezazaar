import { useCallback, useEffect } from "react";
import { Play } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CarouselBeat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  genre: string;
  price: number;
  imageUrl: string;
}

interface BeatCarouselProps {
  beats: CarouselBeat[];
  onPlayBeat?: (beat: CarouselBeat) => void;
}

export default function BeatCarousel({ beats, onPlayBeat }: BeatCarouselProps) {
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
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="flex-[0_0_100%] min-w-0 relative"
              data-testid={`carousel-slide-${beat.id}`}
            >
              <div className="relative h-[400px] lg:h-[500px] overflow-hidden rounded-lg">
                <img
                  src={beat.imageUrl}
                  alt={beat.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="max-w-4xl">
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
                      <span className="text-2xl font-bold font-display" data-testid={`text-price-${beat.id}`}>
                        ${beat.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm bg-background/20"
        onClick={scrollPrev}
        data-testid="button-carousel-prev"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
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
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm bg-background/20"
        onClick={scrollNext}
        data-testid="button-carousel-next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
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
  );
}
