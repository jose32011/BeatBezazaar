import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, Image, Wand2, RefreshCw, Save, Calendar, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BannerSettings {
  title: string;
  artist: string;
  releaseDate: string;
  genre: string;
  bannerType: string;
  colorScheme: string;
  layout: string;
  textStyle: string;
  backgroundPattern: string;
  size: string;
}

const bannerTypes = [
  "New Release", "Album Launch", "Single Drop", "Mixtape", 
  "EP Release", "Compilation", "Remix", "Collaboration"
];

const layouts = [
  "Centered", "Left Aligned", "Right Aligned", "Split Layout", 
  "Overlay", "Minimal", "Bold", "Elegant"
];

const textStyles = [
  "Bold", "Elegant", "Modern", "Vintage", "Futuristic", 
  "Handwritten", "Minimal", "Decorative"
];

const backgroundPatterns = [
  "Solid", "Gradient", "Geometric", "Abstract", "Wave", 
  "Particles", "Grid", "Organic", "Tech", "Vintage"
];

const colorSchemes = [
  "Dark & Moody", "Bright & Vibrant", "Monochrome", "Pastel", 
  "Neon", "Earth Tones", "Ocean", "Sunset", "Forest", "Urban"
];

const sizes = [
  "Social Media (1080x1080)", "Banner (1200x630)", "Wide Banner (1920x1080)", 
  "Square (800x800)", "Story (1080x1920)", "Custom"
];

export default function BannerCreator() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBanner, setGeneratedBanner] = useState<string>("");
  const [settings, setSettings] = useState<BannerSettings>({
    title: "",
    artist: "",
    releaseDate: "",
    genre: "Hip-Hop",
    bannerType: "New Release",
    colorScheme: "Dark & Moody",
    layout: "Centered",
    textStyle: "Bold",
    backgroundPattern: "Gradient",
    size: "Banner (1200x630)"
  });

  const generateBanner = async () => {
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
      // Simulate API call to generate banner
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size based on selection
      const dimensions = getDimensions(settings.size);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Generate banner based on settings
      generateBannerArtwork(ctx, settings, dimensions.width, dimensions.height);
      
      const dataURL = canvas.toDataURL('image/png');
      setGeneratedBanner(dataURL);
      
      toast({
        title: "Banner Generated!",
        description: "Your music banner has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate banner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDimensions = (size: string) => {
    switch (size) {
      case "Social Media (1080x1080)":
        return { width: 1080, height: 1080 };
      case "Banner (1200x630)":
        return { width: 1200, height: 630 };
      case "Wide Banner (1920x1080)":
        return { width: 1920, height: 1080 };
      case "Square (800x800)":
        return { width: 800, height: 800 };
      case "Story (1080x1920)":
        return { width: 1080, height: 1920 };
      default:
        return { width: 1200, height: 630 };
    }
  };

  const generateBannerArtwork = (ctx: CanvasRenderingContext2D, settings: BannerSettings, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Generate background
    const bgGradient = createBackgroundGradient(ctx, settings.colorScheme, settings.backgroundPattern, width, height);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add background pattern
    addBackgroundPattern(ctx, settings, width, height);
    
    // Add layout-specific elements
    addLayoutElements(ctx, settings, width, height);
    
    // Add text based on layout
    addTextContent(ctx, settings, width, height);
    
    // Add decorative elements
    addDecorativeElements(ctx, settings, width, height);
  };

  const createBackgroundGradient = (ctx: CanvasRenderingContext2D, colorScheme: string, pattern: string, width: number, height: number) => {
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
      case "Ocean":
        gradient.addColorStop(0, "#667eea");
        gradient.addColorStop(1, "#764ba2");
        break;
      default:
        gradient.addColorStop(0, "#2c3e50");
        gradient.addColorStop(1, "#34495e");
    }
    
    return gradient;
  };

  const addBackgroundPattern = (ctx: CanvasRenderingContext2D, settings: BannerSettings, width: number, height: number) => {
    ctx.save();
    
    switch (settings.backgroundPattern) {
      case "Geometric":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.moveTo(i * width / 20, 0);
          ctx.lineTo(i * width / 20, height);
          ctx.stroke();
        }
        break;
        
      case "Wave":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = height * 0.7 + Math.sin(x * 0.01) * 50;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
        
      case "Particles":
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 5 + 1;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case "Grid":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
    }
    
    ctx.restore();
  };

  const addLayoutElements = (ctx: CanvasRenderingContext2D, settings: BannerSettings, width: number, height: number) => {
    ctx.save();
    
    switch (settings.layout) {
      case "Split Layout":
        // Add a dividing line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        break;
        
      case "Overlay":
        // Add overlay effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, width, height);
        break;
        
      case "Bold":
        // Add bold geometric shapes
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(0, 0, width, height * 0.2);
        ctx.fillRect(0, height * 0.8, width, height * 0.2);
        break;
    }
    
    ctx.restore();
  };

  const addTextContent = (ctx: CanvasRenderingContext2D, settings: BannerSettings, width: number, height: number) => {
    ctx.save();
    
    // Set text style
    switch (settings.textStyle) {
      case "Bold":
        ctx.font = "bold 72px Arial";
        break;
      case "Elegant":
        ctx.font = "italic 64px Georgia";
        break;
      case "Modern":
        ctx.font = "48px Helvetica";
        break;
      case "Futuristic":
        ctx.font = "bold 56px Arial";
        break;
      default:
        ctx.font = "bold 60px Arial";
    }
    
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    
    // Position text based on layout
    let titleY = height * 0.4;
    let artistY = height * 0.6;
    
    switch (settings.layout) {
      case "Left Aligned":
        ctx.textAlign = "left";
        titleY = height * 0.4;
        artistY = height * 0.6;
        break;
      case "Right Aligned":
        ctx.textAlign = "right";
        titleY = height * 0.4;
        artistY = height * 0.6;
        break;
      case "Split Layout":
        // Title on left, artist on right
        ctx.textAlign = "left";
        ctx.fillText(settings.title, width * 0.1, height * 0.5);
        ctx.textAlign = "right";
        ctx.fillText(settings.artist, width * 0.9, height * 0.5);
        ctx.restore();
        return;
    }
    
    // Draw title
    ctx.fillText(settings.title, width / 2, titleY);
    
    // Draw artist
    ctx.font = "36px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(settings.artist, width / 2, artistY);
    
    // Draw release date if provided
    if (settings.releaseDate) {
      ctx.font = "24px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(settings.releaseDate, width / 2, height * 0.8);
    }
    
    // Draw banner type
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(settings.bannerType.toUpperCase(), width / 2, height * 0.9);
    
    ctx.restore();
  };

  const addDecorativeElements = (ctx: CanvasRenderingContext2D, settings: BannerSettings, width: number, height: number) => {
    ctx.save();
    
    // Add genre-specific decorative elements
    switch (settings.genre) {
      case "Hip-Hop":
        // Add urban elements
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 20 + 5;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case "Electronic":
        // Add circuit patterns
        ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * width, Math.random() * height);
          ctx.lineTo(Math.random() * width, Math.random() * height);
          ctx.stroke();
        }
        break;
        
      case "Pop":
        // Add sparkles
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 8 + 2;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
    
    ctx.restore();
  };

  const downloadBanner = () => {
    if (!generatedBanner) return;
    
    const link = document.createElement('a');
    link.download = `${settings.title}-${settings.artist}-banner.png`;
    link.href = generatedBanner;
    link.click();
    
    toast({
      title: "Download Started",
      description: "Your banner is being downloaded",
    });
  };

  const saveToLibrary = () => {
    toast({
      title: "Saved to Library",
      description: "Banner has been saved to your library",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Banner Creator
          </CardTitle>
          <CardDescription>
            Create eye-catching banners for your music releases and announcements
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
                    <Label htmlFor="title">Release Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter release title"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist Name</Label>
                    <Input
                      id="artist"
                      placeholder="Enter artist name"
                      value={settings.artist}
                      onChange={(e) => setSettings({ ...settings, artist: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <Input
                      id="releaseDate"
                      type="date"
                      value={settings.releaseDate}
                      onChange={(e) => setSettings({ ...settings, releaseDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bannerType">Banner Type</Label>
                    <Select
                      value={settings.bannerType}
                      onValueChange={(value) => setSettings({ ...settings, bannerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bannerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Banner Size</Label>
                    <Select
                      value={settings.size}
                      onValueChange={(value) => setSettings({ ...settings, size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="layout">Layout Style</Label>
                    <Select
                      value={settings.layout}
                      onValueChange={(value) => setSettings({ ...settings, layout: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layouts.map((layout) => (
                          <SelectItem key={layout} value={layout}>
                            {layout}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textStyle">Text Style</Label>
                    <Select
                      value={settings.textStyle}
                      onValueChange={(value) => setSettings({ ...settings, textStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {textStyles.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <Label htmlFor="backgroundPattern">Background Pattern</Label>
                    <Select
                      value={settings.backgroundPattern}
                      onValueChange={(value) => setSettings({ ...settings, backgroundPattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundPatterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>
                            {pattern}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={generateBanner}
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
                      Generate Banner
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedBanner ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={generatedBanner}
                      alt="Generated banner"
                      className="max-w-full rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button onClick={downloadBanner} className="gap-2">
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
                  <Music className="h-12 w-12 mx-auto mb-4" />
                  <p>Generate banner to see preview</p>
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
