import AudioPlayer from '../AudioPlayer';
import hipHopArtwork from '@assets/generated_images/Hip-hop_beat_artwork_7e295d60.png';

export default function AudioPlayerExample() {
  return (
    <AudioPlayer
      beatTitle="Midnight Vibes"
      producer="DJ Shadow"
      imageUrl={hipHopArtwork}
      duration={30}
    />
  );
}
