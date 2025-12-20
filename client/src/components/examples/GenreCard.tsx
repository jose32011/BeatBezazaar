import GenreCard from '../GenreCard';
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';

export default function GenreCardExample() {
  return (
    <div className="w-80">
      <GenreCard
        name="Hip-Hop"
        beatCount={156}
        imageUrl={hipHopArtwork}
        onClick={() => }
