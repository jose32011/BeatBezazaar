import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import heroBackground from '@assets/generated_images/Hero_background_waveform_visualization_112bcc17.png';

export default function Hero() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Fetch app branding settings
  const { data: brandingSettings } = useQuery({
    queryKey: ['/api/app-branding-settings'],
    select: (data: any) => data || { 
      heroTitle: 'Discover Your Sound',
      heroSubtitle: 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
      heroImage: '',
      heroButtonText: 'Start Creating',
      heroButtonLink: '/beats'
    }
  });

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${brandingSettings?.heroImage || heroBackground})` 
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
          {brandingSettings?.heroTitle || 'Discover Your Sound'}
        </h1>
        <p 
          className="text-xl mb-8 drop-shadow-xl" 
          data-testid="text-hero-subtitle"
          style={{ 
            color: '#f8f9fa',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)'
          }}
        >
          {brandingSettings?.heroSubtitle || 'Premium beats for every artist. Find your perfect sound and bring your music to life.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={brandingSettings?.heroButtonLink || '/beats'}>
            <Button 
              size="lg" 
              data-testid="button-browse-beats"
              className="drop-shadow-lg shadow-xl"
            >
              {brandingSettings?.heroButtonText || 'Start Creating'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
