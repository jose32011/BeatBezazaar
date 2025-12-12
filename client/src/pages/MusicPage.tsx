import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import BeatCard from "@/components/BeatCard";
import GenreCard from "@/components/GenreCard";
import AudioPlayerFooter from "@/components/AudioPlayerFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import type { Genre, Beat } from "@shared/schema";

export default function MusicPage() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const audioPlayer = useAudioPlayer();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const beatsPerPage = 20;

  // Check for genre query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genreParam = params.get('genre');
    if (genreParam) {
      setSelectedGenre(genreParam);
    }
  }, []);

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

  // Fetch all beats
  const { data: beats = [], isLoading: beatsLoading, error: beatsError } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
    queryFn: async () => {
      const response = await fetch("/api/beats", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch beats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch genres
  const { data: genres = [], isLoading: genresLoading } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const response = await fetch("/api/genres", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
    staleTime: 1000 * 60 * 2, // 2 minutes - allow for real-time updates after purchase
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

  // Helper function to normalize genre names for comparison
  const normalizeGenreName = (name: string | null | undefined) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[-\s]/g, '');
  };

  // Filter and sort beats
  const purchasedBeatIds = new Set(purchases.map(p => p.beatId));
  
  const filteredBeats = useMemo(() => {
    let filtered = beats.filter(beat => !purchasedBeatIds.has(beat.id));

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter(beat => 
        normalizeGenreName(beat.genre) === normalizeGenreName(selectedGenre)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(beat => 
        beat.title.toLowerCase().includes(query) || 
        beat.producer.toLowerCase().includes(query)
      );
    }

    // Filter by producer
    if (selectedProducer !== 'all') {
      filtered = filtered.filter(beat => beat.producer === selectedProducer);
    }

    // Sort beats
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [beats, purchasedBeatIds, selectedGenre, searchQuery, selectedProducer, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredBeats.length / beatsPerPage);
  const paginatedBeats = useMemo(() => {
    const startIndex = (currentPage - 1) * beatsPerPage;
    return filteredBeats.slice(startIndex, startIndex + beatsPerPage);
  }, [filteredBeats, currentPage, beatsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, searchQuery, selectedProducer, sortBy]);

  // Calculate beat counts for each genre
  const genresWithCounts = genres.map(genre => {
    const matchingBeats = beats.filter(beat => 
      !purchasedBeatIds.has(beat.id) && 
      normalizeGenreName(beat.genre) === normalizeGenreName(genre.name)
    );
    return {
      ...genre,
      beatCount: matchingBeats.length,
      imageUrl: genre.imageUrl || ''
    };
  });

  const isLoading = beatsLoading || genresLoading;
  const error = beatsError;

  if (isLoading) {
    return (
      <>
        <Header />
        <div
          className="min-h-screen py-8 px-6"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="w-full mx-auto">
            <h1
              className="text-4xl font-bold mb-8"
              style={{ color: themeColors.text }}
            >
              Browse Music
            </h1>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p style={{ color: themeColors.textSecondary }}>Loading beats...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
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
      </>
    );
  }

  return (
    <>
      <Header />
      <div
        className="min-h-screen py-8 px-6 pb-32"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="w-full mx-auto">
          <h1
            className="text-4xl font-bold mb-6"
            style={{ color: themeColors.text }}
          >
            Browse Music
          </h1>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                  style={{ color: themeColors.textSecondary }}
                />
                <Input
                  type="text"
                  placeholder="Search by title or producer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
              </div>

              {/* Producer Filter */}
              <Select value={selectedProducer} onValueChange={setSelectedProducer}>
                <SelectTrigger 
                  className="w-full md:w-[200px]"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  <SelectValue placeholder="All Producers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Producers</SelectItem>
                  {Array.from(new Set(beats.map(b => b.producer))).sort().map((producer) => (
                    <SelectItem key={producer} value={producer}>
                      {producer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger 
                  className="w-full md:w-[200px]"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="a-z">A-Z (Title)</SelectItem>
                  <SelectItem value="z-a">Z-A (Title)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genre Filter */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-2xl font-bold"
                style={{ color: themeColors.text }}
              >
                Filter by Genre
              </h2>
              {selectedGenre && (
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="text-sm hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {genresWithCounts.map((genre) => (
                <GenreCard
                  key={genre.id}
                  name={genre.name}
                  beatCount={genre.beatCount}
                  imageUrl={genre.imageUrl}
                  onClick={() => setSelectedGenre(selectedGenre === genre.name ? null : genre.name)}
                  isSelected={selectedGenre === genre.name}
                />
              ))}
            </div>
          </section>

          {/* Beats Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold"
                style={{ color: themeColors.text }}
              >
                {selectedGenre ? `${selectedGenre} Beats` : 'All Beats'}
              </h2>
              <span style={{ color: themeColors.textSecondary }}>
                Showing {filteredBeats.length} {filteredBeats.length === 1 ? 'beat' : 'beats'}
              </span>
            </div>

            {filteredBeats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-4" style={{ color: themeColors.textSecondary }}>
                  {beats.length > 0 && purchases.length > 0 && beats.length === purchases.length
                    ? "You've purchased all available beats! Check your Library to play them."
                    : selectedGenre 
                    ? `No beats available in ${selectedGenre} genre` 
                    : 'No beats available'}
                </p>
                {beats.length > 0 && purchases.length > 0 && beats.length === purchases.length && (
                  <Button
                    onClick={() => setLocation('/library')}
                    style={{
                      backgroundColor: themeColors.primary,
                      color: 'white',
                    }}
                  >
                    Go to Library
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                  {paginatedBeats.map((beat) => {
                    const isOwned = purchases.some((p) => p.beatId === beat.id);
                    // Find the genre name from the genre ID
                    const genreName = genres.find(g => g.id === beat.genre)?.name || beat.genre;
                    return (
                      <BeatCard
                        key={beat.id}
                        beat={beat}
                        genreName={genreName}
                        isPlaying={audioPlayer.isPlaying(beat.id)}
                        hasAudioError={audioPlayer.hasError(beat.id)}
                        isInCart={cart.some((item: any) => item.id === beat.id)}
                        isOwned={isOwned}
                        onPlayPause={() => {
                          if (audioPlayer.isPlaying(beat.id)) {
                            audioPlayer.pause();
                          } else {
                            audioPlayer.play(beat.id, beat.audioUrl || '', {
                              id: beat.id,
                              title: beat.title,
                              producer: beat.producer,
                              imageUrl: beat.imageUrl,
                              audioUrl: beat.audioUrl || undefined,
                            }, isOwned);
                          }
                    }}
                        onAddToCart={() => handleAddToCart(beat.id)}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                backgroundColor: page === currentPage ? themeColors.primary : themeColors.surface,
                                borderColor: themeColors.border,
                                color: page === currentPage ? 'white' : themeColors.text,
                              }}
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} style={{ color: themeColors.textSecondary }}>...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <AudioPlayerFooter />
    </>
  );
}
