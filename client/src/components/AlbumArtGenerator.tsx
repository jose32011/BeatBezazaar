import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Palette, Wand2, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlbumArtSettings {
  genre: string;
  title: string;
  artist: string;
  style: string;
  colorScheme: string;
  complexity: number;
  mood: string;
}

const genres = [
  "Hip-Hop", "Trap", "R&B", "Pop", "Lo-fi", "Drill", "Afrobeat", 
  "Electronic", "Jazz", "Rock", "Classical", "Reggae"
];

const styles = [
  "Minimalist", "Vintage", "Modern", "Abstract", "Geometric", 
  "Grunge", "Neon", "Retro", "Futuristic", "Artistic"
];

const colorSchemes = [
  "Dark & Moody", "Bright & Vibrant", "Monochrome", "Pastel", 
  "Neon", "Earth Tones", "Ocean", "Sunset", "Forest", "Urban"
];

const moods = [
  "Aggressive", "Melancholic", "Energetic", "Chill", "Dark", 
  "Bright", "Mysterious", "Romantic", "Nostalgic", "Futuristic"
];

export default function AlbumArtGenerator() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArt, setGeneratedArt] = useState<string>("");
  const [settings, setSettings] = useState<AlbumArtSettings>({
    genre: "Hip-Hop",
    title: "",
    artist: "",
    style: "Modern",
    colorScheme: "Dark & Moody",
    complexity: 5,
    mood: "Energetic"
  });

  const generateAlbumArt = async () => {
    if (!settings.title || !settings.artist) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and artist name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call to generate album art
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      canvas.width = 800;
      canvas.height = 800;
      
      // Generate art based on settings
      generateArtwork(ctx, settings);
      
      const dataURL = canvas.toDataURL('image/png');
      setGeneratedArt(dataURL);
      
      toast({
        title: "Artwork Generated!",
        description: "Your album art has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate album art. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateArtwork = (ctx: CanvasRenderingContext2D, settings: AlbumArtSettings) => {
    const { width, height } = ctx.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Generate background based on color scheme
    const bgGradient = createBackgroundGradient(ctx, settings.colorScheme, width, height);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add genre-specific elements
    addGenreElements(ctx, settings, width, height);
    
    // Add style-specific patterns
    addStylePatterns(ctx, settings, width, height);
    
    // Add text
    addText(ctx, settings, width, height);
    
    // Add mood-specific effects
    addMoodEffects(ctx, settings, width, height);
  };

  const createBackgroundGradient = (ctx: CanvasRenderingContext2D, colorScheme: string, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    switch (colorScheme) {
      case "Dark & Moody":
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        break;
      case "Bright & Vibrant":
        gradient.addColorStop(0, "#ff6b6b");
        gradient.addColorStop(1, "#4ecdc4");
        break;
      case "Neon":
        gradient.addColorStop(0, "#00f5ff");
        gradient.addColorStop(1, "#ff00ff");
        break;
      case "Sunset":
        gradient.addColorStop(0, "#ff7e5f");
        gradient.addColorStop(1, "#feb47b");
        break;
      default:
        gradient.addColorStop(0, "#2c3e50");
        gradient.addColorStop(1, "#34495e");
    }
    
    return gradient;
  };

  const addGenreElements = (ctx: CanvasRenderingContext2D, settings: AlbumArtSettings, width: number, height: number) => {
    ctx.save();
    
    switch (settings.genre) {
      case "Hip-Hop":
        // Add urban elements
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 30 + 10;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case "Electronic":
        // Add circuit-like patterns
        ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * width, Math.random() * height);
          ctx.lineTo(Math.random() * width, Math.random() * height);
          ctx.stroke();
        }
        break;
        
      case "Lo-fi":
        // Add vintage elements
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, 50, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "Trap":
        // Add aggressive geometric shapes
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 100 + 50;
          ctx.fillRect(x, y, size, size);
        }
        break;
    }
    
    ctx.restore();
  };

  const addStylePatterns = (ctx: CanvasRenderingContext2D, settings: AlbumArtSettings, width: number, height: number) => {
    ctx.save();
    
    switch (settings.style) {
      case "Geometric":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(i * width / 8, 0);
          ctx.lineTo(i * width / 8, height);
          ctx.stroke();
        }
        break;
        
      case "Abstract":
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * width,
            Math.random() * height,
            Math.random() * 40 + 10,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        break;
        
      case "Minimalist":
        // Just clean background, no additional patterns
        break;
    }
    
    ctx.restore();
  };

  const addText = (ctx: CanvasRenderingContext2D, settings: AlbumArtSettings, width: number, height: number) => {
    ctx.save();
    
    // Title
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(settings.title, width / 2, height * 0.3);
    
    // Artist
    ctx.font = "32px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(settings.artist, width / 2, height * 0.4);
    
    // Genre badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(width * 0.1, height * 0.8, settings.genre.length * 20 + 20, 40);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(settings.genre, width * 0.15, height * 0.83);
    
    ctx.restore();
  };

  const addMoodEffects = (ctx: CanvasRenderingContext2D, settings: AlbumArtSettings, width: number, height: number) => {
    ctx.save();
    
    switch (settings.mood) {
      case "Dark":
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, width, height);
        break;
        
      case "Bright":
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, 0, width, height);
        break;
        
      case "Mysterious":
        // Add fog effect
        const fogGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        fogGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        fogGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, 0, width, height);
        break;
    }
    
    ctx.restore();
  };

  const downloadArtwork = () => {
    if (!generatedArt) return;
    
    const link = document.createElement('a');
    link.download = `${settings.title}-${settings.artist}-album-art.png`;
    link.href = generatedArt;
    link.click();
    
    toast({
      title: "Download Started",
      description: "Your album art is being downloaded",
    });
  };

  const saveToLibrary = () => {
    // In a real app, this would save to the user's library
    toast({
      title: "Saved to Library",
      description: "Album art has been saved to your library",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Album Art Generator
          </CardTitle>
          <CardDescription>
            Create stunning album artwork for your beats using AI-powered generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Beat Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter beat title"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist/Producer</Label>
                    <Input
                      id="artist"
                      placeholder="Enter artist name"
                      value={settings.artist}
                      onChange={(e) => setSettings({ ...settings, artist: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={settings.genre}
                      onValueChange={(value) => setSettings({ ...settings, genre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Art Style</Label>
                    <Select
                      value={settings.style}
                      onValueChange={(value) => setSettings({ ...settings, style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <Select
                      value={settings.colorScheme}
                      onValueChange={(value) => setSettings({ ...settings, colorScheme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorSchemes.map((scheme) => (
                          <SelectItem key={scheme} value={scheme}>
                            {scheme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mood">Mood</Label>
                    <Select
                      value={settings.mood}
                      onValueChange={(value) => setSettings({ ...settings, mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity: {settings.complexity}</Label>
                    <Slider
                      id="complexity"
                      min={1}
                      max={10}
                      step={1}
                      value={[settings.complexity]}
                      onValueChange={(value) => setSettings({ ...settings, complexity: value[0] })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={generateAlbumArt}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Artwork
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedArt ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={generatedArt}
                      alt="Generated album art"
                      className="max-w-md w-full rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button onClick={downloadArtwork} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button onClick={saveToLibrary} variant="outline" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save to Library
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-4" />
                  <p>Generate artwork to see preview</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
