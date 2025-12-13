import { useTheme, type Theme } from "@/contexts/ThemeContext";
import heroBackground from '@assets/generated_images/Hero_background_waveform_visualization_112bcc17.png';

// Theme-specific hero images - carefully selected to complement each theme's color palette
const themeHeroImages: Record<Theme, string> = {
  // Original blue/tech theme - Modern recording studio with blue LED lighting
  'original': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Purple gradient theme - Studio with purple/violet ambient lighting and synthesizers
  'default': 'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Dark blue theme - Professional studio with cool blue accent lighting
  'card-match': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Black/white theme - Monochrome studio with dramatic contrast lighting
  'black-white': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Red/black theme - Use the original default hero image
  'red-black': heroBackground,
  
  // Blue/purple theme - Futuristic studio with blue and purple neon cyberpunk aesthetic
  'blue-purple': 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Green/dark theme - Studio with natural wood elements and green ambient lighting
  'green-dark': 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Orange/dark theme - Warm studio with sunset/golden hour lighting
  'orange-dark': 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Pink/purple theme - Vibrant studio with pink and purple neon lighting
  'pink-purple': 'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  
  // Cyan/dark theme - High-tech studio with cyan and teal lighting
  'cyan-dark': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
};

// Alternative hero images for each theme (backup and variety options)
const themeHeroAlternatives: Record<Theme, string[]> = {
  'original': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Blue studio setup
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Professional mixing board
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Modern tech studio
  ],
  'default': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Purple ambient studio
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Synthesizer setup
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Purple gradient studio
  ],
  'card-match': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Blue tech studio
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Professional blue setup
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Modern blue studio
  ],
  'black-white': [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Monochrome mixing board
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Black and white studio
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Dramatic lighting studio
  ],
  'red-black': [
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Red ambient studio
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Warm red lighting
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Red neon studio
  ],
  'blue-purple': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Blue purple gradient
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Purple blue neon
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Cyberpunk studio
  ],
  'green-dark': [
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Green ambient studio
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Natural green lighting
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Green tech studio
  ],
  'orange-dark': [
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Warm orange studio
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Golden hour studio
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Sunset lighting studio
  ],
  'pink-purple': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Pink purple neon
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Vibrant pink studio
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Purple pink gradient
  ],
  'cyan-dark': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Cyan tech studio
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Teal lighting studio
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Futuristic cyan studio
  ],
};

// Theme descriptions for better understanding
const themeHeroDescriptions: Record<Theme, string> = {
  'original': 'Modern recording studio with blue LED lighting and waveform visualizations',
  'default': 'Purple gradient studio with synthesizers and ambient lighting',
  'card-match': 'Dark professional studio with blue accent lighting',
  'black-white': 'Monochrome recording studio with vintage equipment and dramatic lighting',
  'red-black': 'Original custom hero image - waveform visualization background',
  'blue-purple': 'Futuristic studio with blue and purple neon lights, cyberpunk aesthetic',
  'green-dark': 'Studio with natural wood elements and green ambient lighting',
  'orange-dark': 'Warm studio with orange sunset lighting and vintage equipment',
  'pink-purple': 'Vibrant studio with pink and purple lighting, pop music aesthetic',
  'cyan-dark': 'High-tech studio with cyan lighting and futuristic equipment',
};

// Additional curated hero images from various sources (Unsplash, Pexels, etc.)
const additionalHeroOptions: Record<Theme, string[]> = {
  'original': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'default': [
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'card-match': [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'black-white': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'red-black': [
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'blue-purple': [
    'https://images.unsplash.com/photo-1614149162883-504ce4d13909?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'green-dark': [
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'orange-dark': [
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'pink-purple': [
    'https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
  'cyan-dark': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ],
};

export function useThemeHero() {
  const { theme } = useTheme();
  
  /**
   * Get the default hero image for the current theme
   */
  const getThemeHeroImage = (): string => {
    return themeHeroImages[theme];
  };

  /**
   * Get alternative hero images for the current theme
   */
  const getThemeHeroAlternatives = (): string[] => {
    return themeHeroAlternatives[theme];
  };

  /**
   * Get the hero image description for the current theme
   */
  const getThemeHeroDescription = (): string => {
    return themeHeroDescriptions[theme];
  };

  /**
   * Get a random alternative hero image for the current theme
   */
  const getRandomThemeHero = (): string => {
    const alternatives = themeHeroAlternatives[theme];
    const randomIndex = Math.floor(Math.random() * alternatives.length);
    return alternatives[randomIndex];
  };

  /**
   * Get all available hero images for the current theme (primary + alternatives + additional)
   */
  const getAllThemeHeroImages = (): string[] => {
    return [
      themeHeroImages[theme],
      ...themeHeroAlternatives[theme],
      ...additionalHeroOptions[theme]
    ];
  };

  /**
   * Get a random hero image from all available options for the current theme
   */
  const getRandomFromAllOptions = (): string => {
    const allImages = getAllThemeHeroImages();
    const randomIndex = Math.floor(Math.random() * allImages.length);
    return allImages[randomIndex];
  };

  /**
   * Get the final hero image to use, prioritizing custom image over theme default
   */
  const getHeroImage = (customHeroImage?: string): string => {
    return (customHeroImage && customHeroImage.trim()) || getThemeHeroImage();
  };

  /**
   * Get hero image with fallback to alternative if primary fails to load
   */
  const getHeroImageWithFallback = (customHeroImage?: string, useAlternative = false): string => {
    if (customHeroImage && customHeroImage.trim()) return customHeroImage;
    return useAlternative ? getRandomThemeHero() : getThemeHeroImage();
  };

  return {
    getThemeHeroImage,
    getThemeHeroAlternatives,
    getThemeHeroDescription,
    getRandomThemeHero,
    getAllThemeHeroImages,
    getRandomFromAllOptions,
    getHeroImage,
    getHeroImageWithFallback,
    themeHeroImages,
    themeHeroAlternatives,
    themeHeroDescriptions,
    additionalHeroOptions,
  };
}