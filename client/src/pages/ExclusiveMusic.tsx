import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import BeatCard from "@/components/BeatCard";
import GenreCard from "@/components/GenreCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, Music, Shield, Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Beat, Genre } from "@shared/schema";

interface PlansSettings {
  basicPlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
  premiumPlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
  exclusivePlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
}

export default function ExclusiveMusic() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isInCart } = useCart();
  const { getThemeColors } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioPlayer = useAudioPlayer();
  const themeColors = getThemeColors();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const beatsPerPage = 20;

  // Fetch genres
  const { data: genres = [] } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
    queryFn: async () => {
      const response = await fetch('/api/genres', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch genres');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch exclusive beats
  const { data: exclusiveBeats = [], isLoading: beatsLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats/exclusive'],
    queryFn: async () => {
      const response = await fetch('/api/beats/exclusive', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch exclusive beats');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch plans settings
  const { data: plansSettings } = useQuery<PlansSettings>({
    queryKey: ['/api/plans-settings'],
    queryFn: async () => {
      const response = await fetch('/api/plans-settings');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
  });

  // Fetch user's current plan (if authenticated)
  const { data: userPlan } = useQuery<{ plan: string }>({
    queryKey: ['/api/user/plan'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/plan', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user plan');
      return response.json();
    },
  });

  const handleExclusivePurchase = (beat: Beat) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase exclusive beats",
        variant: "destructive",
      });
      setLocation('/login?redirect=/exclusive-music');
      return;
    }

    // Check if user has a plan that allows exclusive purchases
    if (!userPlan || userPlan.plan === 'basic') {
      toast({
        title: "Plan Upgrade Required",
        description: "Exclusive beats require a Premium or Exclusive plan",
        variant: "destructive",
      });
      setLocation('/plans?upgrade=exclusive');
      return;
    }

    // Proceed with exclusive purchase
    handleExclusivePurchaseFlow(beat);
  };

  const handleExclusivePurchaseFlow = async (beat: Beat) => {
    try {
      const response = await fetch('/api/exclusive-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          beatId: beat.id,
          userId: user?.id,
          price: beat.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate exclusive purchase');
      }

      // Invalidate relevant caches to show real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/beats/exclusive'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] });

      toast({
        title: "Exclusive Purchase Initiated",
        description: "Your exclusive purchase request has been submitted for admin approval. You will be notified once approved.",
      });

    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Failed to initiate exclusive purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Crown className="h-5 w-5" />;
      case 'exclusive':
        return <Star className="h-5 w-5" />;
      default:
        return <Music className="h-5 w-5" />;
    }
  };

  const canPurchaseExclusive = (beatPlan: string) => {
    if (!userPlan) return false;
    
    const planHierarchy = { basic: 1, premium: 2, exclusive: 3 };
    const userPlanLevel = planHierarchy[userPlan.plan as keyof typeof planHierarchy] || 0;
    const requiredLevel = planHierarchy[beatPlan as keyof typeof planHierarchy] || 1;
    
    return userPlanLevel >= requiredLevel;
  };

  // Helper function to normalize genre names for comparison
  const normalizeGenreName = (name: string | null | undefined) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[-\s]/g, '');
  };

  // Filter and sort exclusive beats
  const filteredExclusiveBeats = useMemo(() => {
    let filtered = [...exclusiveBeats];

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter(beat => {
        // Find the genre name from the genre ID
        const genreName = genres.find(g => g.id === beat.genre)?.name || beat.genre;
        return normalizeGenreName(genreName) === normalizeGenreName(selectedGenre);
      });
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
  }, [exclusiveBeats, selectedGenre, searchQuery, selectedProducer, sortBy, genres]);

  // Pagination
  const totalPages = Math.ceil(filteredExclusiveBeats.length / beatsPerPage);
  const paginatedExclusiveBeats = useMemo(() => {
    const startIndex = (currentPage - 1) * beatsPerPage;
    return filteredExclusiveBeats.slice(startIndex, startIndex + beatsPerPage);
  }, [filteredExclusiveBeats, currentPage, beatsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, searchQuery, selectedProducer, sortBy]);

  // Calculate exclusive beat counts for each genre
  const genresWithExclusiveCounts = genres.map(genre => {
    const matchingBeats = exclusiveBeats.filter(beat => beat.genre === genre.id);
    return {
      ...genre,
      beatCount: matchingBeats.length,
      imageUrl: genre.imageUrl || ''
    };
  }).filter(genre => genre.beatCount > 0); // Only show genres with exclusive beats

  if (beatsLoading) {
    return (
      <div 
        className="min-h-screen"
        style={{ background: themeColors.background }}
      >
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p style={{ color: themeColors.textSecondary }}>Loading exclusive beats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ background: themeColors.background }}
    >
      <Header />
      
      {/* Hero Section */}
      <section className="w-full px-6 py-16">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: themeColors.background,
                border: `2px solid ${themeColors.border}`
              }}
            >
              <Crown className="h-10 w-10" style={{ color: themeColors.text }} />
            </div>
          </div>
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ color: themeColors.text }}
          >
            Exclusive Music
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-8"
            style={{ color: themeColors.textSecondary }}
          >
            Premium exclusive beats available only to our Premium and Exclusive plan members. 
            Own these beats completely - they'll be removed from the store once purchased.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/login?redirect=/exclusive-music')}
                size="lg"
                style={{
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`
                }}
              >
                Sign In to Access
              </Button>
              <Button 
                onClick={() => setLocation('/plans')}
                variant="outline"
                size="lg"
              >
                View Plans
              </Button>
            </div>
          )}

          {isAuthenticated && (!userPlan || userPlan.plan === 'basic') && (
            <Card className="max-w-md mx-auto mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Upgrade Required
                </CardTitle>
                <CardDescription>
                  Exclusive beats require a Premium or Exclusive plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setLocation('/plans?upgrade=exclusive')}
                  className="w-full"
                  style={{
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                    border: `1px solid ${themeColors.border}`
                  }}
                >
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Plan Requirements Section */}
      {plansSettings && (
        <section className="w-full px-6 py-8">
          <div className="container mx-auto">
            <h2 
              className="text-2xl font-bold text-center mb-8"
              style={{ color: themeColors.text }}
            >
              Plan Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <Card 
                className="text-center"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: userPlan?.plan === 'basic' ? themeColors.primary : themeColors.border,
                  border: userPlan?.plan === 'basic' ? `2px solid ${themeColors.primary}` : `1px solid ${themeColors.border}`
                }}
              >
                <CardHeader>
                  <div 
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.basicPlan.name}</CardTitle>
                  <CardDescription>No exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Basic plan members cannot purchase exclusive beats
                  </p>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card 
                className="text-center"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: userPlan?.plan === 'premium' ? themeColors.primary : themeColors.border,
                  border: userPlan?.plan === 'premium' ? `2px solid ${themeColors.primary}` : `1px solid ${themeColors.border}`
                }}
              >
                <CardHeader>
                  <div 
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: themeColors.accent }}
                  >
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.premiumPlan.name}</CardTitle>
                  <CardDescription>Limited exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access to premium exclusive beats
                  </p>
                </CardContent>
              </Card>

              {/* Exclusive Plan */}
              <Card className={`text-center ${userPlan?.plan === 'exclusive' ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.exclusivePlan.name}</CardTitle>
                  <CardDescription>Full exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access to all exclusive beats
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Search and Filters */}
      {isAuthenticated && userPlan && userPlan.plan !== 'basic' && exclusiveBeats.length > 0 && (
        <section className="w-full px-6 py-4">
          <div className="container mx-auto">
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
                    {Array.from(new Set(exclusiveBeats.map(b => b.producer))).sort().map((producer) => (
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
          </div>
        </section>
      )}

      {/* Genre Filter */}
      {isAuthenticated && userPlan && userPlan.plan !== 'basic' && genresWithExclusiveCounts.length > 0 && (
        <section className="w-full px-6 py-4">
          <div className="container mx-auto">
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
              {genresWithExclusiveCounts.map((genre) => (
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
          </div>
        </section>
      )}

      {/* Exclusive Beats Grid */}
      {isAuthenticated && userPlan && userPlan.plan !== 'basic' && (
        <section className="w-full px-6 py-8 pb-32">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold"
                style={{ color: themeColors.text }}
              >
                {selectedGenre ? `${selectedGenre} Exclusive Beats` : 'Available Exclusive Beats'}
              </h2>
              <span style={{ color: themeColors.textSecondary }}>
                Showing {paginatedExclusiveBeats.length} of {filteredExclusiveBeats.length} {filteredExclusiveBeats.length === 1 ? 'beat' : 'beats'}
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </span>
            </div>
            
            {exclusiveBeats.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p style={{ color: themeColors.textSecondary }}>
                  No exclusive beats available at the moment. Check back soon!
                </p>
              </div>
            ) : filteredExclusiveBeats.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p style={{ color: themeColors.textSecondary }}>
                  {selectedGenre 
                    ? `No exclusive beats available in ${selectedGenre} genre` 
                    : 'No exclusive beats match your search'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedExclusiveBeats.map((beat) => {
                  // Find the genre name from the genre ID
                  const genreName = genres.find(g => g.id === beat.genre)?.name || beat.genre;
                  return (
                    <div key={beat.id} className="relative">
                      <BeatCard
                        beat={beat}
                        genreName={genreName}
                        isPlaying={audioPlayer.isPlaying(beat.id)}
                        hasAudioError={audioPlayer.hasError(beat.id)}
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
                            }, false, filteredExclusiveBeats);
                          }
                        }}
                        onAddToCart={() => handleExclusivePurchase(beat)}
                        isInCart={isInCart(beat.id)}
                        isOwned={false}
                        showAddToCart={canPurchaseExclusive(beat.exclusivePlan || 'premium')}
                        addToCartText="Purchase Exclusive"
                        />
                      <div className="absolute top-2 right-2">
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{
                            backgroundColor: themeColors.background,
                            color: themeColors.text,
                            border: `1px solid ${themeColors.border}`
                          }}
                        >
                          {getPlanIcon(beat.exclusivePlan || 'premium')}
                          {beat.exclusivePlan || 'Premium'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
          </div>
        </section>
      )}
    </div>
  );
}