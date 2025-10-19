import { createContext, useContext, useRef, ReactNode } from 'react';

interface AudioContextType {
  stopAllAudio: () => void;
  registerAudio: (audioElement: HTMLAudioElement) => void;
  unregisterAudio: (audioElement: HTMLAudioElement) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioElements = useRef<Set<HTMLAudioElement>>(new Set());

  const stopAllAudio = () => {
    audioElements.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const registerAudio = (audioElement: HTMLAudioElement) => {
    audioElements.current.add(audioElement);
  };

  const unregisterAudio = (audioElement: HTMLAudioElement) => {
    audioElements.current.delete(audioElement);
  };

  return (
    <AudioContext.Provider value={{ stopAllAudio, registerAudio, unregisterAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
