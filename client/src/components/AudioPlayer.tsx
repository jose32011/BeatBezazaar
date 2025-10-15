import { Play, Pause, Volume2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface AudioPlayerProps {
  beatTitle?: string;
  producer?: string;
  imageUrl?: string;
  duration?: number;
}

export default function AudioPlayer({ 
  beatTitle = "No beat playing", 
  producer = "",
  imageUrl,
  duration = 30 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([70]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-3">
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
              onClick={() => setIsPlaying(!isPlaying)}
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
                max={duration}
                step={1}
                className="flex-1"
                onValueChange={(value) => setCurrentTime(value[0])}
                data-testid="slider-player-progress"
              />
              <span className="text-xs text-muted-foreground min-w-[35px]" data-testid="text-player-duration">
                {formatTime(duration)}
              </span>
            </div>

            <Button
              size="icon"
              variant="ghost"
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
              onValueChange={setVolume}
              className="flex-1"
              data-testid="slider-player-volume"
            />
          </div>

          <div className="px-3 py-1 bg-primary/10 rounded-md">
            <span className="text-xs font-medium text-primary" data-testid="text-player-watermark">
              PREVIEW
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
