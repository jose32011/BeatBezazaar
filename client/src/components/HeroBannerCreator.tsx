import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Save, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Move, 
  RotateCcw,
  Download,
  Upload,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Sparkles,
  Home
} from "lucide-react";

interface BannerElement {
  id: string;
  type: 'text' | 'image' | 'button';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  zIndex: number;
  opacity?: number;
  rotation?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  link?: string; // Navigation link for button elements
}

interface Banner {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  elements: BannerElement[];
  createdAt: string;
  updatedAt: string;
}

const FONT_CATEGORIES = {
  'Sans-Serif (Modern)': [
    'Arial',
    'Helvetica',
    'Helvetica Neue',
    'Verdana',
    'Trebuchet MS',
    'Tahoma',
    'Geneva',
    'Segoe UI',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Inter',
    'Source Sans Pro',
    'Nunito',
    'Raleway',
    'Ubuntu'
  ],
  'Serif (Traditional)': [
    'Times New Roman',
    'Georgia',
    'Palatino',
    'Times',
    'Book Antiqua',
    'Baskerville',
    'Garamond',
    'Minion Pro',
    'Crimson Text',
    'Playfair Display',
    'Merriweather',
    'Lora',
    'PT Serif'
  ],
  'Monospace (Code)': [
    'Courier New',
    'Monaco',
    'Consolas',
    'Menlo',
    'Source Code Pro',
    'Fira Code',
    'JetBrains Mono'
  ],
  'Display (Headlines)': [
    'Impact',
    'Arial Black',
    'Bebas Neue',
    'Oswald',
    'Fjalla One',
    'Anton',
    'Righteous',
    'Bangers',
    'Fredoka One'
  ],
  'Script (Decorative)': [
    'Pacifico',
    'Dancing Script',
    'Lobster',
    'Brush Script MT',
    'Comic Sans MS'
  ],
  'Rounded (Friendly)': [
    'Comfortaa',
    'Quicksand',
    'Nunito',
    'Varela Round'
  ],
  'System': [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont'
  ]
};

// Flatten all fonts for backward compatibility
const FONT_FAMILIES = Object.values(FONT_CATEGORIES).flat();

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB'
];

const GRADIENT_PRESETS = [
  'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

export default function HeroBannerCreator() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartElementPos, setResizeStartElementPos] = useState({ x: 0, y: 0 });
  const [showSavedBanners, setShowSavedBanners] = useState(true);
  const [bannerName, setBannerName] = useState('');
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'image'>('solid');
  const [gradientDirection, setGradientDirection] = useState('45deg');
  const [gradientColor1, setGradientColor1] = useState('#667eea');
  const [gradientColor2, setGradientColor2] = useState('#764ba2');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, percentage: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const elementImageInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Mutation for updating app branding settings
  const updateAppBrandingMutation = useMutation({
    mutationFn: async (brandingData: any) => {
      const response = await fetch('/api/admin/app-branding-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(brandingData)
      });
      if (!response.ok) {
        throw new Error(`Failed to update app branding: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('🎨 BannerCreator: Banner applied successfully, response:', data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/app-branding-settings'] });
      
      // Force refetch to ensure data is updated
      await queryClient.refetchQueries({ queryKey: ['/api/app-branding-settings'] });
      
      // Refresh the default banner to reflect the changes
      const updatedDefaultBanner = await createDefaultBanner();
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner.id === 'default-banner' ? cleanupBannerElements(updatedDefaultBanner) : banner
        )
      );
      
      // Trigger storage event to notify other components
      localStorage.setItem('app-branding-updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'app-branding-updated' }));
      
      console.log('🎨 BannerCreator: Query invalidated and refetched');
      
      toast({
        title: "Hero Banner Applied",
        description: "Your banner has been successfully applied to the home page hero section!"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Apply Banner",
        description: "There was an error applying your banner to the home page. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create default banner based on current app branding
  const createDefaultBanner = async (): Promise<Banner> => {
    let heroTitle = 'Discover Your Sound';
    let heroSubtitle = 'Premium beats for every artist. Find your perfect sound and bring your music to life.';
    let heroButtonText = 'Start Creating';
    let heroImage = '';
    let heroBannerData = '';

    try {
      const response = await fetch('/api/app-branding-settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const settings = await response.json();
        heroTitle = settings.heroTitle || heroTitle;
        heroSubtitle = settings.heroSubtitle || heroSubtitle;
        heroButtonText = settings.heroButtonText || heroButtonText;
        heroImage = settings.heroImage || heroImage;
        heroBannerData = settings.heroBannerData || '';
      }
    } catch (error) {
      console.log('Using default hero content');
    }

    // If there's existing banner data, use it
    if (heroBannerData && heroBannerData.trim()) {
      try {
        const existingBannerData = JSON.parse(heroBannerData);
        return {
          id: 'default-banner',
          name: 'Current Hero',
          width: existingBannerData.width || 1200,
          height: existingBannerData.height || 400,
          backgroundColor: existingBannerData.backgroundColor || '#000000',
          backgroundGradient: existingBannerData.backgroundGradient,
          backgroundImage: existingBannerData.backgroundImage,
          elements: existingBannerData.elements || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.warn('Failed to parse existing banner data, creating default');
      }
    }

    // Create default banner with current hero settings
    return {
      id: 'default-banner',
      name: 'Current Hero',
      width: 1200,
      height: 400,
      backgroundColor: '#000000',
      backgroundImage: heroImage || 'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      elements: [
        {
          id: 'default-title',
          type: 'text',
          content: heroTitle,
          x: 100,
          y: 120,
          width: 800,
          height: 80,
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: 'transparent',
          borderRadius: 0,
          textAlign: 'left',
          zIndex: 2,
          opacity: 1,
          rotation: 0,
          shadow: true,
          shadowColor: '#000000',
          shadowBlur: 8,
          shadowOffsetX: 3,
          shadowOffsetY: 3
        },
        {
          id: 'default-subtitle',
          type: 'text',
          content: heroSubtitle,
          x: 100,
          y: 220,
          width: 700,
          height: 60,
          fontSize: 20,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#f8f9fa',
          backgroundColor: 'transparent',
          borderRadius: 0,
          textAlign: 'left',
          zIndex: 2,
          opacity: 1,
          rotation: 0,
          shadow: true,
          shadowColor: '#000000',
          shadowBlur: 4,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        {
          id: 'default-button',
          type: 'button',
          content: heroButtonText,
          x: 100,
          y: 310,
          width: 180,
          height: 50,
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: '#ffffff',
          borderRadius: 6,
          textAlign: 'center',
          zIndex: 2,
          opacity: 1,
          rotation: 0,
          shadow: true,
          shadowColor: '#000000',
          shadowBlur: 6,
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          link: '/beats'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Function to clean up banner elements and remove duplicates
  const cleanupBannerElements = (banner: Banner): Banner => {
    const uniqueElements = banner.elements.filter((element, index, array) => {
      return !array.slice(0, index).some(prevElement => 
        prevElement.type === element.type &&
        prevElement.content === element.content &&
        Math.abs(prevElement.x - element.x) < 5 &&
        Math.abs(prevElement.y - element.y) < 5
      );
    });

    const sortedElements = uniqueElements.map((element, index) => ({
      ...element,
      zIndex: index + 1
    }));

    return {
      ...banner,
      elements: sortedElements
    };
  };

  // Load saved banners on component mount
  React.useEffect(() => {
    const loadBanners = async () => {
      const savedBanners = localStorage.getItem('heroBanners');
      let loadedBanners: Banner[] = [];
      
      if (savedBanners) {
        try {
          const parsedBanners = JSON.parse(savedBanners);
          loadedBanners = parsedBanners.map(cleanupBannerElements);
        } catch (error) {
          console.error('Error loading saved banners:', error);
        }
      }

      const defaultBanner = await createDefaultBanner();
      const hasDefaultBanner = loadedBanners.some(banner => banner.id === 'default-banner');
      
      if (!hasDefaultBanner) {
        loadedBanners.unshift(defaultBanner);
      } else {
        // Always update the default banner to match current hero settings
        const defaultIndex = loadedBanners.findIndex(banner => banner.id === 'default-banner');
        loadedBanners[defaultIndex] = cleanupBannerElements(defaultBanner);
      }

      setBanners(loadedBanners);
    };

    loadBanners();
  }, []);

  // Refresh default banner when app branding changes
  React.useEffect(() => {
    const refreshDefaultBanner = async () => {
      const defaultBanner = await createDefaultBanner();
      setBanners(prevBanners => 
        prevBanners.map(banner => 
          banner.id === 'default-banner' ? cleanupBannerElements(defaultBanner) : banner
        )
      );
    };

    // Listen for app branding changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-branding-updated') {
        refreshDefaultBanner();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Storage monitoring and automatic cleanup scheduler
  React.useEffect(() => {
    const updateStorageUsage = () => {
      const used = getLocalStorageUsage();
      const quota = getEstimatedQuota();
      const percentage = (used / quota) * 100;
      setStorageUsage({ used, percentage });
    };

    // Update storage usage immediately
    updateStorageUsage();

    // Set up periodic monitoring
    const monitoringInterval = setInterval(updateStorageUsage, 30000); // Every 30 seconds

    // Set up automatic cleanup scheduler
    const cleanupInterval = setInterval(() => {
      const currentUsage = getLocalStorageUsage();
      const quota = getEstimatedQuota();
      const percentage = (currentUsage / quota) * 100;

      // Automatic cleanup when usage exceeds 75%
      if (percentage > 75) {
        console.log('Automatic storage cleanup triggered at', percentage.toFixed(1), '% usage');
        
        // Clean up temporary and cache items
        const keysToClean = [];
        for (let key in localStorage) {
          if (key.startsWith('temp_') || 
              key.startsWith('cache_') || 
              key.includes('_backup_') ||
              key.includes('_old_') ||
              key.includes('_draft_')) {
            keysToClean.push(key);
          }
        }
        
        keysToClean.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log('Cleaned up localStorage key:', key);
          } catch (e) {
            console.warn('Failed to clean up key:', key, e);
          }
        });

        // If still high usage, trigger banner optimization
        const newUsage = getLocalStorageUsage();
        const newPercentage = (newUsage / quota) * 100;
        if (newPercentage > 70) {
          // Force re-save with optimization
          setBanners(prevBanners => [...prevBanners]);
        }
      }
    }, 60000); // Every minute

    return () => {
      clearInterval(monitoringInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Comprehensive localStorage housekeeping utilities
  const getLocalStorageUsage = () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  };

  const getEstimatedQuota = () => {
    // Most browsers have 5-10MB localStorage quota
    // We'll be conservative and assume 5MB
    return 5 * 1024 * 1024;
  };

  const performHousekeeping = (bannersToSave: Banner[]) => {
    const currentUsage = getLocalStorageUsage();
    const estimatedQuota = getEstimatedQuota();
    const usagePercentage = (currentUsage / estimatedQuota) * 100;

    console.log(`LocalStorage usage: ${(currentUsage / 1024).toFixed(1)}KB (${usagePercentage.toFixed(1)}%)`);

    // Aggressive housekeeping based on usage levels
    let optimizedBanners = [...bannersToSave];

    // Level 1: Basic optimization (>60% usage)
    if (usagePercentage > 60) {
      optimizedBanners = optimizedBanners.map(banner => ({
        ...banner,
        elements: banner.elements.map(element => {
          if (element.type === 'image' && element.content.startsWith('data:image/')) {
            // Compress images more aggressively
            const maxSize = usagePercentage > 80 ? 50000 : 75000;
            return {
              ...element,
              content: element.content.length > maxSize ? 
                element.content.substring(0, maxSize) + '...[compressed]' : 
                element.content
            };
          }
          return element;
        })
      }));
    }

    // Level 2: Limit banner count (>70% usage)
    if (usagePercentage > 70) {
      const maxBanners = usagePercentage > 85 ? 3 : 5;
      // Always keep default banner and current banner, then most recent ones
      const defaultBanner = optimizedBanners.find(b => b.id === 'default-banner');
      const currentBannerObj = optimizedBanners.find(b => b.id === currentBanner?.id);
      const otherBanners = optimizedBanners
        .filter(b => b.id !== 'default-banner' && b.id !== currentBanner?.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, maxBanners - (defaultBanner ? 1 : 0) - (currentBannerObj ? 1 : 0));

      optimizedBanners = [
        ...(defaultBanner ? [defaultBanner] : []),
        ...(currentBannerObj ? [currentBannerObj] : []),
        ...otherBanners
      ];
    }

    // Level 3: Emergency cleanup (>80% usage)
    if (usagePercentage > 80) {
      // Clean up other localStorage items that might be taking space
      const keysToClean = [];
      for (let key in localStorage) {
        if (key.startsWith('temp_') || 
            key.startsWith('cache_') || 
            key.includes('old_') ||
            key.includes('backup_')) {
          keysToClean.push(key);
        }
      }
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });

      // Further reduce banner data
      optimizedBanners = optimizedBanners.map(banner => ({
        ...banner,
        elements: banner.elements.map(element => {
          // Remove non-essential properties
          const essential: any = {
            id: element.id,
            type: element.type,
            content: element.type === 'image' && element.content.startsWith('data:image/') ?
              element.content.substring(0, 30000) + '...[emergency-compressed]' :
              element.content,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            zIndex: element.zIndex
          };

          // Only keep essential styling for text/button elements
          if (element.type !== 'image') {
            essential.fontSize = element.fontSize;
            essential.color = element.color;
            essential.backgroundColor = element.backgroundColor;
          }

          return essential;
        })
      }));
    }

    return optimizedBanners;
  };

  // Save banners to localStorage with comprehensive housekeeping
  React.useEffect(() => {
    try {
      // Perform proactive housekeeping
      const housekeepedBanners = performHousekeeping(banners);
      const dataToSave = JSON.stringify(housekeepedBanners);
      
      // Final size check before saving
      const currentUsage = getLocalStorageUsage();
      const estimatedQuota = getEstimatedQuota();
      const dataSize = dataToSave.length;
      const projectedUsage = currentUsage + dataSize;
      const projectedPercentage = (projectedUsage / estimatedQuota) * 100;

      if (projectedPercentage > 90) {
        // Emergency mode: save only absolute essentials
        const emergencyBanners = housekeepedBanners
          .filter(banner => banner.id === 'default-banner' || banner.id === currentBanner?.id)
          .slice(0, 2)
          .map(banner => ({
            id: banner.id,
            name: banner.name,
            width: banner.width,
            height: banner.height,
            backgroundColor: banner.backgroundColor,
            elements: banner.elements.slice(0, 3).map(element => ({
              id: element.id,
              type: element.type,
              content: element.type === 'image' ? '[image-removed]' : element.content,
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex
            })),
            createdAt: banner.createdAt,
            updatedAt: banner.updatedAt
          }));

        localStorage.setItem('heroBanners', JSON.stringify(emergencyBanners));
        
        toast({
          title: "Emergency Storage Cleanup",
          description: "Storage critically full. Saved only essential data. Please export your work immediately.",
          variant: "destructive"
        });
      } else {
        localStorage.setItem('heroBanners', dataToSave);
        
        // Notify user of housekeeping actions
        if (housekeepedBanners.length < banners.length) {
          toast({
            title: "Storage Optimized",
            description: `Kept ${housekeepedBanners.length} most recent banners to maintain performance.`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Failed to save banners to localStorage:', error);
      
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Final fallback: save only current banner metadata
        try {
          const fallbackData = currentBanner ? [{
            id: currentBanner.id,
            name: currentBanner.name,
            width: currentBanner.width,
            height: currentBanner.height,
            backgroundColor: currentBanner.backgroundColor,
            elements: [], // Remove all elements in emergency
            createdAt: currentBanner.createdAt,
            updatedAt: currentBanner.updatedAt
          }] : [];
          
          localStorage.setItem('heroBanners', JSON.stringify(fallbackData));
          
          toast({
            title: "Critical Storage Error",
            description: "Storage completely full. Saved only banner structure. Export your work now!",
            variant: "destructive"
          });
        } catch (finalError) {
          console.error('Complete localStorage failure:', finalError);
          toast({
            title: "Storage Failure",
            description: "Cannot save to browser storage. Please export your work immediately.",
            variant: "destructive"
          });
        }
      }
    }
  }, [banners, currentBanner?.id, toast]); 
 const createNewBanner = () => {
    const newBanner: Banner = {
      id: Date.now().toString(),
      name: 'Untitled Banner',
      width: 1200,
      height: 400,
      backgroundColor: '#ffffff',
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentBanner(newBanner);
    setSelectedElement(null);
    setBannerName(newBanner.name);
    setShowSavedBanners(false);
  };

  const addElement = (type: 'text' | 'image' | 'button') => {
    let bannerToUse = currentBanner;
    if (!bannerToUse) {
      bannerToUse = {
        id: Date.now().toString(),
        name: 'Untitled Banner',
        width: 1200,
        height: 400,
        backgroundColor: '#ffffff',
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentBanner(bannerToUse);
      setBannerName(bannerToUse.name);
      setShowSavedBanners(false);
    }

    const newElement: BannerElement = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'text' ? 'Click to edit text' : type === 'button' ? 'Button Text' : '',
      x: 50,
      y: 50,
      width: type === 'text' ? 300 : type === 'button' ? 150 : 100,
      height: type === 'text' ? 50 : type === 'button' ? 40 : 100,
      fontSize: type === 'text' ? 24 : type === 'button' ? 14 : undefined,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: type === 'button' ? '#007bff' : 'transparent',
      borderRadius: type === 'button' ? 5 : 0,
      textAlign: 'left',
      zIndex: bannerToUse.elements.length + 1,
      opacity: 1,
      rotation: 0,
      shadow: false,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      link: type === 'button' ? '/beats' : undefined // Default link for buttons
    };

    setCurrentBanner({
      ...bannerToUse,
      elements: [...bannerToUse.elements, newElement],
      updatedAt: new Date().toISOString()
    });
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<BannerElement>) => {
    if (!currentBanner) return;

    setCurrentBanner({
      ...currentBanner,
      elements: currentBanner.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      ),
      updatedAt: new Date().toISOString()
    });
  };

  const deleteElement = (elementId: string) => {
    if (!currentBanner) return;

    setCurrentBanner({
      ...currentBanner,
      elements: currentBanner.elements.filter(el => el.id !== elementId),
      updatedAt: new Date().toISOString()
    });
    setSelectedElement(null);
  };

  const saveBanner = () => {
    if (!currentBanner) return;

    const bannerToSave = cleanupBannerElements({
      ...currentBanner,
      name: bannerName || currentBanner.name,
      updatedAt: new Date().toISOString()
    });

    const existingIndex = banners.findIndex(b => b.id === currentBanner.id);
    if (existingIndex >= 0) {
      setBanners(banners.map((b, i) => i === existingIndex ? bannerToSave : b));
    } else {
      setBanners([...banners, bannerToSave]);
    }

    setCurrentBanner(bannerToSave);
    toast({
      title: "Banner Saved",
      description: `Banner "${bannerToSave.name}" has been saved successfully.`
    });
  };

  const loadBanner = (banner: Banner) => {
    const bannerCopy: Banner = {
      ...banner,
      elements: banner.elements.map(element => ({
        ...element,
        id: element.id || `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: element.x || 0,
        y: element.y || 0,
        width: element.width || (element.type === 'text' ? 300 : element.type === 'button' ? 150 : 100),
        height: element.height || (element.type === 'text' ? 50 : element.type === 'button' ? 40 : 100),
        zIndex: element.zIndex || 1,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        rotation: element.rotation || 0,
        fontSize: element.fontSize || (element.type === 'text' ? 24 : element.type === 'button' ? 14 : undefined),
        fontFamily: element.fontFamily || 'Arial',
        fontWeight: element.fontWeight || 'normal',
        color: element.color || '#000000',
        backgroundColor: element.backgroundColor || (element.type === 'button' ? '#007bff' : 'transparent'),
        borderRadius: element.borderRadius || (element.type === 'button' ? 5 : 0),
        textAlign: element.textAlign || 'left',
        shadow: element.shadow || false,
        shadowColor: element.shadowColor || '#000000',
        shadowBlur: element.shadowBlur || 4,
        shadowOffsetX: element.shadowOffsetX || 2,
        shadowOffsetY: element.shadowOffsetY || 2,
        link: element.link || (element.type === 'button' ? '/beats' : undefined)
      }))
    };
    
    // Auto-detect background type based on banner properties
    if (bannerCopy.backgroundImage) {
      setBackgroundType('image');
    } else if (bannerCopy.backgroundGradient) {
      setBackgroundType('gradient');
      // Extract gradient colors if possible
      const gradientMatch = bannerCopy.backgroundGradient.match(/linear-gradient\(([^,]+),\s*([^,\s]+)[^,]*,\s*([^,\s]+)/);
      if (gradientMatch) {
        const direction = gradientMatch[1].trim();
        const color1 = gradientMatch[2].trim();
        const color2 = gradientMatch[3].trim();
        
        setGradientDirection(direction);
        setGradientColor1(color1);
        setGradientColor2(color2);
      }
    } else {
      setBackgroundType('solid');
    }
    
    setCurrentBanner(bannerCopy);
    setBannerName(bannerCopy.name);
    setSelectedElement(null);
    setShowSavedBanners(false);
  };

  const deleteBanner = (bannerId: string) => {
    if (bannerId === 'default-banner') {
      toast({
        title: "Cannot Delete Default Banner",
        description: "The default banner cannot be deleted, but you can edit it.",
        variant: "destructive"
      });
      return;
    }

    setBanners(banners.filter(b => b.id !== bannerId));
    if (currentBanner?.id === bannerId) {
      setCurrentBanner(null);
    }
    toast({
      title: "Banner Deleted",
      description: "Banner has been deleted successfully."
    });
  };

  const duplicateBanner = (banner: Banner) => {
    const duplicated: Banner = {
      ...banner,
      id: Date.now().toString(),
      name: `${banner.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setBanners([...banners, duplicated]);
    toast({
      title: "Banner Duplicated",
      description: `Banner "${duplicated.name}" has been created.`
    });
  };

  const exportBanners = () => {
    try {
      const dataToExport = {
        banners: banners.filter(banner => banner.id !== 'default-banner'), // Don't export default banner
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `hero-banners-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Banners Exported",
        description: "Your banners have been exported successfully."
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export banners. Please try again.",
        variant: "destructive"
      });
    }
  };

  const importBanners = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JSON file exported from this tool.",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        
        if (!importData.banners || !Array.isArray(importData.banners)) {
          throw new Error('Invalid file format');
        }

        // Validate and clean imported banners
        const validBanners = importData.banners.filter((banner: any) => {
          return banner.id && banner.name && banner.elements && Array.isArray(banner.elements);
        }).map((banner: any) => ({
          ...banner,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate new ID to avoid conflicts
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        if (validBanners.length === 0) {
          throw new Error('No valid banners found in file');
        }

        // Add imported banners to existing ones
        setBanners(prevBanners => [...prevBanners, ...validBanners]);
        
        toast({
          title: "Banners Imported",
          description: `Successfully imported ${validBanners.length} banner(s).`
        });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: "Import Failed",
          description: "Failed to import banners. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive"
      });
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAllBanners = () => {
    if (window.confirm('Are you sure you want to clear all saved banners? This action cannot be undone.')) {
      const defaultBanner = banners.find(b => b.id === 'default-banner');
      setBanners(defaultBanner ? [defaultBanner] : []);
      setCurrentBanner(null);
      
      toast({
        title: "Banners Cleared",
        description: "All saved banners have been cleared."
      });
    }
  };

  // Automatic storage optimization when adding new banners
  const addBannerWithHousekeeping = (newBanner: Banner) => {
    const currentUsage = getLocalStorageUsage();
    const quota = getEstimatedQuota();
    const usagePercentage = (currentUsage / quota) * 100;

    let bannersToKeep = [...banners];

    // If storage is getting full, proactively remove old banners
    if (usagePercentage > 60) {
      const maxBanners = usagePercentage > 80 ? 3 : usagePercentage > 70 ? 5 : 8;
      
      // Always keep default banner and current banner
      const defaultBanner = bannersToKeep.find(b => b.id === 'default-banner');
      const currentBannerObj = bannersToKeep.find(b => b.id === currentBanner?.id);
      
      // Sort other banners by last updated, keep most recent
      const otherBanners = bannersToKeep
        .filter(b => b.id !== 'default-banner' && b.id !== currentBanner?.id && b.id !== newBanner.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, maxBanners - 1); // -1 for the new banner we're adding

      bannersToKeep = [
        ...(defaultBanner ? [defaultBanner] : []),
        ...(currentBannerObj && currentBannerObj.id !== newBanner.id ? [currentBannerObj] : []),
        ...otherBanners
      ];

      if (bannersToKeep.length < banners.length) {
        toast({
          title: "Storage Optimized",
          description: `Removed ${banners.length - bannersToKeep.length} older banner(s) to make room.`,
          variant: "default"
        });
      }
    }

    // Add the new banner
    setBanners([...bannersToKeep, newBanner]);
  };

  // Enhanced save function with automatic housekeeping
  const saveBannerWithHousekeeping = () => {
    if (!currentBanner) return;

    const bannerToSave = cleanupBannerElements({
      ...currentBanner,
      name: bannerName || currentBanner.name,
      updatedAt: new Date().toISOString()
    });

    const existingIndex = banners.findIndex(b => b.id === currentBanner.id);
    if (existingIndex >= 0) {
      // Update existing banner
      setBanners(banners.map((b, i) => i === existingIndex ? bannerToSave : b));
    } else {
      // Add new banner with housekeeping
      addBannerWithHousekeeping(bannerToSave);
    }

    setCurrentBanner(bannerToSave);
    toast({
      title: "Banner Saved",
      description: `Banner "${bannerToSave.name}" has been saved successfully.`
    });
  };

  // Image compression utility
  const compressImage = (imageDataUrl: string, maxSizeKB: number = 100): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions to keep image under size limit
        let { width, height } = img;
        const maxDimension = 800; // Max width or height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under size limit
        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        while (compressedDataUrl.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedDataUrl);
      };
      
      img.src = imageDataUrl;
    });
  };

  const performManualCleanup = () => {
    const beforeUsage = getLocalStorageUsage();
    const beforePercentage = (beforeUsage / getEstimatedQuota()) * 100;

    // Clean up temporary localStorage items
    const keysToClean = [];
    for (let key in localStorage) {
      if (key.startsWith('temp_') || 
          key.startsWith('cache_') || 
          key.includes('_backup_') ||
          key.includes('_old_') ||
          key.includes('_draft_') ||
          key.includes('_tmp_') ||
          key.startsWith('debug_') ||
          key.startsWith('test_')) {
        keysToClean.push(key);
      }
    }

    keysToClean.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Failed to clean up key:', key);
      }
    });

    // Optimize current banners
    const optimizedBanners = performHousekeeping(banners);
    if (optimizedBanners.length !== banners.length) {
      setBanners(optimizedBanners);
    }

    const afterUsage = getLocalStorageUsage();
    const afterPercentage = (afterUsage / getEstimatedQuota()) * 100;
    const savedBytes = beforeUsage - afterUsage;
    const savedKB = (savedBytes / 1024).toFixed(1);

    toast({
      title: "Storage Optimized",
      description: `Freed ${savedKB}KB of storage. Usage: ${beforePercentage.toFixed(1)}% → ${afterPercentage.toFixed(1)}%`,
      variant: "default"
    });
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = currentBanner?.elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement || !currentBanner || !canvasRef.current || isResizing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(currentBanner.width - 50, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(currentBanner.height - 20, e.clientY - rect.top - dragOffset.y));

    updateElement(selectedElement, { x: newX, y: newY });
  }, [isDragging, selectedElement, dragOffset, currentBanner]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartElementPos({ x: 0, y: 0 });
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const element = currentBanner?.elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      setResizeStartSize({ width: element.width, height: element.height });
      setResizeStartPos({ x: e.clientX, y: e.clientY });
      setResizeStartElementPos({ x: element.x, y: element.y });
    }
  };

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !selectedElement || !currentBanner || !resizeHandle) return;

    const element = currentBanner.elements.find(el => el.id === selectedElement);
    if (!element) return;

    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;

    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;
    let newX = resizeStartElementPos.x; // Use original position
    let newY = resizeStartElementPos.y; // Use original position

    switch (resizeHandle) {
      case 'se': // Southeast (bottom-right) - only change size, not position
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        break;
      case 'sw': // Southwest (bottom-left) - adjust width and x position
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        newX = resizeStartElementPos.x + (resizeStartSize.width - newWidth);
        break;
      case 'ne': // Northeast (top-right) - adjust height and y position
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        newY = resizeStartElementPos.y + (resizeStartSize.height - newHeight);
        break;
      case 'nw': // Northwest (top-left) - adjust both width/height and x/y position
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        newX = resizeStartElementPos.x + (resizeStartSize.width - newWidth);
        newY = resizeStartElementPos.y + (resizeStartSize.height - newHeight);
        break;
      case 'n': // North (top) - only adjust height and y position
        newHeight = Math.max(20, resizeStartSize.height - deltaY);
        newY = resizeStartElementPos.y + (resizeStartSize.height - newHeight);
        break;
      case 's': // South (bottom) - only adjust height
        newHeight = Math.max(20, resizeStartSize.height + deltaY);
        break;
      case 'e': // East (right) - only adjust width
        newWidth = Math.max(20, resizeStartSize.width + deltaX);
        break;
      case 'w': // West (left) - adjust width and x position
        newWidth = Math.max(20, resizeStartSize.width - deltaX);
        newX = resizeStartElementPos.x + (resizeStartSize.width - newWidth);
        break;
    }

    // Ensure element stays within canvas bounds
    newX = Math.max(0, Math.min(currentBanner.width - newWidth, newX));
    newY = Math.max(0, Math.min(currentBanner.height - newHeight, newY));
    newWidth = Math.min(newWidth, currentBanner.width - newX);
    newHeight = Math.min(newHeight, currentBanner.height - newY);

    updateElement(selectedElement, { 
      x: newX, 
      y: newY, 
      width: newWidth, 
      height: newHeight 
    });
  }, [isResizing, selectedElement, currentBanner, resizeHandle, resizeStartSize, resizeStartPos, resizeStartElementPos]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleMouseUp]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, GIF, etc.)",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setIsUploadingImage(true);
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const originalImageUrl = event.target?.result as string;
        
        // Check storage usage and compress accordingly
        const currentUsage = getLocalStorageUsage();
        const usagePercentage = (currentUsage / getEstimatedQuota()) * 100;
        
        let imageUrl = originalImageUrl;
        
        // Compress image based on storage usage
        if (usagePercentage > 50 || originalImageUrl.length > 200000) {
          const maxSize = usagePercentage > 75 ? 50 : usagePercentage > 60 ? 75 : 100;
          try {
            imageUrl = await compressImage(originalImageUrl, maxSize);
            console.log(`Image compressed: ${(originalImageUrl.length/1024).toFixed(1)}KB → ${(imageUrl.length/1024).toFixed(1)}KB`);
          } catch (error) {
            console.warn('Image compression failed, using original:', error);
            imageUrl = originalImageUrl;
          }
        }
        
        if (selectedElement) {
          updateElement(selectedElement, { content: imageUrl });
          toast({
            title: "Image Updated",
            description: "Element image has been updated successfully"
          });
        } else {
          let bannerToUse = currentBanner;
          if (!bannerToUse) {
            bannerToUse = {
              id: Date.now().toString(),
              name: 'Untitled Banner',
              width: 1200,
              height: 400,
              backgroundColor: '#ffffff',
              elements: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setCurrentBanner(bannerToUse);
            setBannerName(bannerToUse.name);
            setShowSavedBanners(false);
          }

          const newElement: BannerElement = {
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: imageUrl,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            zIndex: bannerToUse.elements.length + 1,
            opacity: 1,
            rotation: 0,
            shadow: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2
          };

          setCurrentBanner({
            ...bannerToUse,
            elements: [...bannerToUse.elements, newElement],
            updatedAt: new Date().toISOString()
          });
          setSelectedElement(newElement.id);
          toast({
            title: "Image Added",
            description: "New image element has been added to your banner"
          });
        }
        setIsUploadingImage(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive"
        });
        setIsUploadingImage(false);
      };
      
      reader.readAsDataURL(file);
    }
    
    e.target.value = '';
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentBanner) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, GIF, etc.)",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setCurrentBanner({
          ...currentBanner,
          backgroundImage: imageUrl,
          updatedAt: new Date().toISOString()
        });
        setBackgroundType('image');
        toast({
          title: "Background Updated",
          description: "Banner background image has been updated successfully"
        });
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the background image. Please try again.",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    }
    
    e.target.value = '';
  };

  const updateBackgroundGradient = () => {
    if (!currentBanner) return;
    
    const gradient = `linear-gradient(${gradientDirection}, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
    setCurrentBanner({
      ...currentBanner,
      backgroundGradient: gradient,
      updatedAt: new Date().toISOString()
    });
  };

  React.useEffect(() => {
    if (backgroundType === 'gradient') {
      updateBackgroundGradient();
    }
  }, [gradientDirection, gradientColor1, gradientColor2, backgroundType]);

  const getBackgroundStyle = () => {
    if (!currentBanner) return {};
    
    if (backgroundType === 'gradient' && currentBanner.backgroundGradient) {
      return { background: currentBanner.backgroundGradient };
    } else if (backgroundType === 'image' && currentBanner.backgroundImage) {
      return { 
        backgroundImage: `url(${currentBanner.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else {
      return { backgroundColor: currentBanner.backgroundColor };
    }
  };

  const getBannerBackgroundStyle = (banner: Banner) => {
    if (banner.backgroundGradient) {
      return { background: banner.backgroundGradient };
    } else if (banner.backgroundImage) {
      return { 
        backgroundImage: `url(${banner.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else {
      return { backgroundColor: banner.backgroundColor };
    }
  };

  const applyBannerToHero = async () => {
    if (!currentBanner) {
      toast({
        title: "No Banner Selected",
        description: "Please create or select a banner first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, get current app branding settings
      const response = await fetch('/api/app-branding-settings', {
        credentials: 'include'
      });
      const currentSettings = await response.json();

      // Extract text elements from banner for hero title and subtitle
      const textElements = currentBanner.elements.filter(el => el.type === 'text');
      const buttonElements = currentBanner.elements.filter(el => el.type === 'button');
      
      // Use the first text element as title, second as subtitle
      const heroTitle = textElements[0]?.content || currentSettings.heroTitle || 'Discover Your Sound';
      const heroSubtitle = textElements[1]?.content || currentSettings.heroSubtitle || 'Premium beats for every artist';
      const heroButtonText = buttonElements[0]?.content || currentSettings.heroButtonText || 'Start Creating';

      // Generate a data URL for the banner as background image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = currentBanner.width;
      canvas.height = currentBanner.height;

      // Apply background
      if (backgroundType === 'image' && currentBanner.backgroundImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentBanner.backgroundImage!;
        });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else if (backgroundType === 'gradient' && currentBanner.backgroundGradient) {
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, gradientColor1);
        gradient.addColorStop(1, gradientColor2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = currentBanner.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render elements (simplified version for background)
      for (const element of currentBanner.elements.sort((a, b) => a.zIndex - b.zIndex)) {
        ctx.save();
        
        if (element.opacity) {
          ctx.globalAlpha = element.opacity;
        }

        if (element.rotation) {
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.translate(-element.width / 2, -element.height / 2);
        } else {
          ctx.translate(element.x, element.y);
        }

        if (element.type === 'text' || element.type === 'button') {
          ctx.fillStyle = element.color || '#000000';
          ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
          
          if (element.type === 'button' && element.backgroundColor) {
            ctx.fillStyle = element.backgroundColor;
            ctx.fillRect(0, 0, element.width, element.height);
            ctx.fillStyle = element.color || '#ffffff';
          }
          
          const textAlign = element.textAlign || 'left';
          ctx.textAlign = textAlign;
          const textX = textAlign === 'center' ? element.width / 2 : textAlign === 'right' ? element.width : 0;
          ctx.fillText(element.content, textX, element.height / 2 + (element.fontSize || 16) / 3);
        } else if (element.type === 'image' && element.content) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = element.content;
            });
            ctx.drawImage(img, 0, 0, element.width, element.height);
          } catch (error) {
            console.warn('Could not load image element:', error);
          }
        }

        ctx.restore();
      }

      const heroImage = canvas.toDataURL('image/png');

      // Update app branding settings with banner data
      const bannerData = {
        width: currentBanner.width,
        height: currentBanner.height,
        backgroundColor: currentBanner.backgroundColor,
        backgroundGradient: currentBanner.backgroundGradient,
        backgroundImage: currentBanner.backgroundImage,
        elements: currentBanner.elements
      };

      const updatedSettings = {
        appName: currentSettings.appName,
        appLogo: currentSettings.appLogo,
        heroTitle,
        heroSubtitle,
        heroButtonText,
        heroImage,
        heroButtonLink: currentSettings.heroButtonLink || '/beats',
        heroBannerData: JSON.stringify(bannerData),
        loginTitle: currentSettings.loginTitle,
        loginSubtitle: currentSettings.loginSubtitle,
        loginImage: currentSettings.loginImage
      };

      console.log('🎨 BannerCreator: Applying banner to hero:', {
        bannerData,
        heroBannerData: JSON.stringify(bannerData),
        heroTitle,
        heroSubtitle,
        heroButtonText
      });

      updateAppBrandingMutation.mutate(updatedSettings);

    } catch (error) {
      console.error('Error applying banner to hero:', error);
      toast({
        title: "Error",
        description: "Failed to apply banner to hero. Please try again.",
        variant: "destructive"
      });
    }
  };

  const selectedElementData = currentBanner?.elements.find(el => el.id === selectedElement);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>
              Hero Banner Creator
            </h2>
            {/* Storage Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    storageUsage.percentage > 85 ? 'bg-red-500' :
                    storageUsage.percentage > 70 ? 'bg-yellow-500' :
                    storageUsage.percentage > 50 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
                <span style={{ color: themeColors.textSecondary }}>
                  Storage: {storageUsage.percentage.toFixed(1)}%
                </span>
              </div>
              {storageUsage.percentage > 80 && (
                <Badge variant="destructive" className="text-xs">
                  High Usage
                </Badge>
              )}
            </div>
          </div>
          <p style={{ color: themeColors.textSecondary }}>
            Create custom banners with drag-and-drop elements. Design your banner and apply it directly to your home page hero section.
          </p>
          {storageUsage.percentage > 75 && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Storage usage is high ({storageUsage.percentage.toFixed(1)}%). 
              Consider exporting older banners to free up space.
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => setShowSavedBanners(!showSavedBanners)} 
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showSavedBanners ? 'Hide' : 'Show'} Saved ({banners.length})
          </Button>
          <Button onClick={createNewBanner}>
            <Plus className="h-4 w-4 mr-2" />
            New Banner
          </Button>
          <Button onClick={exportBanners} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => importFileInputRef.current?.click()} 
            variant="outline" 
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          {storageUsage.percentage > 50 && (
            <Button onClick={performManualCleanup} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Optimize Storage
            </Button>
          )}
          {banners.length > 1 && (
            <Button onClick={clearAllBanners} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Saved Banners Section */}
      {showSavedBanners && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Banners ({banners.length})</CardTitle>
            <CardDescription>
              Click on a banner to edit it, or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {banners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No saved banners yet. Create your first banner to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((banner) => (
                  <Card key={`${banner.id}-${banner.updatedAt}`} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm truncate">{banner.name}</CardTitle>
                          {banner.id === 'default-banner' && (
                            <Badge variant="secondary" className="text-xs">
                              Current Hero
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadBanner(banner);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {banner.id === 'default-banner' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const updatedDefault = await createDefaultBanner();
                                const updatedBanners = banners.map(b => 
                                  b.id === 'default-banner' ? updatedDefault : b
                                );
                                setBanners(updatedBanners);
                                toast({
                                  title: "Default Banner Updated",
                                  description: "Synced with current home page hero content"
                                });
                              }}
                              title="Sync with current home page hero"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBanner(banner);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {banner.id !== 'default-banner' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBanner(banner.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {banner.width} x {banner.height}px • {banner.elements.length} elements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div
                        className="w-full border rounded cursor-pointer"
                        style={{
                          height: '80px',
                          ...getBannerBackgroundStyle(banner),
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => loadBanner(banner)}
                      >
                        {banner.elements.map((element) => (
                          <div
                            key={element.id}
                            style={{
                              position: 'absolute',
                              left: `${(element.x / banner.width) * 100}%`,
                              top: `${(element.y / banner.height) * 100}%`,
                              width: `${(element.width / banner.width) * 100}%`,
                              height: `${(element.height / banner.height) * 100}%`,
                              fontSize: `${((element.fontSize || 16) * 80) / banner.height}px`,
                              fontFamily: element.fontFamily,
                              fontWeight: element.fontWeight,
                              color: element.color,
                              backgroundColor: element.backgroundColor,
                              borderRadius: element.borderRadius,
                              textAlign: element.textAlign,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: element.textAlign === 'center' ? 'center' : 
                                             element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                              padding: '1px',
                              overflow: 'hidden',
                              opacity: element.opacity || 1,
                              transform: `rotate(${element.rotation || 0}deg)`
                            }}
                          >
                            {element.type === 'image' && element.content ? (
                              <img
                                src={element.content}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs truncate">{element.content}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toolbar - Above Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Banner Controls</CardTitle>
          <CardDescription className="text-sm">
            Create your banner, then use "Set Banner to Home Page Hero" to apply it to your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Banner Name */}
            <div className="space-y-2">
              <Label>Banner Name</Label>
              <Input
                value={bannerName}
                onChange={(e) => setBannerName(e.target.value)}
                placeholder="Enter banner name"
              />
            </div>

            {/* Add Elements */}
            <div className="space-y-2">
              <Label>Add Elements</Label>
              <div className="flex gap-2">
                <Button onClick={() => addElement('text')} variant="outline" size="sm" className="flex-1">
                  <Type className="h-4 w-4 mr-1" />
                  Text
                </Button>
                <Button onClick={() => addElement('button')} variant="outline" size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Button
                </Button>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Background Type */}
            <div className="space-y-2">
              <Label>Background Type</Label>
              <Select value={backgroundType} onValueChange={(value: 'solid' | 'gradient' | 'image') => setBackgroundType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background Settings */}
            <div className="space-y-2">
              <Label>Background Settings</Label>
              {backgroundType === 'solid' && (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={currentBanner?.backgroundColor || '#ffffff'}
                    onChange={(e) => currentBanner && setCurrentBanner({
                      ...currentBanner,
                      backgroundColor: e.target.value
                    })}
                    className="w-20"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.slice(0, 4).map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        onClick={() => currentBanner && setCurrentBanner({
                          ...currentBanner,
                          backgroundColor: color
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {backgroundType === 'gradient' && (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gradientColor1}
                    onChange={(e) => setGradientColor1(e.target.value)}
                    className="w-16"
                  />
                  <Input
                    type="color"
                    value={gradientColor2}
                    onChange={(e) => setGradientColor2(e.target.value)}
                    className="w-16"
                  />
                  <Select value={gradientDirection} onValueChange={setGradientDirection}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45deg">↗</SelectItem>
                      <SelectItem value="90deg">↑</SelectItem>
                      <SelectItem value="0deg">→</SelectItem>
                      <SelectItem value="135deg">↖</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {backgroundType === 'image' && (
                <div className="flex gap-2">
                  <input
                    ref={backgroundFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => backgroundFileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <Input
                    placeholder="or enter URL"
                    onChange={(e) => {
                      if (currentBanner && e.target.value) {
                        setCurrentBanner({
                          ...currentBanner,
                          backgroundImage: e.target.value,
                          updatedAt: new Date().toISOString()
                        });
                        setBackgroundType('image');
                      }
                    }}
                    className="text-xs flex-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button onClick={saveBannerWithHousekeeping} variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save Banner
            </Button>
            
            <Button 
              onClick={applyBannerToHero} 
              variant="outline"
              disabled={!currentBanner || updateAppBrandingMutation.isPending}
            >
              <Home className="h-4 w-4 mr-2" />
              {updateAppBrandingMutation.isPending ? 'Applying...' : 'Set Banner to Home Page Hero'}
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/app-branding-settings', {
                    credentials: 'include'
                  });
                  const currentSettings = await response.json();
                  
                  const updatedSettings = {
                    ...currentSettings,
                    heroBannerData: '' // Clear banner data to return to default
                  };
                  
                  updateAppBrandingMutation.mutate(updatedSettings);
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to reset hero to default.",
                    variant: "destructive"
                  });
                }
              }} 
              variant="secondary"
              disabled={updateAppBrandingMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default Hero
            </Button>
          </div>
        </CardContent>
      </Card>      {/* 
Canvas and Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas - Takes up 3 columns */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {currentBanner 
                    ? `Canvas - ${currentBanner.width} x ${currentBanner.height}px`
                    : 'Canvas - Create a banner to get started'
                  }
                </span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {currentBanner ? currentBanner.elements.length : 0} elements
                  </Badge>
                </div>
              </CardTitle>
              {currentBanner && (
                <CardDescription className="text-sm">
                  Click elements to select • Drag to move • Use blue handles to resize
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Banner Editor</TabsTrigger>
                  <TabsTrigger value="hero-preview">Hero Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="mt-4">
                  {currentBanner ? (
                    <div className="border-2 border-dashed border-gray-300 p-4 overflow-auto">
                      <div
                        ref={canvasRef}
                        className="relative mx-auto cursor-crosshair"
                        style={{
                          width: currentBanner.width,
                          height: currentBanner.height,
                          ...getBackgroundStyle()
                        }}
                      >
                    {currentBanner.elements
                      .sort((a, b) => a.zIndex - b.zIndex)
                      .map((element) => (
                        <div
                          key={element.id}
                          className={`absolute select-none ${
                            selectedElement === element.id ? `ring-2 ring-blue-500` : ''
                          } cursor-move`}
                          style={{
                            left: element.x,
                            top: element.y,
                            width: element.width,
                            height: element.height,
                            fontSize: element.fontSize,
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontWeight,
                            color: element.color,
                            backgroundColor: element.type === 'text' ? 'transparent' : element.backgroundColor,
                            borderRadius: element.borderRadius,
                            textAlign: element.textAlign,
                            zIndex: element.zIndex,
                            opacity: element.opacity || 1,
                            transform: `rotate(${element.rotation || 0}deg)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: element.textAlign === 'center' ? 'center' : 
                                           element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            padding: element.type === 'button' ? '8px 16px' : '4px',
                            overflow: 'hidden',
                            textShadow: element.type === 'text' && element.shadow ? 
                              `${element.shadowOffsetX || 2}px ${element.shadowOffsetY || 2}px ${element.shadowBlur || 4}px ${element.shadowColor || '#000000'}` : 
                              'none',
                            boxShadow: (element.type === 'button' || element.type === 'image') && element.shadow ? 
                              `${element.shadowOffsetX || 2}px ${element.shadowOffsetY || 2}px ${element.shadowBlur || 4}px ${element.shadowColor || '#000000'}` : 
                              'none'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element.id)}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          {element.type === 'image' ? (
                            element.content ? (
                              <img
                                src={element.content}
                                alt="Banner element"
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )
                          ) : (
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => updateElement(element.id, { content: e.target.textContent || '' })}
                              className="w-full outline-none"
                              style={{ 
                                minWidth: 'max-content',
                                display: 'inline-block'
                              }}
                            >
                              {element.content}
                            </span>
                          )}
                          
                          {/* Resize handles - only show for selected element */}
                          {selectedElement === element.id && (
                            <>
                              {/* Corner handles */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-nw-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ top: -6, left: -6 }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')}
                                title="Resize from top-left corner"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-ne-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ top: -6, right: -6 }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')}
                                title="Resize from top-right corner"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-sw-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ bottom: -6, left: -6 }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')}
                                title="Resize from bottom-left corner"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-se-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ bottom: -6, right: -6 }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')}
                                title="Resize from bottom-right corner"
                              />
                              
                              {/* Edge handles */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-n-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ 
                                  top: -6, 
                                  left: '50%', 
                                  transform: 'translateX(-50%)' 
                                }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'n')}
                                title="Resize height from top"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-s-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ 
                                  bottom: -6, 
                                  left: '50%', 
                                  transform: 'translateX(-50%)' 
                                }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 's')}
                                title="Resize height from bottom"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-w-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ 
                                  top: '50%', 
                                  left: -6, 
                                  transform: 'translateY(-50%)' 
                                }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'w')}
                                title="Resize width from left"
                              />
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-e-resize hover:bg-blue-600 transition-colors shadow-sm"
                                style={{ 
                                  top: '50%', 
                                  right: -6, 
                                  transform: 'translateY(-50%)' 
                                }}
                                onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'e')}
                                title="Resize width from right"
                              />
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                  <div className="space-y-4">
                    <ImageIcon className="h-16 w-16 mx-auto text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Banner Created Yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start by uploading an image, adding text, or creating a button. A new banner will be created automatically.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => addElement('text')} variant="outline" size="sm">
                          <Type className="h-4 w-4 mr-1" />
                          Add Text
                        </Button>
                        <Button onClick={() => addElement('button')} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </TabsContent>
                
                <TabsContent value="hero-preview" className="mt-4">
                  {currentBanner ? (
                    <div className="border-2 border-dashed border-gray-300 p-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Preview of how your banner will look as the home page hero section:
                      </div>
                      <div 
                        className="relative h-[300px] overflow-hidden rounded-lg"
                        style={getBackgroundStyle()}
                      >
                        {/* Render banner elements as hero preview */}
                        {currentBanner.elements
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((element) => {
                          // Calculate scaling factors for hero preview
                          const scaleX = 1; // Use full width
                          const scaleY = 300 / currentBanner.height; // Scale to preview height (300px)
                          const avgScale = (scaleX + scaleY) / 2; // Average scale for font sizing
                          
                          return (
                            <div
                              key={`preview-${element.id}`}
                              className="absolute"
                              style={{
                                left: `${(element.x / currentBanner.width) * 100}%`,
                                top: `${(element.y / currentBanner.height) * 100}%`,
                                width: `${(element.width / currentBanner.width) * 100}%`,
                                height: `${(element.height / currentBanner.height) * 100}%`,
                                fontSize: `${((element.fontSize || 16) * avgScale)}px`,
                                fontFamily: element.fontFamily,
                                fontWeight: element.fontWeight,
                                color: element.color,
                                backgroundColor: element.backgroundColor,
                                borderRadius: `${(element.borderRadius || 0) * avgScale}px`,
                                textAlign: element.textAlign,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: element.textAlign === 'center' ? 'center' : 
                                               element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                padding: element.type === 'button' ? `${4 * avgScale}px ${8 * avgScale}px` : `${2 * avgScale}px`,
                                opacity: element.opacity || 1,
                                transform: `rotate(${element.rotation || 0}deg)`,
                                overflow: 'hidden',
                                textShadow: element.type === 'text' && element.shadow ? 
                                  `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                                  'none',
                                boxShadow: element.type !== 'text' && element.shadow ? 
                                  `${(element.shadowOffsetX || 2) * avgScale}px ${(element.shadowOffsetY || 2) * avgScale}px ${(element.shadowBlur || 4) * avgScale}px ${element.shadowColor || '#000000'}` : 
                                  'none'
                              }}
                            >
                              {element.type === 'image' && element.content ? (
                                <img
                                  src={element.content}
                                  alt="Hero element"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="truncate">
                                  {element.content}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      
                      {/* Overlay gradient like the real hero (only if no custom banner background) */}
                      {!currentBanner.backgroundGradient && !currentBanner.backgroundImage && (
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.6), rgba(0,0,0,0.8))`
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Hero Content Preview:</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Title:</strong> {currentBanner.elements.find(el => el.type === 'text')?.content || 'Discover Your Sound'}</div>
                        <div><strong>Subtitle:</strong> {currentBanner.elements.filter(el => el.type === 'text')[1]?.content || 'Premium beats for every artist'}</div>
                        <div><strong>Button Text:</strong> {currentBanner.elements.find(el => el.type === 'button')?.content || 'Start Creating'}</div>
                        <div><strong>Button Link:</strong> <span className="font-mono text-blue-600">{currentBanner.elements.find(el => el.type === 'button')?.link || '/beats'}</span></div>
                      </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                      <div className="space-y-4">
                        <Eye className="h-16 w-16 mx-auto text-gray-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No Banner to Preview
                          </h3>
                          <p className="text-gray-500">
                            Create a banner first to see how it will look as your home page hero section.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Element Properties - Right Sidebar */}
        <div className="lg:col-span-1">
          {selectedElementData ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Element Properties</CardTitle>
                <CardDescription className="text-sm">
                  Drag to move • Use resize handles to change size • Click to select
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Content</Label>
                  {selectedElementData.type === 'image' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          ref={elementImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                updateElement(selectedElement!, { 
                                  content: event.target?.result as string 
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => elementImageInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Image
                        </Button>
                      </div>
                      <Input
                        placeholder="Enter image URL"
                        value={selectedElementData.content.startsWith('data:') ? '' : selectedElementData.content}
                        onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  ) : (
                    <Textarea
                      value={selectedElementData.content}
                      onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                      rows={3}
                    />
                  )}
                </div>

                {selectedElementData.type !== 'image' && (
                  <>
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={selectedElementData.fontFamily}
                        onValueChange={(value) => updateElement(selectedElement!, { fontFamily: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                                {category}
                              </div>
                              {fonts.map(font => (
                                <SelectItem 
                                  key={font} 
                                  value={font}
                                  className="pl-4"
                                  style={{ fontFamily: font }}
                                >
                                  {font}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Size: {selectedElementData.fontSize}px</Label>
                      <Slider
                        value={[selectedElementData.fontSize || 16]}
                        onValueChange={([value]) => updateElement(selectedElement!, { fontSize: value })}
                        min={8}
                        max={120}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <Input
                        type="color"
                        value={selectedElementData.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement!, { color: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Align</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={selectedElementData.textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement!, { textAlign: 'left' })}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedElementData.textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement!, { textAlign: 'center' })}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedElementData.textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement!, { textAlign: 'right' })}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={selectedElementData.fontWeight === 'normal' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement!, { fontWeight: 'normal' })}
                        >
                          Normal
                        </Button>
                        <Button
                          variant={selectedElementData.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateElement(selectedElement!, { fontWeight: 'bold' })}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Opacity: {Math.round((selectedElementData.opacity || 1) * 100)}%</Label>
                  <Slider
                    value={[(selectedElementData.opacity || 1) * 100]}
                    onValueChange={([value]) => updateElement(selectedElement!, { opacity: value / 100 })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rotation: {selectedElementData.rotation || 0}°</Label>
                  <Slider
                    value={[selectedElementData.rotation || 0]}
                    onValueChange={([value]) => updateElement(selectedElement!, { rotation: value })}
                    min={-180}
                    max={180}
                    step={5}
                  />
                </div>

                {selectedElementData.type === 'button' && (
                  <>
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={selectedElementData.backgroundColor || '#007bff'}
                        onChange={(e) => updateElement(selectedElement!, { backgroundColor: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Navigation Link</Label>
                      <div className="space-y-2">
                        {/* Add state to track if user wants custom URL */}
                        {(() => {
                          const predefinedLinks = ['/beats', '/exclusive', '/plans', '/contact', '/bio', '/login', '/library'];
                          const currentLink = selectedElementData.link || '/beats';
                          const isCustomMode = !predefinedLinks.includes(currentLink);
                          
                          return isCustomMode ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Custom URL</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateElement(selectedElement!, { link: '/beats' })}
                                >
                                  Use Predefined
                                </Button>
                              </div>
                              <Input
                                placeholder="Enter custom URL (e.g., /custom-page or https://example.com)"
                                value={currentLink}
                                onChange={(e) => updateElement(selectedElement!, { link: e.target.value })}
                                autoFocus
                              />
                              <div className="text-xs text-gray-500">
                                {currentLink.startsWith('http') ? (
                                  <span className="text-blue-600">✓ External URL - will open in new tab</span>
                                ) : currentLink.startsWith('/') ? (
                                  <span className="text-green-600">✓ Internal route - will navigate in same window</span>
                                ) : currentLink ? (
                                  <span className="text-orange-600">⚠ Add '/' for internal routes or 'https://' for external URLs</span>
                                ) : (
                                  <span>Enter internal routes (e.g., /my-page) or external URLs (e.g., https://example.com)</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Select
                                value={currentLink}
                                onValueChange={(value) => {
                                  if (value === 'custom') {
                                    updateElement(selectedElement!, { link: '/custom-url' });
                                  } else {
                                    updateElement(selectedElement!, { link: value });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a page" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="/beats">Beats Page</SelectItem>
                                  <SelectItem value="/exclusive">Exclusive Music</SelectItem>
                                  <SelectItem value="/plans">Plans & Pricing</SelectItem>
                                  <SelectItem value="/contact">Contact</SelectItem>
                                  <SelectItem value="/bio">Bio</SelectItem>
                                  <SelectItem value="/login">Login</SelectItem>
                                  <SelectItem value="/library">Library</SelectItem>
                                  <SelectItem value="custom">Custom URL...</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })()}
                        
                        <div className="text-xs text-gray-500">
                          When clicked, this button will navigate to: <span className="font-mono">{selectedElementData.link || '/beats'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Shadow</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="shadow-enable"
                        checked={selectedElementData.shadow || false}
                        onChange={(e) => updateElement(selectedElement!, { shadow: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="shadow-enable">Enable Shadow</Label>
                    </div>
                    {selectedElementData.shadow && (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const presets = {
                            'soft': { shadowBlur: 4, shadowOffsetX: 2, shadowOffsetY: 2, shadowColor: '#00000040' },
                            'medium': { shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4, shadowColor: '#00000060' },
                            'hard': { shadowBlur: 0, shadowOffsetX: 3, shadowOffsetY: 3, shadowColor: '#000000' },
                            'glow': { shadowBlur: 12, shadowOffsetX: 0, shadowOffsetY: 0, shadowColor: '#ffffff80' }
                          };
                          if (presets[value as keyof typeof presets]) {
                            updateElement(selectedElement!, presets[value as keyof typeof presets]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Preset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                          <SelectItem value="glow">Glow</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {selectedElementData.shadow && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        <Label>Shadow Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedElementData.shadowColor || '#000000'}
                            onChange={(e) => updateElement(selectedElement!, { shadowColor: e.target.value })}
                            className="w-16"
                          />
                          <div className="flex gap-1 flex-wrap">
                            {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400"
                                style={{ backgroundColor: color }}
                                onClick={() => updateElement(selectedElement!, { shadowColor: color })}
                                title={`Set shadow color to ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Blur: {selectedElementData.shadowBlur || 4}px</Label>
                          <Slider
                            value={[selectedElementData.shadowBlur || 4]}
                            onValueChange={([value]) => updateElement(selectedElement!, { shadowBlur: value })}
                            min={0}
                            max={20}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">X Offset: {selectedElementData.shadowOffsetX || 2}px</Label>
                          <Slider
                            value={[selectedElementData.shadowOffsetX || 2]}
                            onValueChange={([value]) => updateElement(selectedElement!, { shadowOffsetX: value })}
                            min={-20}
                            max={20}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y Offset: {selectedElementData.shadowOffsetY || 2}px</Label>
                          <Slider
                            value={[selectedElementData.shadowOffsetY || 2]}
                            onValueChange={([value]) => updateElement(selectedElement!, { shadowOffsetY: value })}
                            min={-20}
                            max={20}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Position & Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={selectedElementData.x}
                        onChange={(e) => updateElement(selectedElement!, { x: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={selectedElementData.y}
                        onChange={(e) => updateElement(selectedElement!, { y: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={selectedElementData.width}
                        onChange={(e) => updateElement(selectedElement!, { width: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={selectedElementData.height}
                        onChange={(e) => updateElement(selectedElement!, { height: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => deleteElement(selectedElement!)}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Element
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Element Properties</CardTitle>
                <CardDescription className="text-sm">
                  Select an element to edit its properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No element selected</p>
                  <p className="text-xs mt-1">Click on an element in the canvas to edit it</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Hidden file input for importing banners */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json"
        onChange={importBanners}
        className="hidden"
      />
    </div>
  );
}