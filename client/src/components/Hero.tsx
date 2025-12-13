import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useThemeHero } from "@/hooks/useThemeHero";
import { Link } from "wouter";

export default function Hero() {
  const { getThemeColors, isLoading: themeLoading, theme } = useTheme();
  const themeColors = getThemeColors();
  const { getHeroImage, getHeroImageWithFallback } = useThemeHero();

  // Get app branding settings
  const { heroTitle, heroSubtitle, heroImage, heroButtonText, heroButtonLink, isLoading: brandingLoading } = useAppBranding();

  // Show loading state while theme or branding is loading
  if (themeLoading || brandingLoading) {
    return (
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="relative z-10 w-full px-6 text-center">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-700 rounded mb-6 mx-auto max-w-md"></div>
            <div className="h-6 bg-gray-700 rounded mb-8 mx-auto max-w-lg"></div>
            <div className="h-12 bg-gray-700 rounded mx-auto max-w-xs"></div>
          </div>
        </div>
      </section>
    );
  }

  // Get the final hero image - only use custom heroImage if it's actually set (not empty)
  const imageToUse = getHeroImageWithFallback(heroImage && heroImage.trim() ? heroImage : undefined);
  
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden" key={`hero-${theme}`}>
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ 
          backgroundImage: `url(${imageToUse})` 
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.6), rgba(0,0,0,0.8))`
        }}
      />
      
      <div className="relative z-10 w-full px-6 text-center backdrop-blur-sm bg-black/10 rounded-lg mx-4 py-8">
        <h1 
          className="text-5xl md:text-6xl font-bold font-display mb-6 drop-shadow-2xl" 
          data-testid="text-hero-title"
          style={{ 
            color: '#ffffff',
            textShadow: '3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)'
          }}
        >
          {heroTitle}
        </h1>
        <p 
          className="text-xl mb-8 drop-shadow-xl" 
          data-testid="text-hero-subtitle"
          style={{ 
            color: '#f8f9fa',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)'
          }}
        >
          {heroSubtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <Link href={heroButtonLink}>
            <Button 
              size="sm" 
              className="sm:size-lg text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 drop-shadow-lg shadow-xl border-0"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.text
              }}
              data-testid="button-browse-beats"
            >
              {heroButtonText}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
