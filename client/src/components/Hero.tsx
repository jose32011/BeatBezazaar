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
  const { heroTitle, heroSubtitle, heroImage, heroButtonText, heroButtonLink, heroBannerData, isLoading: brandingLoading } = useAppBranding();

  // Parse banner data if available
  let bannerData = null;
  try {
    if (heroBannerData && heroBannerData.trim()) {
      bannerData = JSON.parse(heroBannerData);
      console.log('🎨 Hero: Banner data parsed successfully:', bannerData);
    } else {
      console.log('🎨 Hero: No banner data found, using default hero');
    }
  } catch (error) {
    console.warn('🎨 Hero: Failed to parse hero banner data:', error);
  }

  // Debug logging
  console.log('🎨 Hero: Current state:', {
    heroBannerData: heroBannerData ? 'present' : 'empty',
    bannerData: bannerData ? 'parsed' : 'null',
    heroTitle,
    heroSubtitle,
    isLoading: brandingLoading
  });

  // Show loading state while theme or branding is loading
  if (themeLoading || brandingLoading) {
    return (
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        <div className="relative z-10 w-full px-6 text-center">
          <div className="animate-pulse space-y-6">
            {/* Title skeleton */}
            <div className="h-16 bg-gray-700 rounded-lg mb-6 mx-auto max-w-md"></div>
            {/* Subtitle skeleton */}
            <div className="h-6 bg-gray-700 rounded-lg mb-8 mx-auto max-w-lg"></div>
            {/* Button skeleton */}
            <div className="h-12 bg-gray-700 rounded-lg mx-auto max-w-xs"></div>
          </div>
        </div>
      </section>
    );
  }

  // Get the final hero image - only use custom heroImage if it's actually set (not empty)
  const imageToUse = getHeroImageWithFallback(heroImage && heroImage.trim() ? heroImage : undefined);

  // Helper function to get banner background style
  const getBannerBackgroundStyle = () => {
    if (!bannerData) return { backgroundImage: `url(${imageToUse})` };
    
    if (bannerData.backgroundGradient) {
      return { background: bannerData.backgroundGradient };
    } else if (bannerData.backgroundImage) {
      return { 
        backgroundImage: `url(${bannerData.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else {
      return { backgroundColor: bannerData.backgroundColor };
    }
  };
  
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden" key={`hero-${theme}`}>
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={getBannerBackgroundStyle()}
      />
      {!bannerData && (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.6), rgba(0,0,0,0.8))`
          }}
        />
      )}
      
      {bannerData ? (
        // Render custom banner elements at full hero size
        <div className="absolute inset-0 w-full h-full">
          {bannerData.elements
            .sort((a: any, b: any) => a.zIndex - b.zIndex)
            .map((element: any) => {
              // Calculate scaling factors
              const scaleX = 1; // Use full width
              const scaleY = 600 / bannerData.height; // Scale to hero height (600px)
              const avgScale = (scaleX + scaleY) / 2; // Average scale for font sizing
              
              return (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: `${(element.x / bannerData.width) * 100}%`,
                    top: `${(element.y / bannerData.height) * 100}%`,
                    width: `${(element.width / bannerData.width) * 100}%`,
                    height: `${(element.height / bannerData.height) * 100}%`,
                    fontSize: `${(element.fontSize || 16) * avgScale}px`,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    color: element.color,
                    backgroundColor: element.type === 'text' ? 'transparent' : element.backgroundColor,
                    borderRadius: `${(element.borderRadius || 0) * avgScale}px`,
                    textAlign: element.textAlign,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.textAlign === 'center' ? 'center' : 
                                   element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    padding: element.type === 'button' ? `${8 * avgScale}px ${16 * avgScale}px` : `${4 * avgScale}px`,
                    opacity: element.opacity || 1,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    overflow: 'hidden',
                    whiteSpace: element.type === 'text' ? 'nowrap' : 'normal',
                    textShadow: element.type === 'text' && element.shadow ? 
                      `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                      'none',
                    boxShadow: element.type !== 'text' && element.shadow ? 
                      `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                      'none',
                    cursor: element.type === 'button' ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (element.type === 'button') {
                      const linkToUse = element.link || heroButtonLink || '/beats';
                      // Handle both internal routes and external URLs
                      if (linkToUse.startsWith('http://') || linkToUse.startsWith('https://')) {
                        window.open(linkToUse, '_blank');
                      } else {
                        window.location.href = linkToUse;
                      }
                    }
                  }}
                >
                  {element.type === 'image' && element.content ? (
                    <img
                      src={element.content}
                      alt="Hero element"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full">
                      {element.content}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        // Render default hero content
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
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`
                }}
                data-testid="button-browse-beats"
              >
                {heroButtonText}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
