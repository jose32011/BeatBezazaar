import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useState, useEffect } from "react";

// Custom slider component for audio player that respects theme colors
interface AudioSliderProps {
  value: number[];
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

function AudioSlider({ value, max, step, onValueChange, className = "" }: AudioSliderProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newValue = Math.max(0, Math.min(max, percent * max));
    onValueChange([newValue]);
  };

  const progress = max > 0 ? (value[0] / max) * 100 : 0;

  return (
    <div 
      className={`relative h-2 w-full cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* Track */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: themeColors.surface }}
      />
      {/* Progress */}
      <div 
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ 
          backgroundColor: themeColors.primary,
          width: `${progress}%`
        }}
      />
      {/* Thumb */}
      <div 
        className="absolute top-1/2 w-4 h-4 rounded-full border-2 transform -translate-y-1/2 -translate-x-1/2"
        style={{ 
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.primary,
          left: `${progress}%`
        }}
      />
    </div>
  );
}

export default function AudioPlayerFooter() {
  const audioPlayer = useAudioPlayer();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const currentBeat = audioPlayer.currentBeat;
  const hasNextTrack = audioPlayer.playlist.length > 0 && audioPlayer.currentIndex < audioPlayer.playlist.length - 1;
  const hasPreviousTrack = audioPlayer.playlist.length > 0 && audioPlayer.currentIndex > 0;

  // Debug logging
  useEffect(() => {
    console.log('AudioPlayerFooter render:', { currentBeat, hasCurrentBeat: !!currentBeat });
  }, [currentBeat]);

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

  // Helper function to extract HSL values from theme colors
  const extractHSLValues = (hslString: string) => {
    // Extract values from "hsl(210, 90%, 55%)" format to "210 90% 55%"
    return hslString.replace('hsl(', '').replace(')', '').replace(/,/g, '');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.border,
        boxShadow: `0 -4px 6px -1px rgba(0,0,0,0.2)`
      }}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex items-center p-3 gap-3">
          {/* Close Button on Far Left */}
          <button
            onClick={() => audioPlayer.stop()}
            className="p-1 rounded-full transition-colors flex-shrink-0"
            style={{ 
              color: themeColors.textSecondary,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Close player"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Square Album Art on Left */}
          {currentBeat.imageUrl && (
            <img
              src={currentBeat.imageUrl}
              alt={currentBeat.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}

          {/* Middle Content - Title, Producer, Progress */}
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-sm truncate mb-1"
              style={{ color: themeColors.text }}
            >
              {currentBeat.title}
            </h4>
            <p
              className="text-xs truncate mb-2"
              style={{ color: themeColors.textSecondary }}
            >
              By {currentBeat.producer}
            </p>
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs tabular-nums"
                style={{ color: themeColors.textSecondary }}
              >
                {formatTime(audioPlayer.currentTime)}
              </span>
              <AudioSlider
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

          {/* Right Side - Play/Pause Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => audioPlayer.isPlaying(currentBeat.id) ? audioPlayer.pause() : audioPlayer.play(currentBeat.id, currentBeat.audioUrl || '')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: themeColors.buttonPrimary,
                color: 'white',
              }}
            >
              {audioPlayer.isPlaying(currentBeat.id) ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
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
                  disabled={!hasPreviousTrack}
                  className="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: themeColors.text,
                  }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = themeColors.hover)}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => audioPlayer.isPlaying(currentBeat.id) ? audioPlayer.pause() : audioPlayer.play(currentBeat.id, currentBeat.audioUrl || '')}
                  className="p-3 rounded-full transition-colors"
                  style={{
                    backgroundColor: themeColors.buttonPrimary,
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
                  disabled={!hasNextTrack}
                  className="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: themeColors.text,
                  }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = themeColors.hover)}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                <AudioSlider
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
                className="p-2 rounded-full transition-colors"
                style={{ 
                  color: themeColors.text,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <AudioSlider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            {/* Close Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => audioPlayer.stop()}
                className="p-2 rounded-full transition-colors"
                style={{ 
                  color: themeColors.textSecondary,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
