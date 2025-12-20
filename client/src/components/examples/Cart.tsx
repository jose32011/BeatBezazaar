import Cart from '../Cart';
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';
import rnbArtwork from '@assets/generated_images/R&B_beat_artwork_0c1becce.png';

export default function CartExample() {
  const sampleItems = [
    {
      id: '1',
      title: 'Midnight Vibes',
      producer: 'DJ Shadow',
      price: 29.99,
      imageUrl: hipHopArtwork,
    },
    {
      id: '2',
      title: 'Smooth Soul',
      producer: 'Beat Maker',
      price: 34.99,
      imageUrl: rnbArtwork,
    },
  ];

  return (
    <Cart
      isOpen={true}
      onClose={() => }
