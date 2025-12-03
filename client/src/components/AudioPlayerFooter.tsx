import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

export default function AudioPlayerFooter() {
  const audioPlayer = useAudioPlayer();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const currentBeat = audioPlayer.currentBeat;

  // Hide player if no beat is loaded
  if (!currentBeat) {
    return null;
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioPlayer.setVolume(newVolume / 100);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      audioPlayer.setVolume(volume / 100);
      setIsMuted(false);
    } else {
      audioPlayer.setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg"
      style={{
        backgroundColor: `${themeColors.background}f0`,
        borderColor: `${themeColors.border}40`,
      }}
    >
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Beat Info */}
          <div className="flex items-center gap-4 min-w-[250px]">
            {currentBeat.imageUrl && (
              <img
                src={currentBeat.imageUrl}
                alt={currentBeat.title}
                className="w-14 h-14 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold truncate"
                style={{ color: themeColors.text }}
              >
                {currentBeat.title}
              </h4>
              <p
                className="text-sm truncate"
                style={{ color: themeColors.textSecondary }}
              >
                {currentBeat.producer}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => audioPlayer.previous()}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: themeColors.text }}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => audioPlayer.isPlaying(currentBeat.id) ? audioPlayer.pause() : audioPlayer.play(currentBeat.id, currentBeat.audioUrl || '')}
                className="p-3 rounded-full transition-colors"
                style={{
                  backgroundColor: themeColors.primary,
                  color: 'white',
                }}
              >
                {audioPlayer.isPlaying(currentBeat.id) ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => audioPlayer.next()}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: themeColors.text }}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl flex items-center gap-3">
              <span
                className="text-xs tabular-nums"
                style={{ color: themeColors.textSecondary }}
              >
                {formatTime(audioPlayer.currentTime)}
              </span>
              <Slider
                value={[audioPlayer.currentTime]}
                max={audioPlayer.isCurrentTrackOwned ? audioPlayer.duration : Math.min(30, audioPlayer.duration || 30)}
                step={0.1}
                onValueChange={(value) => audioPlayer.seek(value[0])}
                className="flex-1"
              />
              <span
                className="text-xs tabular-nums"
                style={{ color: themeColors.textSecondary }}
              >
                {formatTime(audioPlayer.isCurrentTrackOwned ? audioPlayer.duration : Math.min(30, audioPlayer.duration || 30))}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 min-w-[150px]">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: themeColors.text }}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
