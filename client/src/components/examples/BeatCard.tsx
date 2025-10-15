import BeatCard from '../BeatCard';
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';

export default function BeatCardExample() {
  const sampleBeat = {
    id: '1',
    title: 'Midnight Vibes',
    producer: 'DJ Shadow',
    bpm: 140,
    genre: 'Hip-Hop',
    price: 29.99,
    imageUrl: hipHopArtwork,
  };

  return (
    <div className="w-80">
      <BeatCard 
        beat={sampleBeat}
        onPlayPause={() => console.log('Play/pause clicked')}
        onAddToCart={() => console.log('Added to cart')}
      />
    </div>
  );
}
