import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import GenreSection from "@/components/GenreSection";
import GenreSectionSkeleton from "@/components/GenreSectionSkeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Genre, Beat } from "@shared/schema";

interface GenreWithBeats {
  genre: Genre;
  beats: Beat[];
  totalBeats: number;
}

export default function MusicPage() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const audioPlayer = useAudioPlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Show toast when audio error occurs
  useEffect(() => {
    if (audioPlayer.error) {
      toast({
        title: "Audio Error",
        description: audioPlayer.error,
        variant: "destructive",
      });
    }
  }, [audioPlayer.error, toast]);

  // Fetch genres with beats
  const { data: genresWithBeats, isLoading, error } = useQuery<GenreWithBeats[]>({
    queryKey: ["/api/genres-with-beats"],
    queryFn: async () => {
      const response = await fetch("/api/genres-with-beats?limit=10", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch genres with beats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - genres don't change frequently
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
  });

  // Fetch user's cart
  const { data: cart = [] } = useQuery<Beat[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/cart", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch cart");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds - cart changes frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch user's purchases
  const { data: purchases = [] } = useQuery<{ beatId: string }[]>({
    queryKey: ["/api/purchases/my"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/purchases/my", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch purchases");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes - purchases rarely change
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (beatId: string) => {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ beatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Beat has been added to your cart",
      });
    },
    onError: (error) => {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add beat to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (beatId: string) => {
    if (!user) {
      setLocation("/login");
      return;
    }

    addToCartMutation.mutate(beatId);
  };

  const handleViewAll = (genreId: string) => {
    setLocation(`/music/genre/${genreId}`);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen py-8 px-4"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl font-bold mb-8"
            style={{ color: themeColors.text }}
          >
            Browse by Genre
          </h1>
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <GenreSectionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: themeColors.text }}>
            Failed to load genres
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: themeColors.background }}
    >
      <div className="max-w-7xl mx-auto">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ color: themeColors.text }}
        >
          Browse by Genre
        </h1>

        {genresWithBeats && genresWithBeats.length > 0 ? (
          <div className="space-y-12" role="main">
            {/* Audio status live region for screen readers */}
            <div 
              className="sr-only" 
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
            >
              {audioPlayer.currentlyPlaying && (
                <span>
                  Now playing: {genresWithBeats
                    .flatMap(g => g.beats)
                    .find(b => b.id === audioPlayer.currentlyPlaying)?.title || 'beat'}
                </span>
              )}
            </div>
            {genresWithBeats.map(({ genre, beats, totalBeats }) => (
              <GenreSection
                key={genre.id}
                genre={genre}
                beats={beats}
                totalBeats={totalBeats}
                onViewAll={handleViewAll}
                isPlaying={(beatId) => audioPlayer.isPlaying(beatId)}
                hasAudioError={(beatId) => audioPlayer.hasError(beatId)}
                onPlayPause={(beatId, audioUrl) => {
                  if (audioPlayer.isPlaying(beatId)) {
                    audioPlayer.pause();
                  } else {
                    audioPlayer.play(beatId, audioUrl);
                  }
                }}
                onAddToCart={handleAddToCart}
                isInCart={(beatId) => cart.some((item: any) => item.beatId === beatId)}
                isOwned={(beatId) => purchases.some((p) => p.beatId === beatId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12" role="main">
            <p className="text-lg" style={{ color: themeColors.textSecondary }}>
              No genres available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
