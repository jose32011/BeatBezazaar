import { useQuery } from "@tanstack/react-query";
import React from "react";

// Cache for app branding to prevent flash
let cachedBrandingSettings: any = null;

// Try to load cached settings from localStorage on module load
try {
  const cached = localStorage.getItem('app-branding-cache');
  if (cached) {
    cachedBrandingSettings = JSON.parse(cached);
  }
} catch (error) {
  // Ignore localStorage errors
}

export function useAppBranding() {
  const defaultSettings = {
    appName: 'Beat Store',
    appLogo: '',
    heroTitle: 'Discover Your Sound',
    heroSubtitle: 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
    heroImage: '',
    heroButtonText: 'Start Creating',
    heroButtonLink: '/beats',
    heroBannerData: '',
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to your account to continue',
    loginImage: ''
  };

  const { data: brandingSettings, isLoading } = useQuery({
    queryKey: ['/api/app-branding-settings'],
    select: (data: any) => {
      const settings = data || defaultSettings;
      // Cache the settings for future use
      cachedBrandingSettings = settings;
      // Also cache in localStorage for next page load
      try {
        localStorage.setItem('app-branding-cache', JSON.stringify(settings));
      } catch (error) {
        // Ignore localStorage errors
      }
      return settings;
    },
    staleTime: 0, // Always consider data stale for immediate updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    // Remove initialData to prevent flash - let it load properly
  });

  // Use cached settings if available during loading, otherwise use current settings or defaults
  const settingsToUse = brandingSettings || cachedBrandingSettings || defaultSettings;
  
  // Set document title immediately when data changes
  React.useEffect(() => {
    if (settingsToUse.appName) {
      document.title = settingsToUse.appName;
    }
  }, [settingsToUse.appName]);

  return {
    appName: settingsToUse.appName,
    appLogo: settingsToUse.appLogo,
    heroTitle: settingsToUse.heroTitle,
    heroSubtitle: settingsToUse.heroSubtitle,
    heroImage: settingsToUse.heroImage,
    heroButtonText: settingsToUse.heroButtonText,
    heroButtonLink: settingsToUse.heroButtonLink,
    heroBannerData: settingsToUse.heroBannerData,
    loginTitle: settingsToUse.loginTitle,
    loginSubtitle: settingsToUse.loginSubtitle,
    loginImage: settingsToUse.loginImage,
    isLoading
  };
}
