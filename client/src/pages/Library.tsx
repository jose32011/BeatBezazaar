import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BeatCard from "@/components/BeatCard";
import AudioPlayerFooter from "@/components/AudioPlayerFooter";
import { Button } from "@/components/ui/button";
import { Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Beat } from "@shared/schema";

export default function Library() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const audioPlayer = useAudioPlayer();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const beatsPerPage = 20; // Show more beats per page for full width layout

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

  // Pagination logic
  const paginatedBeats = useMemo(() => {
    const startIndex = (currentPage - 1) * beatsPerPage;
    const endIndex = startIndex + beatsPerPage;
    return playlist.slice(startIndex, endIndex);
  }, [playlist, currentPage, beatsPerPage]);

  const totalPages = Math.ceil(playlist.length / beatsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <h1
              className="text-4xl font-bold mb-8"
              style={{ color: themeColors.text }}
            >
              My Library
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
                {totalPages > 1 && (
                  <span className="ml-2">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
                {paginatedBeats.map((beat) => {
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pb-32">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            backgroundColor: currentPage === pageNum ? themeColors.primary : 'transparent',
                            borderColor: themeColors.border,
                            color: currentPage === pageNum ? '#ffffff' : themeColors.text,
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AudioPlayerFooter />
    </>
  );
}
