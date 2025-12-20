import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface Beat {
  id: string;
  title: string;
  producer: string;
  imageUrl?: string;
  audioUrl?: string | null;
}

interface AudioPlayerContextType {
  currentlyPlaying: string | null;
  currentBeat: Beat | null;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  isCurrentTrackOwned: boolean;
  playlist: Beat[];
  currentIndex: number;
  play: (beatId: string, audioUrl: string, beatInfo?: Beat, isOwned?: boolean, playlist?: Beat[]) => void;
  pause: () => void;
  stop: () => void;
  isPlaying: (beatId: string) => boolean;
  hasError: (beatId: string) => boolean;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  setPlaylist: (beats: Beat[], startIndex?: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorBeatId, setErrorBeatId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playlist, setPlaylistState] = useState<Beat[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isOwnedTrackRef = useRef<boolean>(false);
  const playlistRef = useRef<Beat[]>([]);
  const currentIndexRef = useRef<number>(-1);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Initialize audio element on mount
  useEffect(() => {
    audioRef.current = new Audio();

    // Handle audio ended event
    const handleEnded = () => {
      setCurrentlyPlaying(null);
      setIsLoading(false);
      // Auto-play next track if available - use setTimeout to avoid stale closure
      setTimeout(() => {
        // Use refs to access current values
        const currentPlaylist = playlistRef.current;
        const currentIdx = currentIndexRef.current;
        
        if (currentPlaylist.length > 0 && currentIdx < currentPlaylist.length - 1) {
          const nextIndex = currentIdx + 1;
          const nextBeat = currentPlaylist[nextIndex];
          if (nextBeat && nextBeat.audioUrl && audioRef.current) {
            // Play next track
            audioRef.current.src = nextBeat.audioUrl;
            audioRef.current.play().catch(console.error);
            setCurrentlyPlaying(nextBeat.id);
            setCurrentBeat(nextBeat);
            setCurrentIndex(nextIndex);
          }
        }
      }, 500);
    };

    // Handle audio error event
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement.error?.code;
      let errorMessage = 'Audio unavailable';
      
      switch (errorCode) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio loading aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error loading audio';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio decoding error';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio format not supported';
          break;
      }
      
      setError(errorMessage);
      setCurrentlyPlaying(null);
      setIsLoading(false);
    };

    // Handle audio can play event (loading complete)
    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Handle audio loading start
    const handleLoadStart = () => {
      setIsLoading(true);
    };

    // Handle time update
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);
        
        // Stop at 30 seconds for non-owned tracks
        if (!isOwnedTrackRef.current && time >= 30) {
          audioRef.current.pause();
          setCurrentlyPlaying(null);
          setIsLoading(false);
        }
      }
    };

    // Handle duration change
    const handleDurationChange = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('loadstart', handleLoadStart);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('durationchange', handleDurationChange);

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('loadstart', handleLoadStart);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('durationchange', handleDurationChange);
        audioRef.current = null;
      }
    };
  }, []);

  const play = (beatId: string, audioUrl: string, beatInfo?: Beat, isOwned: boolean = false, newPlaylist?: Beat[]) => {
    if (!audioRef.current) return;

    // Set ownership status using ref so event handlers can access it
    isOwnedTrackRef.current = isOwned;
    // If a new playlist is provided, update it
    if (newPlaylist) {
      setPlaylistState(newPlaylist);
      const index = newPlaylist.findIndex(beat => beat.id === beatId);
      setCurrentIndex(index);
    } else if (playlist.length > 0) {
      // Update current index if playing from existing playlist
      const index = playlist.findIndex(beat => beat.id === beatId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }

    // If a different beat is playing, stop it first
    if (currentlyPlaying && currentlyPlaying !== beatId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // If the same beat is playing, resume it
    if (currentlyPlaying === beatId && audioRef.current.paused) {
      audioRef.current.play().catch((error) => {
        setError('Failed to resume audio');
      });
      return;
    }

    // Clear any previous errors
    setError(null);
    setErrorBeatId(null);

    // Set loading state
    setIsLoading(true);

    // Set beat info
    if (beatInfo) {
      setCurrentBeat(beatInfo);
    }

    // Set new audio source and play
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch((error) => {
      setError('Failed to play audio');
      setErrorBeatId(beatId);
      setCurrentlyPlaying(null);
      setIsLoading(false);
    });

    setCurrentlyPlaying(beatId);
  };

  const pause = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setCurrentlyPlaying(null);
    setIsLoading(false);
  };

  const stop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentlyPlaying(null);
    setCurrentBeat(null);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(false);
    setError(null);
    setErrorBeatId(null);
    setPlaylistState([]);
    setCurrentIndex(-1);
  };

  const isPlaying = (beatId: string): boolean => {
    return currentlyPlaying === beatId;
  };

  const hasError = (beatId: string): boolean => {
    return errorBeatId === beatId;
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolumeFunc = (volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  };

  const next = () => {
    if (playlist.length === 0) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) {
      return;
    }

    const nextBeat = playlist[nextIndex];
    if (nextBeat && nextBeat.audioUrl) {
      play(nextBeat.id, nextBeat.audioUrl, nextBeat, isOwnedTrackRef.current);
    }
  };

  const previous = () => {
    if (playlist.length === 0) {
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      return;
    }

    const prevBeat = playlist[prevIndex];
    if (prevBeat && prevBeat.audioUrl) {
      play(prevBeat.id, prevBeat.audioUrl, prevBeat, isOwnedTrackRef.current);
    }
  };

  const setPlaylist = (beats: Beat[], startIndex: number = 0) => {
    setPlaylistState(beats);
    setCurrentIndex(startIndex);
  };

  const value: AudioPlayerContextType = {
    currentlyPlaying,
    currentBeat,
    isLoading,
    error,
    currentTime,
    duration,
    isCurrentTrackOwned: isOwnedTrackRef.current,
    playlist,
    currentIndex,
    play,
    pause,
    stop,
    isPlaying,
    hasError,
    seek,
    setVolume: setVolumeFunc,
    next,
    previous,
    setPlaylist,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextType {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
