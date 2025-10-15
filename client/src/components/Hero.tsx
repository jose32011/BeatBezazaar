import { Button } from "@/components/ui/button";
import heroBackground from '@assets/generated_images/Hero_background_waveform_visualization_112bcc17.png';

export default function Hero() {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 text-foreground" data-testid="text-hero-title">
          Premium Instrumental Beats
          <br />
          <span className="text-primary">For Your Next Hit</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
          Discover royalty-free beats from top producers. Preview 30 seconds, download instantly with secure PayPal checkout.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" data-testid="button-browse-beats">
            Browse Beats
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="backdrop-blur-sm bg-background/20"
            data-testid="button-upload-beats"
          >
            Upload Your Beats
          </Button>
        </div>
      </div>
    </section>
  );
}
