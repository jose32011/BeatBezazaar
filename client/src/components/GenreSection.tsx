import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import BeatCard from "./BeatCard";
import { useTheme } from "@/contexts/ThemeContext";
import type { Genre, Beat } from "@shared/schema";

interface GenreSectionProps {
  genre: Genre;
  beats: Beat[];
  totalBeats: number;
  onViewAll: (genreId: string) => void;
  isPlaying: (beatId: string) => boolean;
  hasAudioError?: (beatId: string) => boolean;
  onPlayPause: (beatId: string, audioUrl: string) => void;
  onAddToCart?: (beatId: string) => void;
  isInCart?: (beatId: string) => boolean;
  isOwned?: (beatId: string) => boolean;
}

export default function GenreSection({
  genre,
  beats,
  totalBeats,
  onViewAll,
  isPlaying,
  hasAudioError = () => false,
  onPlayPause,
  onAddToCart,
  isInCart = () => false,
  isOwned = () => false,
}: GenreSectionProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Limit to 6 beats for preview
  const previewBeats = beats.slice(0, 6);
  const showViewAll = totalBeats > 6;

  return (
    <section 
      className="mb-12"
      aria-labelledby={`genre-heading-${genre.id}`}
      data-testid={`section-genre-${genre.id}`}
    >
      {/* Genre Header */}
      <div 
        className="mb-6 pb-4 border-b-2"
        style={{ borderColor: genre.color }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 
              id={`genre-heading-${genre.id}`}
              className="text-2xl font-bold font-display mb-2"
              style={{ color: genre.color }}
              data-testid={`heading-genre-${genre.id}`}
            >
              {genre.name}
            </h2>
            {genre.description && (
              <p 
                className="text-base"
                style={{ color: themeColors.textSecondary }}
                data-testid={`description-genre-${genre.id}`}
              >
                {genre.description}
              </p>
            )}
          </div>
          {showViewAll && (
            <Button
              variant="outline"
              className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md min-h-[44px] sm:min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={() => onViewAll(genre.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewAll(genre.id);
                }
              }}
              style={{
                backgroundColor: genre.color + '10',
                color: genre.color,
                borderColor: genre.color,
              }}
              aria-label={`View all ${totalBeats} beats in ${genre.name}`}
              data-testid={`button-view-all-${genre.id}`}
            >
              View All ({totalBeats})
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Beat Grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        data-testid={`grid-beats-${genre.id}`}
      >
        {previewBeats.map((beat) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            genreName={genre.name}
            isPlaying={isPlaying(beat.id)}
            hasAudioError={hasAudioError(beat.id)}
            isInCart={isInCart(beat.id)}
            isOwned={isOwned(beat.id)}
            onPlayPause={() => onPlayPause(beat.id, beat.audioUrl || '')}
            onAddToCart={onAddToCart ? () => onAddToCart(beat.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
