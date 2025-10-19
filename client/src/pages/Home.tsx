import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BeatCard from "@/components/BeatCard";
import type { Beat } from "@shared/schema";
import BeatCarousel from "@/components/BeatCarousel";
import AudioPlayer from "@/components/AudioPlayer";
import PlaylistCard from "@/components/PlaylistCard";
import Cart, { type CartItem } from "@/components/Cart";
import FilterSidebar from "@/components/FilterSidebar";
import GenreCard from "@/components/GenreCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Music, Plus, LogIn, User } from "lucide-react";

// Import beat artworks
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';
import rnbArtwork from '@assets/generated_images/R&B_beat_artwork_0c1becce.png';
import trapArtwork from '@assets/generated_images/Trap_beat_artwork_7a3eb926.png';
import lofiArtwork from '@assets/generated_images/Lo-fi_beat_artwork_fd552e59.png';
import popArtwork from '@assets/generated_images/Pop_beat_artwork_27280072.png';
import drillArtwork from '@assets/generated_images/Drill_beat_artwork_bb062263.png';

// Default genre artwork mapping
const genreArtworkMap: Record<string, string> = {
  'Hip-Hop': hipHopArtwork,
  'Trap': trapArtwork,
  'R&B': rnbArtwork,
  'Lo-fi': lofiArtwork,
  'Pop': popArtwork,
  'Drill': drillArtwork,
};

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playerBeat, setPlayerBeat] = useState<Beat | null>(null);
  const [playlist, setPlaylist] = useState<Beat[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(0);
  const [isPlaylistMode, setIsPlaylistMode] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);
  const [playerDuration, setPlayerDuration] = useState<number>(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { getThemeColors } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const themeColors = getThemeColors();

  // Fetch real beats from API
  const { data: beats = [], isLoading: beatsLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });

  // Fetch user's playlist (purchased beats with full details)
  const { data: userPlaylist = [], isLoading: playlistLoading } = useQuery<Beat[]>({
    queryKey: ['/api/playlist'],
    enabled: isAuthenticated,
  });

  // Fetch genres from API
  const { data: genres = [], isLoading: genresLoading } = useQuery<any[]>({
    queryKey: ['/api/genres'],
  });

  // Update playlist state when userPlaylist changes
  useEffect(() => {
    if (userPlaylist.length > 0) {
      setPlaylist(userPlaylist);
    }
    
    // Track site visit
    fetch('/api/analytics/visit', { method: 'POST' })
      .catch(error => console.log('Analytics tracking failed:', error));
  }, [userPlaylist]);

  // Fetch user's cart
  const { data: userCart = [], isLoading: cartLoading } = useQuery<Beat[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });


  // Add beat to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (beatId: string) => {
      return apiRequest('POST', '/api/cart/add', { beatId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to Cart",
        description: "Beat has been added to your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add beat to cart",
        variant: "destructive",
      });
    },
  });

  // Remove beat from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (beatId: string) => {
      return apiRequest('DELETE', `/api/cart/remove/${beatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Removed from Cart",
        description: "Beat has been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove beat from cart",
        variant: "destructive",
      });
    },
  });

  const handlePlayPause = (beat: Beat) => {
    console.log('Home handlePlayPause called for:', beat.title);
    console.log('Beat audio URL:', beat.audioUrl);
    console.log('User playlist:', userPlaylist.map(b => b.title));
    
    // Check if this beat is in the user's playlist (purchased)
    const isInPlaylist = userPlaylist.some(b => b.id === beat.id);
    console.log('Is in playlist:', isInPlaylist);
    
    if (currentlyPlaying === beat.id) {
      // If currently playing this beat, pause it
      console.log('Pausing current beat');
      setCurrentlyPlaying(null);
      setPlayerBeat(null);
      setIsPlaylistMode(false);
    } else {
      // If this is a purchased song, play it in playlist mode
      if (isInPlaylist) {
        console.log('Playing purchased song in playlist mode');
        const playlistIndex = userPlaylist.findIndex(b => b.id === beat.id);
        setPlaylist(userPlaylist);
        setCurrentPlaylistIndex(playlistIndex);
        setIsPlaylistMode(true);
        setCurrentlyPlaying(beat.id);
        setPlayerBeat(beat);
      } else {
        // Regular preview mode for non-purchased songs
        console.log('Playing non-purchased song in preview mode');
        setIsPlaylistMode(false);
        setCurrentlyPlaying(beat.id);
        setPlayerBeat(beat);
      }
    }
  };

  const handleNextSong = () => {
    if (!isPlaylistMode || playlist.length === 0) return;
    
    const nextIndex = (currentPlaylistIndex + 1) % playlist.length;
    const nextBeat = playlist[nextIndex];
    
    setCurrentPlaylistIndex(nextIndex);
    setCurrentlyPlaying(nextBeat.id);
    setPlayerBeat(nextBeat);
  };

  const handlePreviousSong = () => {
    if (!isPlaylistMode || playlist.length === 0) return;
    
    const prevIndex = currentPlaylistIndex === 0 ? playlist.length - 1 : currentPlaylistIndex - 1;
    const prevBeat = playlist[prevIndex];
    
    setCurrentPlaylistIndex(prevIndex);
    setCurrentlyPlaying(prevBeat.id);
    setPlayerBeat(prevBeat);
  };

  const handleSongEnd = () => {
    if (isPlaylistMode) {
      // Auto-play next song in playlist
      handleNextSong();
    } else {
      // Stop playback for preview mode
      setCurrentlyPlaying(null);
      setPlayerBeat(null);
    }
  };

  const handlePlayerTimeUpdate = (currentTime: number, duration: number) => {
    setPlayerCurrentTime(currentTime);
    setPlayerDuration(duration);
  };

  // Helper function to normalize genre names for comparison
  const normalizeGenreName = (name: string) => {
    return name.toLowerCase().replace(/[-\s]/g, '');
  };

  // Filter beats based on selected genres
  const filteredBeats = beats.filter(beat => {
    if (selectedGenres.length === 0) return true;
    return selectedGenres.some(selectedGenre => 
      normalizeGenreName(beat.genre) === normalizeGenreName(selectedGenre)
    );
  });

  // Filter beats for a specific genre (when genre card is clicked)
  const genreFilteredBeats = selectedGenre 
    ? beats.filter(beat => normalizeGenreName(beat.genre) === normalizeGenreName(selectedGenre))
    : filteredBeats;

  // Calculate beat counts for each genre
  const genresWithCounts = genres.map(genre => {
    const matchingBeats = beats.filter(beat => normalizeGenreName(beat.genre) === normalizeGenreName(genre.name));
    console.log(`Genre: ${genre.name} -> Normalized: ${normalizeGenreName(genre.name)}`);
    console.log(`Matching beats:`, matchingBeats.map(b => ({ title: b.title, genre: b.genre, normalized: normalizeGenreName(b.genre) })));
    return {
      ...genre,
      beatCount: matchingBeats.length,
      imageUrl: genre.imageUrl || genreArtworkMap[genre.name] || 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=No+Image'
    };
  });

  // Handle genre card click
  const handleGenreClick = (genreName: string) => {
    console.log(`Genre clicked: ${genreName}`);
    console.log(`Current selectedGenre: ${selectedGenre}`);
    
    if (selectedGenre === genreName) {
      // If same genre clicked, deselect it
      console.log('Deselecting genre');
      setSelectedGenre(null);
    } else {
      // Select the genre
      console.log('Selecting genre:', genreName);
      setSelectedGenre(genreName);
      
      // Debug: Show what beats will be filtered
      const filteredBeats = beats.filter(beat => normalizeGenreName(beat.genre) === normalizeGenreName(genreName));
      console.log(`Beats filtered for ${genreName}:`, filteredBeats.map(b => ({ title: b.title, genre: b.genre })));
    }
  };

  const handleAddToCart = (beat: Beat) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add beats to your cart",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }

    // Check if beat is already in user's playlist (already purchased)
    const isAlreadyOwned = userPlaylist.some(playlistBeat => playlistBeat.id === beat.id);
    if (isAlreadyOwned) {
      toast({
        title: "Already Owned",
        description: "You already own this beat in your playlist",
        variant: "destructive",
      });
      return;
    }

    // Use API for authenticated users
    addToCartMutation.mutate(beat.id);
  };


  const handleDownload = async (beat: Beat) => {
    if (!beat.audioUrl) {
      toast({
        title: "Download Unavailable",
        description: "Audio file not available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the secure download endpoint
      const response = await fetch(`/api/download/${beat.id}`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You have not purchased this song",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`Download failed: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a temporary link to download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${beat.title} - ${beat.producer}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      // Track download
      fetch('/api/analytics/download', { 
        method: 'POST',
        credentials: 'include'
      }).catch(error => console.log('Download tracking failed:', error));

      toast({
        title: "Download Started",
        description: `Downloading ${beat.title}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromCart = (id: string) => {
    if (isAuthenticated) {
      // Use API for authenticated users
      removeFromCartMutation.mutate(id);
    } else {
      // Use local state for non-authenticated users
      setCartItems(cartItems.filter(item => item.id !== id));
    }
  };

  const handleCheckout = async (paymentMethod: string) => {
    
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to complete checkout",
        variant: "destructive",
      });
      return;
    }

    if (displayCartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create purchases for each item in cart
      const purchasePromises = displayCartItems.map(async (item) => {
        const purchaseData = {
          userId: user?.id,
          beatId: item.id,
          price: item.price
        };
        const response = await apiRequest('POST', '/api/purchases', purchaseData);
        return response.json(); // Parse the JSON response
      });

      const purchases = await Promise.all(purchasePromises);
      console.log('Purchases created:', purchases);

      // Get customer ID - fetch the customer record for this user
      let customerId = user?.id; // Default to user ID
      try {
        const customerResponse = await apiRequest('GET', `/api/customers/by-user/${user?.id}`);
        const customer = await customerResponse.json();
        if (customer && customer.id) {
          customerId = customer.id;
          console.log('Found customer ID:', customerId);
        }
      } catch (error) {
        console.log('Could not fetch customer ID, using user ID:', error);
      }
      
      // Create payment record
      const totalAmount = displayCartItems.reduce((sum, item) => sum + Number(item.price), 0);
      const paymentData = {
        purchaseId: purchases[0]?.id, // Use first purchase ID
        customerId: customerId,
        amount: totalAmount,
        paymentMethod,
        bankReference: paymentMethod === 'bank_transfer' ? `BANK-${Date.now()}` : undefined,
        notes: paymentMethod === 'bank_transfer' ? 'Bank transfer payment' : 'PayPal payment'
      };

      const paymentResponse = await apiRequest('POST', '/api/payments', paymentData);
      const payment = await paymentResponse.json();
      console.log('Payment created:', payment);

      if (paymentMethod === 'paypal') {
        toast({
          title: "Payment Successful",
          description: "Your PayPal payment has been processed successfully!",
        });
      } else if (paymentMethod === 'bank_transfer') {
        toast({
          title: "Payment Pending",
          description: "Bank transfer initiated. Payment is pending approval. You will receive instructions via email.",
        });
      }

      // Clear cart
      if (isAuthenticated) {
        await apiRequest('DELETE', '/api/cart/clear');
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      } else {
        setCartItems([]);
      }
      
      setIsCartOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Use API cart for authenticated users, local cart for non-authenticated users
  const displayCartItems = isAuthenticated ? userCart : cartItems;
  const cartCount = displayCartItems.length;

  // Debug logging removed for cleaner console

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ background: themeColors.background }}
    >
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <Hero />

      {/* User Playlist Section - Only show if authenticated */}
      {isAuthenticated && (
        <section className="w-full px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-3xl font-bold font-display flex items-center gap-2"
              style={{ color: themeColors.text }}
            >
              <User className="h-8 w-8" />
              My Purchased Music
            </h2>
            <span style={{ color: themeColors.textSecondary }}>
              {userPlaylist.length} {userPlaylist.length === 1 ? 'purchase' : 'purchases'}
            </span>
          </div>
          
          {playlistLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p style={{ color: themeColors.textSecondary }}>Loading your playlist...</p>
            </div>
          ) : userPlaylist.length === 0 ? (
            <Card 
              style={{
                background: `linear-gradient(to right, ${themeColors.primary}20, ${themeColors.secondary}20)`,
                borderColor: `${themeColors.primary}30`
              }}
            >
              <CardContent className="p-8 text-center">
                <Music 
                  className="h-16 w-16 mx-auto mb-4" 
                  style={{ color: themeColors.textSecondary }}
                />
                <CardTitle 
                  className="text-2xl mb-2"
                  style={{ color: themeColors.text }}
                >
                  Your Playlist is Empty
                </CardTitle>
                <CardDescription 
                  className="mb-6"
                  style={{ color: themeColors.textSecondary }}
                >
                  Start building your collection by purchasing beats from our catalog
                </CardDescription>
                <Button 
                  onClick={() => document.getElementById('featured-beats')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Beats
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userPlaylist.map((beat) => (
                <PlaylistCard
                  key={beat.id}
                  beat={beat}
                  isPlaying={currentlyPlaying === beat.id}
                  onPlayPause={() => handlePlayPause(beat)}
                  onDownload={() => handleDownload(beat)}
                  autoPlay={isPlaylistMode && currentlyPlaying === beat.id}
                  isPlaylistMode={isPlaylistMode}
                  currentTime={playerCurrentTime}
                  duration={playerDuration}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Login Prompt Section - Only show if not authenticated */}
      {!isAuthenticated && (
        <section className="w-full px-6 py-8">
          <Card 
            style={{
              background: `linear-gradient(to right, ${themeColors.primary}20, ${themeColors.secondary}20)`,
              borderColor: `${themeColors.primary}30`
            }}
          >
            <CardContent className="p-8 text-center">
              <LogIn 
                className="h-16 w-16 mx-auto mb-4" 
                style={{ color: themeColors.textSecondary }}
              />
              <CardTitle 
                className="text-2xl mb-2"
                style={{ color: themeColors.text }}
              >
                Sign In to Build Your Playlist
              </CardTitle>
              <CardDescription 
                className="mb-6"
                style={{ color: themeColors.textSecondary }}
              >
                Create your personal music collection by signing in and purchasing beats
              </CardDescription>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => setLocation('/login')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => setLocation('/login')}
                  variant="outline"
                  style={{
                    borderColor: `${themeColors.text}30`,
                    color: themeColors.text
                  }}
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Promotional Banner Section */}
      <section className="w-full px-6 py-8">
        <div 
          className="rounded-2xl p-8 text-center border"
          style={{
            background: `linear-gradient(to right, ${themeColors.primary}20, ${themeColors.secondary}20)`,
            borderColor: `${themeColors.primary}30`
          }}
        >
          <h2 
            className="text-4xl font-bold font-display mb-4"
            style={{ color: themeColors.text }}
          >
            New Music Releases
          </h2>
          <p 
            className="text-xl mb-6"
            style={{ color: themeColors.textSecondary }}
          >
            Discover the latest beats from top producers
          </p>
          <div className="flex justify-center gap-4">
            <button 
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: themeColors.primary,
                color: '#ffffff'
              }}
            >
              Browse Latest
            </button>
            <button 
              className="px-6 py-3 border rounded-lg font-semibold transition-colors"
              style={{
                borderColor: `${themeColors.text}30`,
                color: themeColors.text
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Generated Banners Display */}
      {beats.length > 0 && (
        <section className="w-full px-6 py-8">
          <h2 
            className="text-3xl font-bold font-display mb-8"
            style={{ color: themeColors.text }}
          >
            Featured Releases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beats.slice(0, 3).map((beat) => (
              <div key={beat.id} className="relative group">
                <div 
                  className="rounded-2xl p-6 text-center border transition-all duration-300"
                  style={{
                    background: `linear-gradient(to right, ${themeColors.primary}20, ${themeColors.secondary}20)`,
                    borderColor: `${themeColors.primary}30`
                  }}
                >
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <img
                      src={beat.imageUrl}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: `${themeColors.background}20` }}
                    >
                      <button 
                        className="px-4 py-2 backdrop-blur-sm rounded-lg font-semibold transition-colors"
                        style={{
                          backgroundColor: `${themeColors.text}20`,
                          color: themeColors.text
                        }}
                      >
                        Play Preview
                      </button>
                    </div>
                  </div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    {beat.title}
                  </h3>
                  <p 
                    className="mb-2"
                    style={{ color: themeColors.textSecondary }}
                  >
                    by {beat.producer}
                  </p>
                  <div className="flex justify-center gap-2 mb-4">
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${themeColors.text}20`,
                        color: themeColors.text
                      }}
                    >
                      {beat.genre}
                    </span>
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${themeColors.text}20`,
                        color: themeColors.text
                      }}
                    >
                      {beat.bpm} BPM
                    </span>
                  </div>
                  <div 
                    className="text-2xl font-bold mb-4"
                    style={{ color: themeColors.text }}
                  >
                    ${beat.price}
                  </div>
                  <button 
                    className="w-full px-4 py-2 rounded-lg font-semibold transition-colors"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: '#ffffff'
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="w-full px-6 py-16">
        <h2 
          className="text-3xl font-bold font-display mb-8" 
          data-testid="text-latest-title"
          style={{ color: themeColors.text }}
        >
          Latest Tracks
        </h2>
        {beatsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p style={{ color: themeColors.textSecondary }}>Loading beats...</p>
          </div>
        ) : beats.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: themeColors.textSecondary }}>No beats available yet. Check back soon!</p>
          </div>
        ) : (
          <BeatCarousel
            beats={beats.slice(0, 6) as Beat[]}
            userPlaylist={userPlaylist}
            onPlayBeat={(beat) => handlePlayPause(beat)}
            onAddToCart={(beat) => handleAddToCart(beat)}
          />
        )}
      </section>

      <section className="w-full px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 
            className="text-3xl font-bold font-display" 
            data-testid="text-genres-title"
            style={{ color: themeColors.text }}
          >
            Browse by Genre
          </h2>
          {selectedGenre && (
            <div className="text-sm" style={{ color: themeColors.textSecondary }}>
              Showing {genreFilteredBeats.length} beats in "{selectedGenre}"
              <button 
                onClick={() => setSelectedGenre(null)}
                className="ml-2 underline hover:no-underline"
                style={{ color: themeColors.primary }}
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genresWithCounts.map((genre) => (
            <GenreCard
              key={genre.name}
              name={genre.name}
              beatCount={genre.beatCount}
              imageUrl={genre.imageUrl}
              onClick={() => handleGenreClick(genre.name)}
              isSelected={selectedGenre === genre.name}
            />
          ))}
        </div>
      </section>

      <section id="featured-beats" className="w-full px-6 py-16">
        <h2 
          className="text-3xl font-bold font-display mb-8" 
          data-testid="text-featured-title"
          style={{ color: themeColors.text }}
        >
          Featured Beats
        </h2>
        <div className="flex gap-8">
          <div className="hidden lg:block flex-shrink-0">
            <FilterSidebar onFiltersChange={(filters) => setSelectedGenres(filters.selectedGenres)} />
          </div>
          
          <div className="flex-1">
            {beatsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p style={{ color: themeColors.textSecondary }}>Loading beats...</p>
              </div>
            ) : beats.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: themeColors.textSecondary }}>No beats available yet. Upload some beats to get started!</p>
              </div>
            ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {genreFilteredBeats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              isPlaying={currentlyPlaying === beat.id}
              isOwned={userPlaylist.some(playlistBeat => playlistBeat.id === beat.id)}
              onPlayPause={() => handlePlayPause(beat)}
              onAddToCart={() => handleAddToCart(beat)}
            />
          ))}
        </div>
            )}
          </div>
        </div>
      </section>

      {playerBeat && (
        <AudioPlayer
          beatTitle={playerBeat.title}
          producer={playerBeat.producer}
          imageUrl={playerBeat.imageUrl}
          audioUrl={playerBeat.audioUrl || undefined}
          duration={30}
          isFullSong={isPlaylistMode}
          onNext={handleNextSong}
          onPrevious={handlePreviousSong}
          onSongEnd={handleSongEnd}
          onTimeUpdate={handlePlayerTimeUpdate}
          showPlaylistControls={isPlaylistMode}
          currentIndex={currentPlaylistIndex}
          totalSongs={playlist.length}
        />
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={displayCartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
