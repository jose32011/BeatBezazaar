import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useThemeHero } from "@/hooks/useThemeHero";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Hero() {
  const { getThemeColors, isLoading: themeLoading, theme } = useTheme();
  const themeColors = getThemeColors();
  const { getHeroImage, getHeroImageWithFallback } = useThemeHero();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Get app branding settings
  const { heroTitle, heroSubtitle, heroImage, heroButtonText, heroButtonLink, heroBannerData, isLoading: brandingLoading } = useAppBranding();

  // Handle window resize for responsive banner elements
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial size
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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
    <section className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] h-[60vh] sm:h-[70vh] md:h-[600px] flex items-center justify-center overflow-hidden" key={`hero-${theme}`}>
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
        // Render custom banner elements with responsive scaling
        <div className="absolute inset-0 w-full h-full">
          {bannerData.elements
            .sort((a: any, b: any) => {
              // On mobile, prioritize element order for better stacking
              if (windowSize.width < 640) {
                // Sort by type priority: text (titles) first, then buttons
                const typePriority = { text: 1, image: 2, button: 3 };
                const aPriority = typePriority[a.type as keyof typeof typePriority] || 4;
                const bPriority = typePriority[b.type as keyof typeof typePriority] || 4;
                
                if (aPriority !== bPriority) {
                  return aPriority - bPriority;
                }
                
                // Within same type, sort by vertical position (top to bottom)
                return a.y - b.y;
              }
              
              // Desktop: use original z-index
              return a.zIndex - b.zIndex;
            })
            .map((element: any, index: number) => {
              // Responsive scaling factors based on viewport
              const getResponsiveScale = () => {
                const viewportWidth = windowSize.width || 1024;
                if (viewportWidth < 640) return 0.6; // Mobile
                if (viewportWidth < 768) return 0.7; // Small tablet
                if (viewportWidth < 1024) return 0.85; // Tablet
                return 1; // Desktop
              };

              const responsiveScale = getResponsiveScale();
              const scaleX = 1;
              const scaleY = 600 / bannerData.height;
              const avgScale = (scaleX + scaleY) / 2 * responsiveScale;
              
              // Calculate responsive positioning with mobile layout shifts
              const getResponsivePosition = () => {
                const viewportWidth = windowSize.width || 1024;
                let leftPercent = (element.x / bannerData.width) * 100;
                let topPercent = (element.y / bannerData.height) * 100;
                
                // Mobile-specific positioning adjustments
                if (viewportWidth < 640) {
                  // Create a vertical stack layout on mobile
                  leftPercent = 5; // All elements start from left with padding
                  
                  // Stack elements vertically based on their type and index
                  if (element.type === 'text') {
                    // Check if this looks like a title (larger font or positioned higher)
                    const isTitle = (element.fontSize && element.fontSize > 30) || topPercent < 40;
                    if (isTitle) {
                      topPercent = 15; // Main title at top
                    } else {
                      topPercent = 40; // Subtitle in middle
                    }
                  } else if (element.type === 'button') {
                    topPercent = 70; // Buttons at bottom
                  } else if (element.type === 'image') {
                    // Images can stay in their relative positions but adjusted
                    topPercent = Math.max(10, Math.min(topPercent * 0.8, 60));
                  }
                  
                  // Add some spacing between multiple elements of the same type
                  const sameTypeElements = bannerData.elements.filter((el: any) => el.type === element.type);
                  if (sameTypeElements.length > 1) {
                    const elementIndex = sameTypeElements.findIndex((el: any) => el.id === element.id);
                    topPercent += elementIndex * 15; // 15% spacing between same-type elements
                  }
                  
                  return {
                    left: `${leftPercent}%`,
                    top: `${Math.max(10, Math.min(topPercent, 85))}%`
                  };
                }
                
                // Tablet adjustments (less aggressive)
                if (viewportWidth < 768) {
                  leftPercent = Math.max(5, leftPercent * 0.9);
                  topPercent = topPercent * 1.05;
                  
                  return {
                    left: `${Math.max(5, Math.min(leftPercent, 90))}%`,
                    top: `${Math.max(8, Math.min(topPercent, 88))}%`
                  };
                }
                
                return {
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`
                };
              };

              const position = getResponsivePosition();
              
              // Calculate responsive dimensions
              const getResponsiveDimensions = () => {
                const viewportWidth = windowSize.width || 1024;
                let widthPercent = (element.width / bannerData.width) * 100;
                let heightPercent = (element.height / bannerData.height) * 100;
                
                if (viewportWidth < 640) {
                  // On mobile, make text elements wider for better readability
                  if (element.type === 'text') {
                    widthPercent = Math.min(widthPercent * 1.5, 85);
                    heightPercent = Math.min(heightPercent * 1.3, 25); // Allow more height for wrapping
                  }
                  // Make buttons more mobile-friendly
                  else if (element.type === 'button') {
                    widthPercent = Math.max(widthPercent, 40); // Minimum 40% width on mobile
                    heightPercent = Math.max(heightPercent * 1.2, 8); // Taller buttons for better touch
                  }
                }
                
                return {
                  width: `${Math.min(widthPercent, 96)}%`,
                  height: `${heightPercent}%`
                };
              };

              const dimensions = getResponsiveDimensions();
              
              return (
                <div
                  key={element.id}
                  className="absolute transition-all duration-300"
                  style={{
                    ...position,
                    ...dimensions,
                    minWidth: element.type === 'button' ? '120px' : 'auto',
                    maxWidth: element.type === 'text' ? '90vw' : 'auto',
                    fontSize: `clamp(${Math.max((element.fontSize || 16) * avgScale * 0.6, 12)}px, ${(element.fontSize || 16) * avgScale}px, ${(element.fontSize || 16) * avgScale * 1.2}px)`,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    color: element.color,
                    backgroundColor: element.type === 'text' ? 'transparent' : element.backgroundColor,
                    borderRadius: `${(element.borderRadius || 0) * avgScale}px`,
                    textAlign: windowSize.width < 640 ? 'center' : element.textAlign, // Center text on mobile
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: windowSize.width < 640 ? 'center' : 
                                   element.textAlign === 'center' ? 'center' : 
                                   element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    padding: element.type === 'button' ? 
                      `${Math.max(6 * avgScale, 4)}px ${Math.max(12 * avgScale, 8)}px` : 
                      `${4 * avgScale}px`,
                    opacity: element.opacity || 1,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    overflow: 'hidden',
                    // Allow text wrapping on mobile for better readability
                    whiteSpace: element.type === 'text' && windowSize.width < 640 ? 'normal' : 'nowrap',
                    wordBreak: element.type === 'text' ? 'break-word' : 'normal',
                    lineHeight: element.type === 'text' ? '1.2' : 'normal',
                    textShadow: element.type === 'text' && element.shadow ? 
                      `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                      'none',
                    boxShadow: element.type !== 'text' && element.shadow ? 
                      `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                      'none',
                    cursor: element.type === 'button' ? 'pointer' : 'default',
                    zIndex: element.zIndex || 1
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
                      className="w-full h-full object-cover rounded-inherit"
                    />
                  ) : (
                    <span className="w-full text-center sm:text-left">
                      {element.content}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        // Render default hero content
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="backdrop-blur-sm bg-black/20 rounded-xl p-6 sm:p-8 lg:p-12">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-4 sm:mb-6 drop-shadow-2xl leading-tight" 
              data-testid="text-hero-title"
              style={{ 
                color: '#ffffff',
                textShadow: '3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)'
              }}
            >
              {heroTitle}
            </h1>
            <p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 drop-shadow-xl max-w-3xl mx-auto leading-relaxed" 
              data-testid="text-hero-subtitle"
              style={{ 
                color: '#f8f9fa',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)'
              }}
            >
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href={heroButtonLink}>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 drop-shadow-lg shadow-xl border-0 min-w-[160px] font-semibold"
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
        </div>
      )}
    </section>
  );
}
