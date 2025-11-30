import { useEffect, useRef, useState } from 'react';

interface UseAudioPlayer {
  currentlyPlaying: string | null;
  isLoading: boolean;
  error: string | null;
  play: (beatId: string, audioUrl: string) => void;
  pause: () => void;
  isPlaying: (beatId: string) => boolean;
  hasError: (beatId: string) => boolean;
}

export function useAudioPlayer(): UseAudioPlayer {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorBeatId, setErrorBeatId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element on mount
  useEffect(() => {
    audioRef.current = new Audio();

    // Handle audio ended event
    const handleEnded = () => {
      setCurrentlyPlaying(null);
      setIsLoading(false);
    };

    // Handle audio error event
    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
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

    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('loadstart', handleLoadStart);

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('loadstart', handleLoadStart);
        audioRef.current = null;
      }
    };
  }, []);

  const play = (beatId: string, audioUrl: string) => {
    if (!audioRef.current) return;

    // If a different beat is playing, stop it first
    if (currentlyPlaying && currentlyPlaying !== beatId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // If the same beat is playing, do nothing (already playing)
    if (currentlyPlaying === beatId) {
      return;
    }

    // Clear any previous errors
    setError(null);
    setErrorBeatId(null);

    // Set loading state
    setIsLoading(true);

    // Set new audio source and play
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch((error) => {
      console.error('Failed to play audio:', error);
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

  const isPlaying = (beatId: string): boolean => {
    return currentlyPlaying === beatId;
  };

  const hasError = (beatId: string): boolean => {
    return errorBeatId === beatId;
  };

  return {
    currentlyPlaying,
    isLoading,
    error,
    play,
    pause,
    isPlaying,
    hasError,
  };
}
