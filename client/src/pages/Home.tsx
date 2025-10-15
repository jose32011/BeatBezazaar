import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BeatCard, { type Beat } from "@/components/BeatCard";
import AudioPlayer from "@/components/AudioPlayer";
import Cart, { type CartItem } from "@/components/Cart";
import FilterSidebar from "@/components/FilterSidebar";
import GenreCard from "@/components/GenreCard";

// Import beat artworks
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';
import rnbArtwork from '@assets/generated_images/R&B_beat_artwork_0c1becce.png';
import trapArtwork from '@assets/generated_images/Trap_beat_artwork_7a3eb926.png';
import lofiArtwork from '@assets/generated_images/Lo-fi_beat_artwork_fd552e59.png';
import popArtwork from '@assets/generated_images/Pop_beat_artwork_27280072.png';
import drillArtwork from '@assets/generated_images/Drill_beat_artwork_bb062263.png';

// todo: remove mock functionality - sample beats data
const sampleBeats: Beat[] = [
  { id: '1', title: 'Midnight Vibes', producer: 'DJ Shadow', bpm: 140, genre: 'Hip-Hop', price: 29.99, imageUrl: hipHopArtwork },
  { id: '2', title: 'Smooth Soul', producer: 'Beat Maker', bpm: 85, genre: 'R&B', price: 34.99, imageUrl: rnbArtwork },
  { id: '3', title: 'Trap Symphony', producer: 'Producer X', bpm: 145, genre: 'Trap', price: 39.99, imageUrl: trapArtwork },
  { id: '4', title: 'Chill Waves', producer: 'Lo-Fi Beats', bpm: 70, genre: 'Lo-fi', price: 24.99, imageUrl: lofiArtwork },
  { id: '5', title: 'Pop Dreams', producer: 'Hit Factory', bpm: 120, genre: 'Pop', price: 44.99, imageUrl: popArtwork },
  { id: '6', title: 'Street Heat', producer: 'Drill Master', bpm: 150, genre: 'Drill', price: 32.99, imageUrl: drillArtwork },
  { id: '7', title: 'Urban Pulse', producer: 'City Beats', bpm: 135, genre: 'Hip-Hop', price: 27.99, imageUrl: hipHopArtwork },
  { id: '8', title: 'R&B Nights', producer: 'Groove Smith', bpm: 90, genre: 'R&B', price: 36.99, imageUrl: rnbArtwork },
];

// todo: remove mock functionality - genre data
const genres = [
  { name: 'Hip-Hop', beatCount: 156, imageUrl: hipHopArtwork },
  { name: 'Trap', beatCount: 89, imageUrl: trapArtwork },
  { name: 'R&B', beatCount: 67, imageUrl: rnbArtwork },
  { name: 'Lo-fi', beatCount: 124, imageUrl: lofiArtwork },
  { name: 'Pop', beatCount: 98, imageUrl: popArtwork },
  { name: 'Drill', beatCount: 45, imageUrl: drillArtwork },
];

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playerBeat, setPlayerBeat] = useState<Beat | null>(null);

  const handlePlayPause = (beat: Beat) => {
    if (currentlyPlaying === beat.id) {
      setCurrentlyPlaying(null);
      setPlayerBeat(null);
    } else {
      setCurrentlyPlaying(beat.id);
      setPlayerBeat(beat);
    }
  };

  const handleAddToCart = (beat: Beat) => {
    if (!cartItems.find(item => item.id === beat.id)) {
      setCartItems([...cartItems, {
        id: beat.id,
        title: beat.title,
        producer: beat.producer,
        price: beat.price,
        imageUrl: beat.imageUrl,
      }]);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    console.log('Proceeding to PayPal checkout with items:', cartItems);
    alert('Checkout functionality will be connected to PayPal in the full implementation!');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} />
      
      <Hero />

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold font-display mb-8" data-testid="text-genres-title">
          Browse by Genre
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genres.map((genre) => (
            <GenreCard
              key={genre.name}
              name={genre.name}
              beatCount={genre.beatCount}
              imageUrl={genre.imageUrl}
              onClick={() => console.log(`Clicked ${genre.name}`)}
            />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold font-display mb-8" data-testid="text-featured-title">
          Featured Beats
        </h2>
        <div className="flex gap-8">
          <div className="hidden lg:block flex-shrink-0">
            <FilterSidebar />
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleBeats.map((beat) => (
                <BeatCard
                  key={beat.id}
                  beat={beat}
                  isPlaying={currentlyPlaying === beat.id}
                  onPlayPause={() => handlePlayPause(beat)}
                  onAddToCart={() => handleAddToCart(beat)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {playerBeat && (
        <AudioPlayer
          beatTitle={playerBeat.title}
          producer={playerBeat.producer}
          imageUrl={playerBeat.imageUrl}
          duration={30}
        />
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
