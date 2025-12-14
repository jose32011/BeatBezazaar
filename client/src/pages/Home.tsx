import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import type { Beat } from "@shared/schema";
import BeatCarousel from "@/components/BeatCarousel";
import AudioPlayer from "@/components/AudioPlayer";
import Cart, { type CartItem } from "@/components/Cart";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


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
  const [, setLocation] = useLocation();
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



  // Fetch home settings
  const { data: homeSettings } = useQuery<any>({
    queryKey: ['/api/home-settings'],
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
  const { data: userCart = [] } = useQuery<Beat[]>({
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
    console.log('🎵 Home handlePlayPause called for:', beat.title);
    console.log('🎵 Beat audio URL:', beat.audioUrl);
    console.log('🎵 User playlist:', userPlaylist.map(b => b.title));
    console.log('🎵 Currently playing:', currentlyPlaying);
    
    if (!beat.audioUrl) {
      console.error('❌ No audio URL for beat:', beat.title);
      toast({
        title: "No Audio Available",
        description: "This beat doesn't have an audio file",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this beat is in the user's playlist (purchased)
    const isInPlaylist = userPlaylist.some(b => b.id === beat.id);
    console.log('🎵 Is in playlist:', isInPlaylist);
    
    if (currentlyPlaying === beat.id) {
      // If currently playing this beat, pause it
      console.log('⏸️ Pausing current beat');
      setCurrentlyPlaying(null);
      setPlayerBeat(null);
      setIsPlaylistMode(false);
    } else {
      // If this is a purchased song, play it in playlist mode
      if (isInPlaylist) {
        console.log('▶️ Playing purchased song in playlist mode');
        const playlistIndex = userPlaylist.findIndex(b => b.id === beat.id);
        setPlaylist(userPlaylist);
        setCurrentPlaylistIndex(playlistIndex);
        setIsPlaylistMode(true);
        setCurrentlyPlaying(beat.id);
        setPlayerBeat(beat);
      } else {
        // Regular preview mode for non-purchased songs
        console.log('▶️ Playing non-purchased song in preview mode');
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



  const handleAddToCart = (beat: Beat) => {
    console.log('🛒 handleAddToCart called for:', beat.title);
    console.log('🛒 Is authenticated:', isAuthenticated);
    console.log('🛒 User cart:', userCart.map(b => b.title));
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
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
    console.log('🛒 Is already owned:', isAlreadyOwned);
    
    if (isAlreadyOwned) {
      console.log('❌ Beat already owned');
      toast({
        title: "Already Owned",
        description: "You already own this beat in your playlist",
        variant: "destructive",
      });
      return;
    }

    // Check if already in cart
    const isInCart = userCart.some(cartBeat => cartBeat.id === beat.id);
    console.log('🛒 Is in cart:', isInCart);
    
    if (isInCart) {
      console.log('❌ Beat already in cart');
      toast({
        title: "Already in Cart",
        description: "This beat is already in your cart",
        variant: "destructive",
      });
      return;
    }

    // Use API for authenticated users
    console.log('✅ Adding beat to cart via API');
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
          price: Number(item.price) // Ensure price is a number
        };
        console.log('Creating purchase with data:', purchaseData);
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

      console.log('Creating payment with data:', paymentData);
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

      // Clear cart and refresh user data
      if (isAuthenticated) {
        await apiRequest('DELETE', '/api/cart/clear');
        // Invalidate all relevant caches to show real-time updates
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        queryClient.invalidateQueries({ queryKey: ['/api/playlist'] }); // User's purchased beats
        queryClient.invalidateQueries({ queryKey: ['/api/purchases'] }); // Purchase history
        queryClient.invalidateQueries({ queryKey: ['/api/purchases/my'] }); // User's purchases on music page
      } else {
        setCartItems([]);
      }
      
      setIsCartOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Show more specific error message if available
      let errorMessage = "There was an error processing your payment. Please try again.";
      if (error instanceof Error) {
        // Extract more specific error from the API response
        const match = error.message.match(/\d+: (.+)/);
        if (match && match[1]) {
          errorMessage = match[1];
        }
      }
      
      toast({
        title: "Checkout Failed",
        description: errorMessage,
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
            beats={beats.slice(0, 4) as Beat[]}
            userPlaylist={userPlaylist}
            onPlayBeat={(beat) => handlePlayPause(beat)}
            onAddToCart={(beat) => handleAddToCart(beat)}
          />
        )}
      </section>

      {/* Info Section */}
      {homeSettings && (
        <section className="w-full px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 
                className="text-3xl font-bold font-display mb-4"
                style={{ color: themeColors.text }}
              >
                {homeSettings.title}
              </h2>
              <p 
                className="text-lg mb-6"
                style={{ color: themeColors.textSecondary }}
              >
                {homeSettings.description}
              </p>
              <ul className="space-y-3">
                {homeSettings.feature1 && (
                  <li className="flex items-start gap-3">
                    <span style={{ color: themeColors.text }}>✓</span>
                    <span style={{ color: themeColors.text }}>{homeSettings.feature1}</span>
                  </li>
                )}
                {homeSettings.feature2 && (
                  <li className="flex items-start gap-3">
                    <span style={{ color: themeColors.text }}>✓</span>
                    <span style={{ color: themeColors.text }}>{homeSettings.feature2}</span>
                  </li>
                )}
                {homeSettings.feature3 && (
                  <li className="flex items-start gap-3">
                    <span style={{ color: themeColors.primary }}>✓</span>
                    <span style={{ color: themeColors.text }}>{homeSettings.feature3}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="relative">
              <img
                src={homeSettings.imageUrl}
                alt={homeSettings.title}
                className="rounded-lg shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </section>
      )}





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
