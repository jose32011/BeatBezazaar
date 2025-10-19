import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import heroBackground from '@assets/generated_images/Hero_background_waveform_visualization_112bcc17.png';

export default function Hero() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${themeColors.background}80, ${themeColors.background}60, ${themeColors.background})`
        }}
      />
      
      <div className="relative z-10 w-full px-6 text-center">
        <h1 
          className="text-5xl md:text-6xl font-bold font-display mb-6" 
          data-testid="text-hero-title"
          style={{ color: themeColors.text }}
        >
          Premium Instrumental Beats
          <br />
          <span style={{ color: themeColors.primary }}>For Your Next Hit</span>
        </h1>
        <p 
          className="text-xl mb-8" 
          data-testid="text-hero-subtitle"
          style={{ color: themeColors.textSecondary }}
        >
          Discover royalty-free beats from top producers. Preview 30 seconds, download instantly with secure PayPal checkout.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" data-testid="button-browse-beats">
            Browse Beats
          </Button>
          
        </div>
      </div>
    </section>
  );
}
