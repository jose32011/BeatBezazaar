import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import BeatCard from "@/components/BeatCard";
import AudioPlayerFooter from "@/components/AudioPlayerFooter";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Beat } from "@shared/schema";

export default function Library() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const audioPlayer = useAudioPlayer();

  // Fetch genres for genre name mapping
  const { data: genres = [] } = useQuery<any[]>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const response = await fetch("/api/genres", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch genres");
      return response.json();
    },
  });

  // Fetch user's purchased beats
  const { data: playlist = [], isLoading, error } = useQuery<Beat[]>({
    queryKey: ["/api/playlist"],
    queryFn: async () => {
      const response = await fetch("/api/playlist", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/login");
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch library");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDownload = async (beat: Beat) => {
    try {
      const response = await fetch(`/api/download/${beat.id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${beat.title} - ${beat.producer}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handlePlayPause = (beat: Beat) => {
    if (audioPlayer.isPlaying(beat.id)) {
      // Pause current beat
      audioPlayer.pause();
    } else {
      // Play beat (full song since it's owned)
      audioPlayer.play(beat.id, beat.audioUrl || '', {
        id: beat.id,
        title: beat.title,
        producer: beat.producer,
        imageUrl: beat.imageUrl,
        audioUrl: beat.audioUrl || undefined,
      }, true); // true = owned
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <>
        <Header />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="text-center">
            <p className="text-lg mb-4" style={{ color: themeColors.text }}>
              Please sign in to view your library
            </p>
            <Button onClick={() => setLocation("/login")}>Sign In</Button>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div
          className="min-h-screen py-8 px-4"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-4xl font-bold mb-8"
              style={{ color: themeColors.text }}
            >
              My Library
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{ backgroundColor: themeColors.surface }}
                >
                  <div className="aspect-square bg-gray-300" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded" />
                    <div className="h-3 bg-gray-300 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: themeColors.background }}
        >
          <div className="text-center">
            <p className="text-lg mb-4" style={{ color: themeColors.text }}>
              Failed to load library
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div
        className="min-h-screen py-8 px-4"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: themeColors.text }}
              >
                My Library
              </h1>
              <p
                className="text-lg"
                style={{ color: themeColors.textSecondary }}
              >
                {playlist.length} {playlist.length === 1 ? "beat" : "beats"} in your collection
              </p>
            </div>
          </div>

          {playlist.length === 0 ? (
            <div className="text-center py-16">
              <Music
                className="h-24 w-24 mx-auto mb-4 opacity-50"
                style={{ color: themeColors.textSecondary }}
              />
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: themeColors.text }}
              >
                Your library is empty
              </h2>
              <p
                className="text-lg mb-6"
                style={{ color: themeColors.textSecondary }}
              >
                Start building your collection by browsing our beats
              </p>
              <Button
                onClick={() => setLocation("/music")}
                style={{
                  backgroundColor: themeColors.primary,
                  color: "#ffffff",
                }}
              >
                Browse Beats
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-32">
              {playlist.map((beat) => {
                // Find the genre name from the genre ID
                const genreName = genres.find(g => g.id === beat.genre)?.name || beat.genre;
                return (
                  <div key={beat.id} className="relative group">
                    <BeatCard
                      beat={beat}
                      genreName={genreName}
                      isPlaying={audioPlayer.isPlaying(beat.id)}
                      hasAudioError={audioPlayer.hasError(beat.id)}
                      onPlayPause={() => handlePlayPause(beat)}
                      onDownload={() => handleDownload(beat)}
                      isOwned={true}
                      showDownload={true}
                      disableNavigation={true}
                      alwaysShowPlayer={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AudioPlayerFooter />
    </>
  );
}
