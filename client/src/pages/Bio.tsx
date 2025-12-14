import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Twitter, Youtube, Music, ExternalLink } from "lucide-react";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";

interface ArtistBio {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  role: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

function Bio() {
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { appName } = useAppBranding();

  // Fetch artist bios
  const { data: artistBios, isLoading, error } = useQuery<ArtistBio[]>({
    queryKey: ["artist-bios"],
    queryFn: async () => {
      const response = await fetch("/api/artist-bios");
      if (!response.ok) {
        throw new Error("Failed to fetch artist bios");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'spotify':
        return <Music className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const getSocialColor = (platform: string) => {
    // Use background color for all social buttons to match theme
    return '';
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.text
        }}
      >
        <Header />
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading artists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.text
        }}
      >
        <Header />
        <div className="text-center">
          <p className="text-red-500">Failed to load artists. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.text
      }}
    >
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ color: themeColors.primary }}
          >
            Meet Our Artists
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: themeColors.textSecondary }}
          >
            Discover the talented artists behind {appName}
          </p>
        </div>

        {/* Artists List */}
        {!artistBios || artistBios.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 mx-auto mb-4" style={{ color: themeColors.textSecondary }} />
            <h3 className="text-xl font-medium mb-2">No artists yet</h3>
            <p style={{ color: themeColors.textSecondary }}>
              Check back soon to meet our amazing artists!
            </p>
          </div>
        ) : (
          <div className="space-y-12 w-4/5 mx-auto">
            {artistBios.map((artist) => (
              <Card 
                key={artist.id}
                className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${themeColors.cardBackground} border`}
                style={{
                  borderColor: themeColors.border
                }}
              >
                <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-8 p-6">
                  {/* Artist Image */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 shadow-lg group-hover:scale-105 transition-transform duration-300"
                           style={{ borderColor: themeColors.border }}>
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const bgColor = encodeURIComponent(themeColors.background);
                              const textColor = encodeURIComponent(themeColors.text);
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='${bgColor}'/%3E%3Ctext x='80' y='90' text-anchor='middle' fill='${textColor}' font-size='60' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ 
                            backgroundColor: themeColors.background,
                            border: `1px solid ${themeColors.border}`
                          }}>
                            <Music className="h-16 w-16" style={{ color: themeColors.text }} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 flex items-center justify-center"
                           style={{ borderColor: themeColors.background }}>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Artist Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 
                      className="text-3xl font-bold mb-2"
                      style={{ color: themeColors.text }}
                    >
                      {artist.name}
                    </h3>
                    <p 
                      className="text-xl font-medium mb-4"
                      style={{ color: themeColors.text }}
                    >
                      {artist.role}
                    </p>
                    <p 
                      className="text-base leading-relaxed mb-6"
                      style={{ color: themeColors.textSecondary }}
                    >
                      {artist.bio}
                    </p>
                    
                    {/* Social Media Links */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {Object.entries(artist.socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                          <Button
                            key={platform}
                            asChild
                            size="sm"
                            className="border"
                            style={{
                              backgroundColor: themeColors.background,
                              color: themeColors.text,
                              borderColor: themeColors.border
                            }}
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2"
                            >
                              {getSocialIcon(platform)}
                              <span className="capitalize">{platform}</span>
                            </a>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bio;
