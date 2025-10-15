import { Play, Pause, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  genre: string;
  price: number;
  imageUrl: string;
}

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onAddToCart?: () => void;
}

export default function BeatCard({ 
  beat, 
  isPlaying = false, 
  onPlayPause,
  onAddToCart 
}: BeatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group overflow-hidden hover-elevate transition-all duration-300"
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
        <div className={`absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="icon"
            className="h-16 w-16 rounded-full"
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
          <Badge variant="secondary" className="text-xs" data-testid={`badge-genre-${beat.id}`}>
            {beat.genre}
          </Badge>
          <Badge variant="secondary" className="text-xs" data-testid={`badge-bpm-${beat.id}`}>
            {beat.bpm} BPM
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1" data-testid={`text-title-${beat.id}`}>
          {beat.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-producer-${beat.id}`}>
          by {beat.producer}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold font-display" data-testid={`text-price-${beat.id}`}>
            ${beat.price}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onAddToCart}
            data-testid={`button-add-cart-${beat.id}`}
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
