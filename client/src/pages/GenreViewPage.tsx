import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { useState, useEffect } from "react";
import BeatCard from "@/components/BeatCard";
import BeatCardSkeleton from "@/components/BeatCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Genre, Beat } from "@shared/schema";

export default function GenreViewPage() {
  const { genreId } = useParams<{ genreId: string }>();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const audioPlayer = useAudioPlayer();
  const [searchQuery, setSearchQuery] = useState("");
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

  // Fetch genre details
  const { data: genre, isLoading: genreLoading } = useQuery<Genre>({
    queryKey: [`/api/genres/${genreId}`],
    queryFn: async () => {
      const response = await fetch(`/api/genres/${genreId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch genre");
      }
      return response.json();
    },
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10, // 10 minutes - genre details rarely change
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch all beats for this genre
  const { data: beats = [], isLoading: beatsLoading, error } = useQuery<Beat[]>({
    queryKey: [`/api/genres/${genreId}/beats`],
    queryFn: async () => {
      const response = await fetch(`/api/genres/${genreId}/beats`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch beats");
      }
      return response.json();
    },
    enabled: !!genreId,
    staleTime: 1000 * 60 * 5, // 5 minutes - beats don't change frequently
    gcTime: 1000 * 60 * 30, // 30 minutes
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

  const handleBack = () => {
    setLocation("/music");
  };

  // Filter beats based on search query
  const filteredBeats = beats.filter((beat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      beat.title.toLowerCase().includes(query) ||
      beat.producer.toLowerCase().includes(query)
    );
  });

  const isLoading = genreLoading || beatsLoading;

  if (isLoading) {
    return (
      <div
        className="min-h-screen py-8 px-4"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Back Button Skeleton */}
          <Skeleton className="h-10 w-32 mb-6" />

          {/* Genre Header Skeleton */}
          <div className="mb-8 space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-6 max-w-md">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Beats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <BeatCardSkeleton key={i} />
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
            Failed to load beats
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: themeColors.text }}>
            Genre not found
          </p>
          <Button onClick={handleBack}>Back to Music</Button>
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
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBack();
            }
          }}
          className="mb-6 gap-2 transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: themeColors.text }}
          aria-label="Back to music page"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Music
        </Button>

        {/* Genre Header */}
        <header className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: genre.color || themeColors.primary }}
          >
            {genre.name}
          </h1>
          {genre.description && (
            <p
              className="text-lg"
              style={{ color: themeColors.textSecondary }}
            >
              {genre.description}
            </p>
          )}
        </header>

        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <label htmlFor="beat-search" className="sr-only">
            Search beats by title or producer
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: themeColors.textSecondary }}
              aria-hidden="true"
            />
            <Input
              id="beat-search"
              type="text"
              placeholder="Search by title or producer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
              aria-label="Search beats by title or producer"
            />
          </div>
        </div>

        {/* Audio status live region for screen readers */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {audioPlayer.currentlyPlaying && (
            <span>
              Now playing: {beats.find(b => b.id === audioPlayer.currentlyPlaying)?.title || 'beat'}
            </span>
          )}
        </div>

        {/* Beats Grid */}
        {filteredBeats.length > 0 ? (
          <main 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="main"
            aria-label={`${filteredBeats.length} beats in ${genre.name}`}
          >
            {filteredBeats.map((beat) => {
              const isInCart = cart.some((item: any) => item.beatId === beat.id);
              const isOwned = purchases.some((p) => p.beatId === beat.id);
              const isPlaying = audioPlayer.isPlaying(beat.id);

              return (
                <BeatCard
                  key={beat.id}
                  beat={beat}
                  isPlaying={isPlaying}
                  hasAudioError={audioPlayer.hasError(beat.id)}
                  isInCart={isInCart}
                  isOwned={isOwned}
                  onPlayPause={() => {
                    if (isPlaying) {
                      audioPlayer.pause();
                    } else {
                      audioPlayer.play(beat.id, beat.audioUrl || "");
                    }
                  }}
                  onAddToCart={() => handleAddToCart(beat.id)}
                />
              );
            })}
          </main>
        ) : beats.length === 0 ? (
          <div className="text-center py-12" role="main">
            <p className="text-lg" style={{ color: themeColors.textSecondary }}>
              No beats available in this genre
            </p>
          </div>
        ) : (
          <div className="text-center py-12" role="status">
            <p className="text-lg" style={{ color: themeColors.textSecondary }}>
              No beats match your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
