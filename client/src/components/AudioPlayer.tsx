import { Play, Pause, Volume2, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useRef } from "react";
import { useAudio } from "@/contexts/AudioContext";

interface AudioPlayerProps {
  beatTitle?: string;
  producer?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
  isFullSong?: boolean; // New prop to enable full song playback
  onNext?: () => void;
  onPrevious?: () => void;
  onSongEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  showPlaylistControls?: boolean;
  currentIndex?: number;
  totalSongs?: number;
}

export default function AudioPlayer({ 
  beatTitle = "No beat playing", 
  producer = "",
  imageUrl,
  audioUrl,
  duration = 30,
  isFullSong = false,
  onNext,
  onPrevious,
  onSongEnd,
  onTimeUpdate,
  showPlaylistControls = false,
  currentIndex = 0,
  totalSongs = 0
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([70]);
  const [actualDuration, setActualDuration] = useState(duration);
  const [isPreview, setIsPreview] = useState(!isFullSong); // Preview mode unless full song is requested
  const audioRef = useRef<HTMLAudioElement>(null);
  const { stopAllAudio, registerAudio, unregisterAudio } = useAudio();

  // Update preview mode when isFullSong prop changes
  useEffect(() => {
    setIsPreview(!isFullSong);
  }, [isFullSong]);

  // Handle audio URL changes - stop all other audio and reset state
  useEffect(() => {
    console.log('AudioPlayer: audioUrl changed to:', audioUrl);
    console.log('AudioPlayer: isFullSong:', isFullSong);
    console.log('AudioPlayer: isPreview:', isPreview);
    
    // Test if audio file is accessible
    if (audioUrl) {
      fetch(audioUrl, { method: 'HEAD' })
        .then(response => {
          console.log('AudioPlayer: Audio file accessibility check:', response.status, response.statusText);
          console.log('AudioPlayer: Content-Type:', response.headers.get('content-type'));
          console.log('AudioPlayer: Content-Length:', response.headers.get('content-length'));
          if (!response.ok) {
            console.error('AudioPlayer: Audio file not accessible:', response.status);
          }
        })
        .catch(error => {
          console.error('AudioPlayer: Error checking audio file accessibility:', error);
        });
    }
    
    // Stop all other audio elements
    stopAllAudio();
    
    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);

    // Set the audio source if audioUrl exists
    if (audioUrl) {
      const audio = audioRef.current;
      if (audio) {
        audio.src = audioUrl;
        audio.load(); // Force reload
        console.log('AudioPlayer: Set audio src to:', audioUrl);
        console.log('AudioPlayer: Audio element src after setting:', audio.src);
        
        // Auto-play when audio URL changes (for playlist mode)
        if (isFullSong) {
          console.log('AudioPlayer: Attempting to auto-play full song');
          
          // Simple approach - just try to play after a short delay
          const tryPlay = () => {
            console.log('AudioPlayer: Trying to play - readyState:', audio.readyState, 'duration:', audio.duration);
            if (audio.readyState >= 1) {
              audio.play().then(() => {
                console.log('AudioPlayer: Successfully started playing');
                setIsPlaying(true);
              }).catch((error) => {
                console.error('AudioPlayer: Failed to play audio:', error);
              });
            } else {
              console.log('AudioPlayer: Audio not ready, retrying in 100ms');
              setTimeout(tryPlay, 100);
            }
          };
          
          // Start trying to play
          setTimeout(tryPlay, 100);
        }
      }
    } else {
      // Clear the audio source if no audioUrl
      const audio = audioRef.current;
      if (audio) {
        audio.src = '';
        console.log('AudioPlayer: Cleared audio src');
      }
    }
  }, [audioUrl, stopAllAudio, isFullSong, isPreview]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Register this audio element
    registerAudio(audio);

    const handleLoadedMetadata = () => {
      console.log('AudioPlayer: Audio metadata loaded');
      console.log('AudioPlayer: Audio duration:', audio.duration);
      console.log('AudioPlayer: isPreview:', isPreview);
      
      // For preview mode, limit duration to 30 seconds
      const maxDuration = isPreview ? 30 : audio.duration;
      setActualDuration(maxDuration);
      
      console.log('AudioPlayer: Setting maxDuration to:', maxDuration);
      
      // Call the time update callback with initial values
      if (onTimeUpdate) {
        onTimeUpdate(0, maxDuration);
      }
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const duration = audio.duration;
      console.log('AudioPlayer: Time update - current:', current, 'duration:', duration, 'isPlaying:', isPlaying);
      setCurrentTime(current);
      
      // Call the time update callback
      if (onTimeUpdate) {
        onTimeUpdate(current, actualDuration);
      }
      
      // Stop playback at 30 seconds for preview mode
      if (isPreview && current >= 30) {
        audio.pause();
        setIsPlaying(false);
        setCurrentTime(30);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Call onSongEnd callback if provided
      if (onSongEnd) {
        onSongEnd();
      }
    };

    const handlePlay = () => {
      console.log('AudioPlayer: Audio play event fired');
      console.log('AudioPlayer: Audio element paused:', audio.paused);
      console.log('AudioPlayer: Audio element currentTime:', audio.currentTime);
      console.log('AudioPlayer: Audio element duration:', audio.duration);
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('AudioPlayer: Audio pause event fired');
      console.log('AudioPlayer: Audio element paused:', audio.paused);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      unregisterAudio(audio);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, registerAudio, unregisterAudio, isPreview, onSongEnd]);

  // Handle play/pause
  const handlePlayPause = () => {
    console.log('AudioPlayer: handlePlayPause called');
    console.log('AudioPlayer: isPlaying:', isPlaying);
    console.log('AudioPlayer: audioUrl:', audioUrl);
    console.log('AudioPlayer: isFullSong:', isFullSong);
    
    const audio = audioRef.current;
    if (!audio) {
      console.log('AudioPlayer: No audio element in handlePlayPause');
      return;
    }

    if (isPlaying) {
      console.log('AudioPlayer: Pausing audio');
      audio.pause();
    } else {
      console.log('AudioPlayer: Starting audio playback');
      console.log('AudioPlayer: Audio element readyState before play:', audio.readyState);
      console.log('AudioPlayer: Audio element src before play:', audio.src);
      
      // Stop all other audio before playing this one
      stopAllAudio();
      
      // Ensure audio is ready before playing
      if (audio.readyState >= 2) {
        audio.play().then(() => {
          console.log('AudioPlayer: Successfully started playing via handlePlayPause');
          setIsPlaying(true);
        }).catch((error) => {
          console.error('AudioPlayer: Failed to play audio in handlePlayPause:', error);
        });
      } else {
        console.log('AudioPlayer: Audio not ready, waiting for canplay event');
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.play().then(() => {
            console.log('AudioPlayer: Successfully started playing via handlePlayPause after canplay');
            setIsPlaying(true);
          }).catch((error) => {
            console.error('AudioPlayer: Failed to play audio in handlePlayPause after canplay:', error);
          });
        };
        audio.addEventListener('canplay', handleCanPlay);
      }
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Limit seek to 30 seconds for preview mode
    const seekTime = isPreview ? Math.min(value[0], 30) : value[0];
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = value[0] / 100;
    setVolume(value);
  };

  // Handle next song
  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  // Handle previous song
  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border backdrop-blur-md">
      <div className="w-full px-6 py-3">
        <div className="flex items-center gap-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={beatTitle}
              className="h-14 w-14 rounded-md object-cover"
              data-testid="img-player-artwork"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" data-testid="text-player-title">
              {beatTitle}
            </p>
            {producer && (
              <p className="text-sm text-muted-foreground truncate" data-testid="text-player-producer">
                {producer}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlayPause}
              data-testid="button-player-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs text-muted-foreground min-w-[35px]" data-testid="text-player-current-time">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={isPreview ? 30 : actualDuration}
                step={1}
                className="flex-1"
                onValueChange={handleSeek}
                data-testid="slider-player-progress"
              />
              <span className="text-xs text-muted-foreground min-w-[35px]" data-testid="text-player-duration">
                {formatTime(isPreview ? 30 : actualDuration)}
              </span>
            </div>

            {showPlaylistControls && onPrevious && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrevious}
                data-testid="button-player-previous"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
            )}
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNext}
              data-testid="button-player-skip"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-32">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={volume}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
              data-testid="slider-player-volume"
            />
          </div>

          <div className="flex items-center gap-2">
            {showPlaylistControls && totalSongs > 0 && (
              <div className="px-3 py-1 bg-secondary/10 rounded-md">
                <span className="text-xs font-medium text-secondary" data-testid="text-player-playlist-info">
                  {currentIndex + 1} / {totalSongs}
                </span>
              </div>
            )}
            
            <div className="px-3 py-1 bg-primary/10 rounded-md">
              <span className="text-xs font-medium text-primary" data-testid="text-player-watermark">
                {isPreview ? "PREVIEW" : "FULL SONG"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
    </div>
  );
}
