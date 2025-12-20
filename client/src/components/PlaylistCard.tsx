import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Music, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { Beat } from "@shared/schema";

interface PlaylistCardProps {
  beat: Beat;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  autoPlay?: boolean;
  isPlaylistMode?: boolean;
  currentTime?: number;
  duration?: number;
}

export default function PlaylistCard({ 
  beat, 
  isPlaying, 
  onPlayPause, 
  onDownload,
  autoPlay = false,
  isPlaylistMode = false,
  currentTime = 0,
  duration = 0
}: PlaylistCardProps) {
  const [localDuration, setLocalDuration] = useState<number>(0);
  const [localCurrentTime, setLocalCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Use props for time values when in playlist mode, local state otherwise
  const displayDuration = isPlaylistMode ? duration : localDuration;
  const displayCurrentTime = isPlaylistMode ? currentTime : localCurrentTime;

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setLocalDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setLocalCurrentTime(audioRef.current.currentTime);
    }
  };

  // Auto-play when the beat becomes the currently playing one
  useEffect(() => {
    if (isPlaying && autoPlay && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying, autoPlay]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0;

  return (
    <Card 
      className="group theme-card transition-all duration-300 overflow-hidden"
      style={{ 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.imageUrl}
          alt={beat.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play/Pause Overlay */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ backgroundColor: `${themeColors.background}40` }}
        >
          <Button
            size="lg"
            className="rounded-full w-16 h-16 theme-button-primary shadow-lg"
            style={{ 
              backgroundColor: themeColors.primary,
              color: '#ffffff'
            }}
            onClick={() => {
              onPlayPause();
            }}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Full Song Badge */}
        <div className="absolute top-2 right-2">
          <Badge 
            className="theme-surface"
            style={{ 
              backgroundColor: themeColors.accent,
              color: '#ffffff'
            }}
          >
            <Music className="h-3 w-3 mr-1" />
            Full Song
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Beat Info */}
        <div className="space-y-2 mb-4">
          <h3 
            className="font-semibold truncate theme-text" 
            style={{ color: themeColors.text }}
            title={beat.title}
          >
            {beat.title}
          </h3>
          <p 
            className="text-sm truncate theme-text-secondary" 
            style={{ color: themeColors.textSecondary }}
            title={beat.producer}
          >
            by {beat.producer}
          </p>
          <div 
            className="flex items-center gap-2 text-xs theme-text-secondary"
            style={{ color: themeColors.textSecondary }}
          >
            <span>{beat.genre}</span>
            <span>•</span>
            <span>{beat.bpm} BPM</span>
          </div>
        </div>

        {/* Progress Bar */}
        {isPlaying && (
          <div className="space-y-2 mb-4">
            <div 
              className="flex justify-between text-xs theme-text-secondary"
              style={{ color: themeColors.textSecondary }}
            >
              <span>{formatTime(displayCurrentTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>
            <div 
              className="w-full rounded-full h-1"
              style={{ backgroundColor: themeColors.border }}
            >
              <div
                className="h-1 rounded-full transition-all duration-100"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: themeColors.primary
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 theme-button-secondary"
            style={{ 
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              borderColor: themeColors.border
            }}
            onClick={() => {
              onPlayPause();
            }}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="theme-button-secondary"
            style={{ 
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              borderColor: themeColors.border
            }}
            onClick={onDownload}
            title="Download Full Song"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Hidden Audio Element - Only render when not in playlist mode */}
      {!isPlaylistMode && (
        <audio
          ref={audioRef}
          src={beat.audioUrl || undefined}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setCurrentTime(0);
            // You might want to trigger next song or stop playing
          }}
        />
      )}
    </Card>
  );
}
