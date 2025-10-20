import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Upload, Music, Image, Wand2, Loader2, Check, X, LogOut } from "lucide-react";

function AdminUploadContent() {
  const { user, logout } = useAuth();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    producer: "",
    bpm: "",
    genre: "",
    price: "",
  });

  // Generator states
  const [generatedAlbumArt, setGeneratedAlbumArt] = useState<string>("");
  const [generatedBanner, setGeneratedBanner] = useState<string>("");
  const [isGeneratingAlbumArt, setIsGeneratingAlbumArt] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [albumArtSettings, setAlbumArtSettings] = useState({
    style: "Modern",
    colorScheme: "Dark & Moody",
    complexity: 5,
    mood: "Energetic",
    title: formData.title,
    producer: formData.producer,
    genre: formData.genre
  });
  const [bannerSettings, setBannerSettings] = useState({
    bannerType: "New Release",
    colorScheme: "Dark & Moody",
    layout: "Centered",
    textStyle: "Bold",
    backgroundPattern: "Gradient",
    size: "Banner (1200x630)",
    title: formData.title,
    producer: formData.producer,
    genre: formData.genre
  });

  // Sync album art and banner settings with form data
  useEffect(() => {
    setAlbumArtSettings(prev => ({
      ...prev,
      title: formData.title,
      producer: formData.producer,
      genre: formData.genre
    }));
    setBannerSettings(prev => ({
      ...prev,
      title: formData.title,
      producer: formData.producer,
      genre: formData.genre
    }));
  }, [formData.title, formData.producer, formData.genre]);

  // Canvas refs for generation
  const albumArtCanvasRef = useRef<HTMLCanvasElement>(null);
  const bannerCanvasRef = useRef<HTMLCanvasElement>(null);

  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [albumArt, setAlbumArt] = useState<string>("");
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [useManualUpload, setUseManualUpload] = useState(false);

  // Fetch genres for dropdown
  const { data: genres = [], isLoading: genresLoading, error: genresError } = useQuery({
    queryKey: ['/api/genres'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { formData: any; audioFile: File | null; imageFile: File | null; manualImageFile: File | null }) => {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(data.formData).forEach(([key, value]) => {
        formDataToSend.append(key, value as string);
      });
      
      // Add files
      if (data.audioFile) {
        formDataToSend.append('audio', data.audioFile);
      }
      if (data.imageFile) {
        formDataToSend.append('image', data.imageFile);
      }
      if (data.manualImageFile) {
        formDataToSend.append('image', data.manualImageFile);
      }

      const response = await fetch('/api/beats', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({
        title: "Success!",
        description: "Beat uploaded successfully",
      });
      // Reset form
      setFormData({
        title: "",
        producer: "",
        bpm: "",
        genre: "",
        price: "",
      });
      setAlbumArt("");
      setAudioFile(null);
      setImageFile(null);
      setManualImageFile(null);
      setUseManualUpload(false);
      setGeneratedAlbumArt("");
      setGeneratedBanner("");
      setCurrentStep(1);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload beat",
        variant: "destructive",
      });
    },
  });

  // Album Art Generator Functions
  const generateAlbumArt = async () => {
    if (!albumArtSettings.title || !albumArtSettings.producer) {
      toast({
        title: "Error",
        description: "Please enter title and producer name",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAlbumArt(true);
    try {
      const canvas = albumArtCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      generateAlbumArtwork(ctx, albumArtSettings);
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedAlbumArt(dataUrl);
    } catch (error) {
      console.error('Error generating album art:', error);
      toast({
        title: "Error",
        description: "Failed to generate album art",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAlbumArt(false);
    }
  };

  const generateAlbumArtwork = (ctx: CanvasRenderingContext2D, settings: any) => {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    createComplexBackground(ctx, settings, width, height);
    addGenreComplexPatterns(ctx, settings, width, height);
    addStyleComplexElements(ctx, settings, width, height);
    addMoodComplexEffects(ctx, settings, width, height);
    addSophisticatedText(ctx, settings, width, height);
    addFinalTouches(ctx, settings, width, height);
  };

  const createComplexBackground = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    // Base gradient
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    switch (settings.colorScheme) {
      case "Dark & Moody":
        baseGradient.addColorStop(0, "#0f0f23");
        baseGradient.addColorStop(0.3, "#1a1a2e");
        baseGradient.addColorStop(0.7, "#16213e");
        baseGradient.addColorStop(1, "#0f3460");
        break;
      case "Bright & Vibrant":
        baseGradient.addColorStop(0, "#ff6b6b");
        baseGradient.addColorStop(0.3, "#4ecdc4");
        baseGradient.addColorStop(0.7, "#45b7d1");
        baseGradient.addColorStop(1, "#96ceb4");
        break;
      case "Neon":
        baseGradient.addColorStop(0, "#00f5ff");
        baseGradient.addColorStop(0.3, "#ff00ff");
        baseGradient.addColorStop(0.7, "#ff1493");
        baseGradient.addColorStop(1, "#00ff7f");
        break;
      case "Sunset":
        baseGradient.addColorStop(0, "#ff7e5f");
        baseGradient.addColorStop(0.3, "#feb47b");
        baseGradient.addColorStop(0.7, "#ff6b6b");
        baseGradient.addColorStop(1, "#ee5a24");
        break;
      default:
        baseGradient.addColorStop(0, "#2c3e50");
        baseGradient.addColorStop(0.5, "#34495e");
        baseGradient.addColorStop(1, "#2c3e50");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add radial gradient overlay
    const radialGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    radialGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    radialGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.05)");
    radialGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const addGenreComplexPatterns = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    const genreName = settings.genre?.toLowerCase();
    
    // Map genre names to pattern functions (case-insensitive)
    const genrePatternMap: { [key: string]: () => void } = {
      "hip-hop": () => addUrbanPatterns(ctx, width, height),
      "electronic": () => addElectronicPatterns(ctx, width, height),
      "lo-fi": () => addLofiPatterns(ctx, width, height),
      "lofi": () => addLofiPatterns(ctx, width, height),
      "trap": () => addTrapPatterns(ctx, width, height),
      "r&b": () => addRnBPatterns(ctx, width, height),
      "rnb": () => addRnBPatterns(ctx, width, height),
      "pop": () => addPopPatterns(ctx, width, height),
      "jazz": () => addJazzPatterns(ctx, width, height),
      "drill": () => addDrillPatterns(ctx, width, height),
    };
    
    // Try to find matching pattern, fallback to generic
    const patternFunction = genrePatternMap[genreName] || addGenericPatterns;
    patternFunction();
    
    ctx.restore();
  };

  const addUrbanPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Graffiti-style elements
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.quadraticCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }
  };

  const addElectronicPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Circuit-like patterns
    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * width / 20, 0);
      ctx.lineTo(i * width / 20 + 20, height);
      ctx.stroke();
    }
  };

  const addLofiPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Film grain effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const addTrapPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Aggressive geometric patterns
    ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.rect(Math.random() * width, Math.random() * height, 50, 50);
      ctx.stroke();
    }
  };

  const addRnBPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Smooth flowing curves
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * height / 5);
      ctx.bezierCurveTo(
        width / 3, (i + 1) * height / 5,
        2 * width / 3, (i - 1) * height / 5,
        width, i * height / 5
      );
      ctx.stroke();
    }
  };

  const addPopPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sparkles and stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addJazzPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Smooth flowing curves
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }
  };

  const addDrillPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sharp angular patterns
    ctx.strokeStyle = "rgba(255, 0, 100, 0.5)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
  };

  const addGenericPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Abstract organic shapes
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 30 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addStyleComplexElements = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    switch (settings.style) {
      case "Geometric": addGeometricElements(ctx, width, height); break;
      case "Abstract": addAbstractElements(ctx, width, height); break;
      case "Minimalist": addMinimalistElements(ctx, width, height); break;
      case "Vintage": addVintageElements(ctx, width, height); break;
    }
    ctx.restore();
  };

  const addGeometricElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.closePath();
      ctx.stroke();
    }
  };

  const addAbstractElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 20 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addMinimalistElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.5);
    ctx.lineTo(width * 0.9, height * 0.5);
    ctx.stroke();
  };

  const addVintageElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sepia overlay
    ctx.fillStyle = "rgba(139, 69, 19, 0.1)";
    ctx.fillRect(0, 0, width, height);
  };

  const addMoodComplexEffects = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    switch (settings.mood) {
      case "Dark": 
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, width, height);
        break;
      case "Bright": 
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, 0, width, height);
        break;
      case "Mysterious":
        const fogGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        fogGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        fogGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
        fogGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, 0, width, height);
        break;
      case "Energetic":
        ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * width, 0);
          ctx.lineTo(Math.random() * width, height);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  };

  const addSophisticatedText = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    
    // Title with shadow and glow effects
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = "white";
    ctx.font = "bold 56px Arial";
    ctx.textAlign = "center";
    ctx.fillText(settings.title, width / 2, height * 0.35);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Producer name with gradient
    const producerGradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.5);
    producerGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    producerGradient.addColorStop(1, "rgba(255, 255, 255, 0.6)");
    ctx.fillStyle = producerGradient;
    ctx.font = "36px Arial";
    ctx.fillText(settings.producer, width / 2, height * 0.45);
    
    // Genre badge
    const badgeWidth = settings.genre.length * 18 + 30;
    const badgeHeight = 35;
    const badgeX = width * 0.1;
    const badgeY = height * 0.8;
    
    const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeHeight);
    badgeGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    badgeGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    ctx.fillStyle = badgeGradient;
    ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(settings.genre, badgeX + 15, badgeY + 22);
    
    ctx.restore();
  };

  const addFinalTouches = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    // Add noise texture
    ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Add vignette
    const vignetteGradient = ctx.createRadialGradient(width/2, height/2, width/2, width/2, height/2, width/2);
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(0.8, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const approveAlbumArt = () => {
    if (generatedAlbumArt) {
      // Convert data URL to File object for upload
      const canvas = albumArtCanvasRef.current;
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `album-art-${Date.now()}.png`, { type: 'image/png' });
            setImageFile(file);
            // Set the album art to the data URL for preview, it will be uploaded as a file
            setAlbumArt(generatedAlbumArt);
            setGeneratedAlbumArt("");
            
            // Automatically generate banner using the same artwork
            generateBannerFromAlbumArt();
            
            toast({
              title: "Album Art Approved",
              description: "Album art and banner have been generated and will be uploaded",
            });
          }
        }, 'image/png');
      }
    }
  };

  const generateBannerFromAlbumArt = async () => {
    if (!albumArtSettings.title || !albumArtSettings.producer) {
      return;
    }

    try {
      const canvas = bannerCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set banner dimensions based on size setting
      const dimensions = getBannerDimensions(bannerSettings.size);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      generateBannerArtwork(ctx, bannerSettings, dimensions.width, dimensions.height);
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedBanner(dataUrl);
      
      // Auto-approve the banner
      approveBanner();
    } catch (error) {
      console.error('Error generating banner from album art:', error);
    }
  };

  // Banner Generator Functions
  const generateBanner = async () => {
    if (!bannerSettings.title || !bannerSettings.producer) {
      toast({
        title: "Error",
        description: "Please enter title and producer name",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBanner(true);
    try {
      const canvas = bannerCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dimensions = getBannerDimensions(bannerSettings.size);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      generateBannerArtwork(ctx, bannerSettings, dimensions.width, dimensions.height);
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedBanner(dataUrl);
    } catch (error) {
      console.error('Error generating banner:', error);
      toast({
        title: "Error",
        description: "Failed to generate banner",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const getBannerDimensions = (size: string) => {
    switch (size) {
      case "Social Media (1200x630)":
        return { width: 1200, height: 630 };
      case "Banner (1920x1080)":
        return { width: 1920, height: 1080 };
      case "Square (1080x1080)":
        return { width: 1080, height: 1080 };
      case "Wide (1920x600)":
        return { width: 1920, height: 600 };
      default:
        return { width: 1200, height: 630 };
    }
  };

  const generateBannerArtwork = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    createComplexBannerBackground(ctx, settings, width, height);
    addBannerGenrePatterns(ctx, settings, width, height);
    addBannerLayoutElements(ctx, settings, width, height);
    addBannerSophisticatedText(ctx, settings, width, height);
    addBannerDecorativeElements(ctx, settings, width, height);
    addBannerFinalTouches(ctx, settings, width, height);
  };

  const createComplexBannerBackground = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    switch (settings.colorScheme) {
      case "Dark & Moody":
        baseGradient.addColorStop(0, "#0f0f23");
        baseGradient.addColorStop(0.3, "#1a1a2e");
        baseGradient.addColorStop(0.7, "#16213e");
        baseGradient.addColorStop(1, "#0f3460");
        break;
      case "Bright & Vibrant":
        baseGradient.addColorStop(0, "#ff6b6b");
        baseGradient.addColorStop(0.3, "#4ecdc4");
        baseGradient.addColorStop(0.7, "#45b7d1");
        baseGradient.addColorStop(1, "#96ceb4");
        break;
      case "Neon":
        baseGradient.addColorStop(0, "#00f5ff");
        baseGradient.addColorStop(0.3, "#ff00ff");
        baseGradient.addColorStop(0.7, "#ff1493");
        baseGradient.addColorStop(1, "#00ff7f");
        break;
      case "Ocean":
        baseGradient.addColorStop(0, "#667eea");
        baseGradient.addColorStop(0.5, "#764ba2");
        baseGradient.addColorStop(1, "#f093fb");
        break;
      default:
        baseGradient.addColorStop(0, "#2c3e50");
        baseGradient.addColorStop(0.5, "#34495e");
        baseGradient.addColorStop(1, "#2c3e50");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);
    
    const radialGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    radialGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    radialGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.05)");
    radialGradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const addBannerGenrePatterns = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    const genreName = settings.genre?.toLowerCase();
    
    // Map genre names to banner pattern functions (case-insensitive)
    const bannerGenrePatternMap: { [key: string]: () => void } = {
      "hip-hop": () => addBannerUrbanPatterns(ctx, width, height),
      "electronic": () => addBannerElectronicPatterns(ctx, width, height),
      "lo-fi": () => addBannerLofiPatterns(ctx, width, height),
      "lofi": () => addBannerLofiPatterns(ctx, width, height),
      "trap": () => addBannerTrapPatterns(ctx, width, height),
      "r&b": () => addBannerRnBPatterns(ctx, width, height),
      "rnb": () => addBannerRnBPatterns(ctx, width, height),
      "pop": () => addBannerPopPatterns(ctx, width, height),
      "jazz": () => addBannerJazzPatterns(ctx, width, height),
      "drill": () => addBannerDrillPatterns(ctx, width, height),
    };
    
    // Try to find matching pattern, fallback to generic
    const patternFunction = bannerGenrePatternMap[genreName] || addBannerGenericPatterns;
    patternFunction();
    
    ctx.restore();
  };

  const addBannerUrbanPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.quadraticCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }
  };

  const addBannerElectronicPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(i * width / 30, 0);
      ctx.lineTo(i * width / 30 + 15, height);
      ctx.stroke();
    }
  };

  const addBannerLofiPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const addBannerTrapPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.rect(Math.random() * width, Math.random() * height, 80, 80);
      ctx.stroke();
    }
  };

  const addBannerRnBPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * height / 8);
      ctx.bezierCurveTo(
        width / 3, (i + 1) * height / 8,
        2 * width / 3, (i - 1) * height / 8,
        width, i * height / 8
      );
      ctx.stroke();
    }
  };

  const addBannerPopPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addBannerJazzPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Smooth flowing curves for banner
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }
  };

  const addBannerDrillPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sharp angular patterns for banner
    ctx.strokeStyle = "rgba(255, 0, 100, 0.4)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }
  };

  const addBannerGenericPatterns = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 40 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addBannerLayoutElements = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    switch (settings.layout) {
      case "Split Layout":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        break;
      case "Overlay":
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, width, height);
        break;
      case "Bold":
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(0, 0, width, height * 0.15);
        ctx.fillRect(0, height * 0.85, width, height * 0.15);
        break;
      case "Elegant":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, width - 40, height - 40);
        break;
    }
    ctx.restore();
  };

  const addBannerSophisticatedText = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    
    let titleFont = "bold 72px Arial";
    let producerFont = "36px Arial";
    let typeFont = "20px Arial";
    
    switch (settings.textStyle) {
      case "Bold":
        titleFont = "bold 80px Arial";
        producerFont = "bold 40px Arial";
        break;
      case "Elegant":
        titleFont = "italic 70px Georgia";
        producerFont = "italic 38px Georgia";
        break;
      case "Modern":
        titleFont = "56px Helvetica";
        producerFont = "32px Helvetica";
        break;
      case "Futuristic":
        titleFont = "bold 68px Arial";
        producerFont = "bold 36px Arial";
        break;
    }
    
    let titleX = width / 2;
    let titleY = height * 0.4;
    let producerX = width / 2;
    let producerY = height * 0.6;
    let typeX = width / 2;
    let typeY = height * 0.9;
    
    switch (settings.layout) {
      case "Left Aligned":
        ctx.textAlign = "left";
        titleX = width * 0.1;
        producerX = width * 0.1;
        typeX = width * 0.1;
        break;
      case "Right Aligned":
        ctx.textAlign = "right";
        titleX = width * 0.9;
        producerX = width * 0.9;
        typeX = width * 0.9;
        break;
      case "Split Layout":
        ctx.textAlign = "left";
        ctx.fillText(settings.title, width * 0.1, height * 0.5);
        ctx.textAlign = "right";
        ctx.fillText(settings.producer, width * 0.9, height * 0.5);
        ctx.textAlign = "center";
        typeX = width / 2;
        break;
      default:
        ctx.textAlign = "center";
    }
    
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = "white";
    ctx.font = titleFont;
    ctx.fillText(settings.title, titleX, titleY);
    
    ctx.shadowColor = "transparent";
    
    const producerGradient = ctx.createLinearGradient(0, producerY - 20, 0, producerY + 20);
    producerGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    producerGradient.addColorStop(1, "rgba(255, 255, 255, 0.6)");
    ctx.fillStyle = producerGradient;
    ctx.font = producerFont;
    ctx.fillText(settings.producer, producerX, producerY);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = typeFont;
    ctx.fillText(settings.bannerType.toUpperCase(), typeX, typeY);
    
    ctx.restore();
  };

  const addBannerDecorativeElements = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    
    // Corner decorations
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(60, 20);
    ctx.lineTo(20, 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 20, 20);
    ctx.lineTo(width - 60, 20);
    ctx.lineTo(width - 20, 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(60, height - 20);
    ctx.lineTo(20, height - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 20, height - 20);
    ctx.lineTo(width - 60, height - 20);
    ctx.lineTo(width - 20, height - 60);
    ctx.stroke();
    
    ctx.restore();
  };

  const addBannerFinalTouches = (ctx: CanvasRenderingContext2D, settings: any, width: number, height: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.008)";
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
    
    const vignetteGradient = ctx.createRadialGradient(width/2, height/2, Math.max(width, height)/2, width/2, height/2, Math.max(width, height)/2);
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(0.8, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
  };

  const approveBanner = () => {
    if (generatedBanner) {
      setGeneratedBanner("");
      toast({
        title: "Banner Approved",
        description: "Banner has been saved and will be displayed on relevant pages",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: "Error",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }

    if (!albumArt) {
      toast({
        title: "Error",
        description: "Please generate and approve artwork or upload custom artwork",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      formData,
      audioFile,
      imageFile: useManualUpload ? null : imageFile,
      manualImageFile: useManualUpload ? manualImageFile : null,
    });
  };

  return (
    <div 
      className="min-h-screen"
      style={{ background: themeColors.background }}
    >
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-upload-title">
                Upload New Beat
              </h1>
              <p className="text-muted-foreground">Follow the steps to upload your beat with custom artwork</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
            <div className={`w-16 h-1 ${currentStep >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              4
            </div>
          </div>
         
        </div>
      
        <div className="text-center mb-8">
          
          <h2 className="text-xl font-semibold mb-2">
            {currentStep === 1 && "Step 1: Song Details"}
            {currentStep === 2 && "Step 2: Upload Audio File"}
            {currentStep === 3 && "Step 3: Generate Artwork"}
            {currentStep === 4 && "Step 4: Review & Upload"}
          </h2>
          <p className="text-muted-foreground">
            {currentStep === 1 && "Enter the basic information about your beat"}
            {currentStep === 2 && "Upload your audio file (MP3, WAV, etc.)"}
            {currentStep === 3 && "Generate custom artwork using AI"}
            {currentStep === 4 && "Review everything and upload your beat"}
          </p>
         
        </div>
        

        {/* Step 1: Song Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Song Details</CardTitle>
              <CardDescription>
                Enter the basic information about your beat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter beat title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer">Producer *</Label>
                  <Input
                    id="producer"
                    value={formData.producer}
                    onChange={(e) => setFormData(prev => ({ ...prev, producer: e.target.value }))}
                    placeholder="Enter producer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM *</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={formData.bpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, bpm: e.target.value }))}
                    placeholder="Enter BPM"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                    disabled={genresLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={genresLoading ? "Loading genres..." : "Select genre"} />
                    </SelectTrigger>
                    <SelectContent>
                      {genresLoading ? (
                        <SelectItem value="" disabled>Loading genres...</SelectItem>
                      ) : genresError ? (
                        <SelectItem value="" disabled>Error loading genres</SelectItem>
                      ) : genres.length === 0 ? (
                        <SelectItem value="" disabled>No genres available</SelectItem>
                      ) : (
                        genres.map((genre: any) => (
                          <SelectItem key={genre.id} value={genre.name}>
                            {genre.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {genresError && (
                    <p className="text-sm text-red-500">Failed to load genres. Please refresh the page.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.title || !formData.producer || !formData.bpm || !formData.genre || !formData.price}
                >
                  Next: Upload Audio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Audio File */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio File</CardTitle>
              <CardDescription>
                Upload your beat audio file (MP3, WAV, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio">Audio File *</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: MP3, WAV, M4A, FLAC (Max 50MB)
                </p>
              </div>
              
              {audioFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span className="font-medium">{audioFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back: Song Details
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!audioFile}
                >
                  Next: Generate Artwork
                </Button>
              </div>
            </CardContent>
            
          </Card>
        )}

        {/* Step 3: Generate Artwork */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Generate Artwork</CardTitle>
              <CardDescription>
                Create custom artwork for your beat using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Artwork Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="artwork-style">Style</Label>
                  <Select
                    value={albumArtSettings.style}
                    onValueChange={(value) => setAlbumArtSettings(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Vintage">Vintage</SelectItem>
                      <SelectItem value="Minimalist">Minimalist</SelectItem>
                      <SelectItem value="Abstract">Abstract</SelectItem>
                      <SelectItem value="Geometric">Geometric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork-mood">Mood</Label>
                  <Select
                    value={albumArtSettings.mood}
                    onValueChange={(value) => setAlbumArtSettings(prev => ({ ...prev, mood: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dark">Dark</SelectItem>
                      <SelectItem value="Bright">Bright</SelectItem>
                      <SelectItem value="Mysterious">Mysterious</SelectItem>
                      <SelectItem value="Energetic">Energetic</SelectItem>
                      <SelectItem value="Calm">Calm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artwork-colors">Color Scheme</Label>
                  <Select
                    value={albumArtSettings.colorScheme}
                    onValueChange={(value) => setAlbumArtSettings(prev => ({ ...prev, colorScheme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dark & Moody">Dark & Moody</SelectItem>
                      <SelectItem value="Bright & Vibrant">Bright & Vibrant</SelectItem>
                      <SelectItem value="Neon">Neon</SelectItem>
                      <SelectItem value="Sunset">Sunset</SelectItem>
                      <SelectItem value="Ocean">Ocean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={generateAlbumArt}
                  disabled={isGeneratingAlbumArt}
                  size="lg"
                  className="px-8"
                >
                  {isGeneratingAlbumArt ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Artwork...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Generate Artwork
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Artwork Preview */}
              {generatedAlbumArt && (
                <div className="space-y-4">
                  <div className="relative w-64 h-64 mx-auto">
                    <img
                      src={generatedAlbumArt}
                      alt="Generated album art"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={approveAlbumArt} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" />
                      Use This Artwork
                    </Button>
                    <Button onClick={() => setGeneratedAlbumArt("")} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {/* Manual Upload Option */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useManualUpload"
                    checked={useManualUpload}
                    onChange={(e) => {
                      setUseManualUpload(e.target.checked);
                      if (!e.target.checked) {
                        setManualImageFile(null);
                        setAlbumArt("");
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="useManualUpload" className="text-sm font-medium">
                    Upload custom artwork instead
                  </Label>
                </div>

                {useManualUpload && (
                  <div className="space-y-2">
                    <Label htmlFor="manualImage">Custom Album Art *</Label>
                    <Input
                      id="manualImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setManualImageFile(file);
                          const previewUrl = URL.createObjectURL(file);
                          setAlbumArt(previewUrl);
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: JPG, PNG, GIF (Max 10MB, Recommended: 400x400px)
                    </p>
                  </div>
                )}
              </div>

              <canvas
                ref={albumArtCanvasRef}
                width={400}
                height={400}
                className="hidden"
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back: Upload Audio
                </Button>
                <Button 
                  onClick={() => setCurrentStep(4)}
                  disabled={!albumArt}
                >
                  Next: Review & Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Upload */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Upload</CardTitle>
              <CardDescription>
                Review your beat details and upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Beat Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Beat Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {formData.title}</div>
                    <div><span className="font-medium">Producer:</span> {formData.producer}</div>
                    <div><span className="font-medium">BPM:</span> {formData.bpm}</div>
                    <div><span className="font-medium">Genre:</span> {formData.genre}</div>
                    <div><span className="font-medium">Price:</span> ${formData.price}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Files</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>{audioFile?.name || 'No audio file'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span>
                        {albumArt ? 
                          (useManualUpload ? 'Custom artwork uploaded' : 'Custom artwork generated') : 
                          'No artwork'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Artwork Preview */}
              {albumArt && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Artwork Preview</h3>
                  <div className="relative w-48 h-48 mx-auto">
                    <img
                      src={albumArt}
                      alt="Album artwork preview"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back: Generate Artwork
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={uploadMutation.isPending || !audioFile || !albumArt || (useManualUpload && !manualImageFile)}
                  size="lg"
                  className="px-8"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Uploading Beat...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Beat
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard Link */}
        <div className="mt-8 text-center">
          <a 
            href="/admin/dashboard" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminUpload() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminUploadContent />
    </ProtectedRoute>
  );
}