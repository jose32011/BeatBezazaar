import { useQuery } from "@tanstack/react-query";

export function useAppBranding() {
  const { data: brandingSettings, isLoading } = useQuery({
    queryKey: ['/api/app-branding-settings'],
    select: (data: any) => data || {
      appName: 'BeatBazaar',
      appLogo: '',
      heroTitle: 'Discover Your Sound',
      heroSubtitle: 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
      heroImage: '',
      heroButtonText: 'Start Creating',
      heroButtonLink: '/beats',
      loginTitle: 'Welcome Back',
      loginSubtitle: 'Sign in to your account to continue',
      loginImage: ''
    }
  });

  return {
    appName: brandingSettings?.appName || 'BeatBazaar',
    appLogo: brandingSettings?.appLogo || '',
    heroTitle: brandingSettings?.heroTitle || 'Discover Your Sound',
    heroSubtitle: brandingSettings?.heroSubtitle || 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
    heroImage: brandingSettings?.heroImage || '',
    heroButtonText: brandingSettings?.heroButtonText || 'Start Creating',
    heroButtonLink: brandingSettings?.heroButtonLink || '/beats',
    loginTitle: brandingSettings?.loginTitle || 'Welcome Back',
    loginSubtitle: brandingSettings?.loginSubtitle || 'Sign in to your account to continue',
    loginImage: brandingSettings?.loginImage || '',
    isLoading
  };
}
