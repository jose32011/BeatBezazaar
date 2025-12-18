import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Building2, 
  Settings, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Trash2,
  Database,
  Users,
  Plus,
  Edit,
  Trash,
  Shield,
  User,
  Music,
  Palette,
  Mail,
  Send,
  Menu,
  X,
  ChevronDown,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  Image,
  Phone,
  MapPin,
  Users2,
  ExternalLink,
  Crown,
  Star,
  Globe,
  Type
} from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";
import ThemePreview from "@/components/ThemePreview";
import BackupRestoreManager from "@/components/BackupRestoreManager";
import HeroBannerCreator from "@/components/HeroBannerCreator";

interface ArtistBio {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  role: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentSettings {
  paypal: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'live';
    webhookId: string;
  };
  bank: {
    enabled: boolean;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    bankAddress: string;
    swiftCode: string;
    instructions: string;
  };
  stripe?: {
    enabled: boolean;
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    currency: string;
    testMode: boolean;
  };
}

interface EmailSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
}

interface PlansSettings {
  id?: string;
  pageTitle: string;
  pageSubtitle: string;
  basicPlan: {
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  };
  premiumPlan: {
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
  };
  exclusivePlan: {
    name: string;
    price: number;
    description: string;
    features: string[];
    isActive: boolean;
  };
  additionalFeaturesTitle: string;
  additionalFeatures: {
    title: string;
    description: string;
    icon: string;
  }[];
  faqSection: {
    title: string;
    questions: {
      question: string;
      answer: string;
    }[];
  };
  trustBadges: {
    text: string;
    icon: string;
  }[];
}

interface AppBrandingSettings {
  id?: string;
  appName: string;
  appLogo: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroButtonText: string;
  heroButtonLink: string;
  loginTitle: string;
  loginSubtitle: string;
  loginImage: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'client';
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
}

function AdminSettingsContent() {
  const { user: currentUser, logout } = useAuth();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [showSecrets, setShowSecrets] = useState(false);
  
  // Get tab from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const tabFromUrl = urlParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || "site-settings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Reset to first tab when component mounts (when accessed from admin dashboard)
  useEffect(() => {
    if (!tabFromUrl) {
      setActiveTab("site-settings");
    }
  }, [tabFromUrl]);
  const [settings, setSettings] = useState<PaymentSettings>({
    paypal: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      environment: 'sandbox',
      webhookId: ''
    },
    bank: {
      enabled: false,
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      bankAddress: '',
      swiftCode: '',
      instructions: ''
    }
    ,
    stripe: {
      enabled: false,
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      testMode: true
    }
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    enabled: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    fromName: 'BeatBazaar',
    fromEmail: ''
  });

  const [appBrandingSettings, setAppBrandingSettings] = useState<AppBrandingSettings>({
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
  });

  const [homeSettings, setHomeSettings] = useState({
    title: 'Premium Beats for Your Next Hit',
    description: 'Discover high-quality beats crafted by professional producers.',
    feature1: 'Instant download after purchase',
    feature2: 'High-quality WAV & MP3 files',
    feature3: 'Professional mixing and mastering',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop'
  });

  const [contactSettings, setContactSettings] = useState({
    bandImageUrl: '',
    bandName: 'BeatBazaar',
    contactEmail: 'contact@beatbazaar.com',
    contactPhone: '+1 (555) 123-4567',
    contactAddress: '123 Music Street',
    contactCity: 'Los Angeles',
    contactState: 'CA',
    contactZipCode: '90210',
    contactCountry: 'USA',
    messageEnabled: true,
    messageSubject: 'New Contact Form Submission',
    messageTemplate: 'You have received a new message from your contact form.',
    // Social Media Settings
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    tiktokUrl: ''
  });

  const [plansSettings, setPlansSettings] = useState<PlansSettings>({
    pageTitle: 'Beat Licensing Plans',
    pageSubtitle: 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
    basicPlan: {
      name: 'Basic License',
      price: 29,
      description: 'Perfect for independent artists and small projects',
      features: [
        'Commercial use rights',
        'Up to 5,000 copies',
        'Streaming on all platforms',
        'Radio play up to 1M listeners',
        'Music video rights',
        'Social media promotion',
        '1 year license term',
        'Email support'
      ],
      isActive: true
    },
    premiumPlan: {
      name: 'Premium License',
      price: 99,
      description: 'Ideal for established artists and larger projects',
      features: [
        'Everything in Basic License',
        'Up to 50,000 copies',
        'Radio play unlimited',
        'TV and film synchronization',
        'Live performance rights',
        'Remix and adaptation rights',
        'Priority support',
        '3 year license term',
        'Custom contract available'
      ],
      isActive: true,
      isPopular: true
    },
    exclusivePlan: {
      name: 'Exclusive Rights',
      price: 999,
      description: 'Complete ownership and exclusive rights to the beat',
      features: [
        'Complete ownership of the beat',
        'Unlimited commercial use',
        'Unlimited copies and streams',
        'Full publishing rights',
        'Master recording ownership',
        'Exclusive to you forever',
        'No attribution required',
        'Priority support',
        'Custom contract',
        'Beat removed from store',
        'Stems and project files included'
      ],
      isActive: true
    },
    additionalFeaturesTitle: 'Why Choose BeatBazaar?',
    additionalFeatures: [
      {
        title: 'Legal Protection',
        description: 'All licenses come with legal documentation and protection',
        icon: 'Shield'
      },
      {
        title: 'Artist Support',
        description: 'Dedicated support team to help with your music career',
        icon: 'Users'
      },
      {
        title: 'Instant Download',
        description: 'Get your beats immediately after purchase',
        icon: 'Download'
      },
      {
        title: 'High Quality',
        description: 'Professional studio quality beats and stems',
        icon: 'Headphones'
      }
    ],
    faqSection: {
      title: 'Frequently Asked Questions',
      questions: [
        {
          question: "What's the difference between Basic and Premium licenses?",
          answer: 'Basic licenses are perfect for independent artists with limited distribution. Premium licenses offer higher copy limits, TV/film rights, and longer terms for established artists.'
        },
        {
          question: 'What does "Exclusive Rights" mean?',
          answer: 'With exclusive rights, you own the beat completely. It\'s removed from our store, you get all stems and project files, and no one else can use it. You have full creative and commercial control.'
        },
        {
          question: 'Do I need to credit the producer?',
          answer: 'For Basic and Premium licenses, crediting is appreciated but not required. With Exclusive Rights, no attribution is needed as you own the beat completely.'
        }
      ]
    },
    trustBadges: [
      {
        text: 'Legal Protection Included',
        icon: 'Shield'
      },
      {
        text: 'Instant Download',
        icon: 'Zap'
      },
      {
        text: '24/7 Support',
        icon: 'Users'
      }
    ]
  });

  const [artistBios, setArtistBios] = useState<ArtistBio[]>([]);
  const [editingBio, setEditingBio] = useState<ArtistBio | null>(null);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const [bioFormData, setBioFormData] = useState({
    name: '',
    imageUrl: '',
    bio: '',
    role: 'Artist',
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: '',
      spotify: ''
    },
    isActive: true,
    sortOrder: 0
  });

  // Navigation menu items
  const menuItems = [
    { id: "site-settings", label: "Site Settings", icon: Globe, shortLabel: "Site" },
    { id: "banner-creator", label: "Banner Creator", icon: Image, shortLabel: "Banners" },
    { id: "payment-settings", label: "Payment Settings", icon: CreditCard, shortLabel: "Payments" },
    { id: "email", label: "Email Settings", icon: Mail, shortLabel: "Email" },
    { id: "users", label: "Admin Users", icon: Users, shortLabel: "Users" },
    { id: "themes", label: "Themes", icon: Palette, shortLabel: "Themes" },
    { id: "backup", label: "Backup & Restore", icon: Database, shortLabel: "Backup" },
    { id: "database", label: "Database", icon: Database, shortLabel: "DB" }
  ];

  // Load settings on component mount
  useEffect(() => {
    // Load from localStorage or API
    const savedSettings = localStorage.getItem('payment-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Load email settings from API
    fetch('/api/admin/email-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setEmailSettings({
            enabled: data.enabled || false,
            smtpHost: data.smtpHost || 'smtp.gmail.com',
            smtpPort: data.smtpPort || 587,
            smtpSecure: data.smtpSecure || false,
            smtpUser: data.smtpUser || '',
            smtpPass: data.smtpPass || '',
            fromName: data.fromName || 'BeatBazaar',
            fromEmail: data.fromEmail || ''
          });
        }
      })
      .catch(error => {
        console.error('Failed to load email settings:', error);
      });

    // Load contact settings from API (including social media)
    fetch('/api/contact-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setContactSettings({
            bandImageUrl: data.bandImageUrl || '',
            bandName: data.bandName || 'BeatBazaar',
            contactEmail: data.contactEmail || 'contact@beatbazaar.com',
            contactPhone: data.contactPhone || '+1 (555) 123-4567',
            contactAddress: data.contactAddress || '123 Music Street',
            contactCity: data.contactCity || 'Los Angeles',
            contactState: data.contactState || 'CA',
            contactZipCode: data.contactZipCode || '90210',
            contactCountry: data.contactCountry || 'USA',
            messageEnabled: data.messageEnabled !== undefined ? data.messageEnabled : true,
            messageSubject: data.messageSubject || 'New Contact Form Submission',
            messageTemplate: data.messageTemplate || 'You have received a new message from your contact form.',
            // Social Media Settings
            facebookUrl: data.facebookUrl || '',
            instagramUrl: data.instagramUrl || '',
            twitterUrl: data.twitterUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            tiktokUrl: data.tiktokUrl || ''
          });
        }
      })
      .catch(error => {
        console.error('Failed to load contact settings:', error);
      });

    // Load plans settings from API
    fetch('/api/plans-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setPlansSettings({
            pageTitle: data.pageTitle || 'Beat Licensing Plans',
            pageSubtitle: data.pageSubtitle || 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.',
            basicPlan: data.basicPlan || {
              name: 'Basic License',
              price: 29,
              description: 'Perfect for independent artists and small projects',
              features: [
                'Commercial use rights',
                'Up to 5,000 copies',
                'Streaming on all platforms',
                'Radio play up to 1M listeners',
                'Music video rights',
                'Social media promotion',
                '1 year license term',
                'Email support'
              ],
              isActive: true
            },
            premiumPlan: data.premiumPlan || {
              name: 'Premium License',
              price: 99,
              description: 'Ideal for established artists and larger projects',
              features: [
                'Everything in Basic License',
                'Up to 50,000 copies',
                'Radio play unlimited',
                'TV and film synchronization',
                'Live performance rights',
                'Remix and adaptation rights',
                'Priority support',
                '3 year license term',
                'Custom contract available'
              ],
              isActive: true,
              isPopular: true
            },
            exclusivePlan: data.exclusivePlan || {
              name: 'Exclusive Rights',
              price: 999,
              description: 'Complete ownership and exclusive rights to the beat',
              features: [
                'Complete ownership of the beat',
                'Unlimited commercial use',
                'Unlimited copies and streams',
                'Full publishing rights',
                'Master recording ownership',
                'Exclusive to you forever',
                'No attribution required',
                'Priority support',
                'Custom contract',
                'Beat removed from store',
                'Stems and project files included'
              ],
              isActive: true
            },
            additionalFeaturesTitle: data.additionalFeaturesTitle || 'Why Choose BeatBazaar?',
            additionalFeatures: data.additionalFeatures || [
              {
                title: 'Legal Protection',
                description: 'All licenses come with legal documentation and protection',
                icon: 'Shield'
              },
              {
                title: 'Artist Support',
                description: 'Dedicated support team to help with your music career',
                icon: 'Users'
              },
              {
                title: 'Instant Download',
                description: 'Get your beats immediately after purchase',
                icon: 'Download'
              },
              {
                title: 'High Quality',
                description: 'Professional studio quality beats and stems',
                icon: 'Headphones'
              }
            ],
            faqSection: data.faqSection || {
              title: 'Frequently Asked Questions',
              questions: [
                {
                  question: "What's the difference between Basic and Premium licenses?",
                  answer: 'Basic licenses are perfect for independent artists with limited distribution. Premium licenses offer higher copy limits, TV/film rights, and longer terms for established artists.'
                },
                {
                  question: 'What does "Exclusive Rights" mean?',
                  answer: 'With exclusive rights, you own the beat completely. It\'s removed from our store, you get all stems and project files, and no one else can use it. You have full creative and commercial control.'
                },
                {
                  question: 'Do I need to credit the producer?',
                  answer: 'For Basic and Premium licenses, crediting is appreciated but not required. With Exclusive Rights, no attribution is needed as you own the beat completely.'
                }
              ]
            },
            trustBadges: data.trustBadges || [
              {
                text: 'Legal Protection Included',
                icon: 'Shield'
              },
              {
                text: 'Instant Download',
                icon: 'Zap'
              },
              {
                text: '24/7 Support',
                icon: 'Users'
              }
            ]
          });
        }
      })
      .catch(error => {
        console.error('Failed to load plans settings:', error);
      });

    // Load app branding settings from API
    fetch('/api/app-branding-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAppBrandingSettings({
            appName: data.appName || 'BeatBazaar',
            appLogo: data.appLogo || '',
            heroTitle: data.heroTitle || 'Discover Your Sound',
            heroSubtitle: data.heroSubtitle || 'Premium beats for every artist. Find your perfect sound and bring your music to life.',
            heroImage: data.heroImage || '',
            heroButtonText: data.heroButtonText || 'Start Creating',
            heroButtonLink: data.heroButtonLink || '/beats',
            loginTitle: data.loginTitle || 'Welcome Back',
            loginSubtitle: data.loginSubtitle || 'Sign in to your account to continue',
            loginImage: data.loginImage || ''
          });
        }
      })
      .catch(error => {
        console.error('Failed to load app branding settings:', error);
      });

    // Load artist bios from API
    fetch('/api/artist-bios', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArtistBios(data);
        }
      })
      .catch(error => {
        console.error('Failed to load artist bios:', error);
      });

    // Load home settings from API
    fetch('/api/home-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setHomeSettings({
            title: data.title || 'Premium Beats for Your Next Hit',
            description: data.description || 'Discover high-quality beats crafted by professional producers.',
            feature1: data.feature1 || 'Instant download after purchase',
            feature2: data.feature2 || 'High-quality WAV & MP3 files',
            feature3: data.feature3 || 'Professional mixing and mastering',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop'
          });
        }
      })
      .catch(error => {
        console.error('Failed to load home settings:', error);
      });
  }, []);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: PaymentSettings) => {
      // In a real app, this would save to the backend
      localStorage.setItem('payment-settings', JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Configurations have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (newEmailSettings: EmailSettings) => {
      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEmailSettings),
      });
      if (!response.ok) throw new Error('Failed to save email settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Settings Saved",
        description: "Email configuration has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (testEmail: string) => {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          testEmail,
          emailSettings 
        }),
      });
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "A test email has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const saveContactSettingsMutation = useMutation({
    mutationFn: async (contactSettingsData: typeof contactSettings) => {
      console.log('Saving contact settings:', contactSettingsData);
      const response = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactSettingsData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Contact settings save failed:', response.status, errorText);
        throw new Error(`Failed to save contact settings: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the contact settings cache
      queryClient.invalidateQueries({ queryKey: ['/api/contact-settings'] });
      toast({
        title: "Contact Settings Saved",
        description: "Your contact page settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Contact settings save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save contact settings",
        variant: "destructive",
      });
    },
  });

  const savePlansSettingsMutation = useMutation({
    mutationFn: async (plansSettingsData: PlansSettings) => {
      const response = await fetch('/api/admin/plans-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(plansSettingsData),
      });
      if (!response.ok) throw new Error('Failed to save plans settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plans Settings Saved",
        description: "Your plans page settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save plans settings",
        variant: "destructive",
      });
    },
  });

  const saveAppBrandingSettingsMutation = useMutation({
    mutationFn: async (brandingSettingsData: AppBrandingSettings) => {
      const response = await fetch('/api/admin/app-branding-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(brandingSettingsData),
      });
      if (!response.ok) throw new Error('Failed to save app branding settings');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the app branding settings cache
      queryClient.invalidateQueries({ queryKey: ['/api/app-branding-settings'] });
      toast({
        title: "App Branding Saved",
        description: "Your app branding settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save app branding settings",
        variant: "destructive",
      });
    },
  });

  const saveHomeSettingsMutation = useMutation({
    mutationFn: async (homeSettingsData: typeof homeSettings) => {
      const response = await fetch('/api/home-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(homeSettingsData),
      });
      if (!response.ok) throw new Error('Failed to save home settings');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the home settings cache so the Home page updates
      queryClient.invalidateQueries({ queryKey: ['/api/home-settings'] });
      toast({
        title: "Home Settings Saved",
        description: "Your home page settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save home settings",
        variant: "destructive",
      });
    },
  });


  const createArtistBioMutation = useMutation({
    mutationFn: async (bioData: typeof bioFormData) => {
      const response = await fetch('/api/admin/artist-bios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bioData),
      });
      if (!response.ok) throw new Error('Failed to create artist bio');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artist Bio Created",
        description: "Artist bio has been created successfully",
      });
      setShowBioDialog(false);
      setBioFormData({
        name: '',
        imageUrl: '',
        bio: '',
        role: 'Artist',
        socialLinks: { instagram: '', twitter: '', youtube: '', spotify: '' },
        isActive: true,
        sortOrder: 0
      });
      // Reload artist bios
      fetch('/api/artist-bios', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setArtistBios(data));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create artist bio",
        variant: "destructive",
      });
    },
  });

  const updateArtistBioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof bioFormData }) => {
      const response = await fetch(`/api/admin/artist-bios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update artist bio');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artist Bio Updated",
        description: "Artist bio has been updated successfully",
      });
      setShowBioDialog(false);
      setEditingBio(null);
      setBioFormData({
        name: '',
        imageUrl: '',
        bio: '',
        role: 'Artist',
        socialLinks: { instagram: '', twitter: '', youtube: '', spotify: '' },
        isActive: true,
        sortOrder: 0
      });
      // Reload artist bios
      fetch('/api/artist-bios', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setArtistBios(data));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update artist bio",
        variant: "destructive",
      });
    },
  });

  const deleteArtistBioMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/artist-bios/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete artist bio');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artist Bio Deleted",
        description: "Artist bio has been deleted successfully",
      });
      // Reload artist bios
      fetch('/api/artist-bios', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setArtistBios(data));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete artist bio",
        variant: "destructive",
      });
    },
  });

  // User Management State
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'client'
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });


  const migrateCustomersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/migrate-customers', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to migrate customers');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Migration Complete",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to migrate customers",
        variant: "destructive",
      });
    },
  });

  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [databaseCounts, setDatabaseCounts] = useState<any>(null);

  const checkDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reset-database/check', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to check database');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setDatabaseCounts(data);
      setShowResetConfirmDialog(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check database",
        variant: "destructive",
      });
    },
  });

  const resetDatabaseMutation = useMutation({
    mutationFn: async (confirmed: boolean) => {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmed }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset database');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Database Reset Complete",
        description: data.message,
      });
      setShowResetConfirmDialog(false);
      // Reload the page after reset
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset database",
        variant: "destructive",
      });
    },
  });

  // User Management Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      // Force admin role for user management
      const adminUserData = { ...userData, role: 'admin' };
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adminUserData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowUserDialog(false);
      resetUserForm();
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<UserFormData> }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowUserDialog(false);
      resetUserForm();
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
    saveEmailSettingsMutation.mutate(emailSettings);
    saveContactSettingsMutation.mutate(contactSettings);
    saveAppBrandingSettingsMutation.mutate(appBrandingSettings);
  };

  const updateEmailSetting = (key: keyof EmailSettings, value: any) => {
    setEmailSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePaypalSetting = (key: keyof PaymentSettings['paypal'], value: any) => {
    setSettings(prev => ({
      ...prev,
      paypal: {
        ...prev.paypal,
        [key]: value
      }
    }));
  };

  const updateBankSetting = (key: keyof PaymentSettings['bank'], value: any) => {
    setSettings(prev => ({
      ...prev,
      bank: {
        ...prev.bank,
        [key]: value
      }
    }));
  };

  const updateStripeSetting = (key: keyof NonNullable<PaymentSettings['stripe']>, value: any) => {
    const defaultStripe: NonNullable<PaymentSettings['stripe']> = {
      enabled: false,
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      testMode: false
    };

    setSettings(prev => {
      const stripe = prev.stripe ? { ...prev.stripe } : { ...defaultStripe };
      // dynamic key assignment: narrow to any for assignment
      (stripe as any)[key] = value;
      return { ...prev, stripe };
    });
  };

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      email: '',
      password: '',
      role: 'client'
    });
    setEditingUser(null);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ background: themeColors.background }}
    >
      <div className="w-full px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Configure settings 
          </p>
        </div>

        {/* Responsive Navigation */}
        <div className="mb-6">
          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <nav className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile/Tablet Navigation */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                {(() => {
                  const activeItem = menuItems.find(item => item.id === activeTab);
                  const Icon = activeItem?.icon || Settings;
                  return (
                    <>
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{activeItem?.label || 'Settings'}</span>
                    </>
                  );
                })()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="gap-2"
              >
                {isMobileMenuOpen ? (
                  <>
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Close</span>
                  </>
                ) : (
                  <>
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Menu</span>
                  </>
                )}
              </Button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="mt-2 bg-background border rounded-lg shadow-lg">
                <div className="p-2 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">

          {/* Site Settings */}
          {activeTab === "site-settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    Site Settings
                  </h2>
                  <p style={{ color: themeColors.textSecondary }}>
                    Configure your site branding, pages, and content
                  </p>
                </div>
              </div>

              <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                  <TabsTrigger value="branding" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="homepage" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Homepage
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="plans" className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Plans
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="flex items-center gap-2">
                    <Users2 className="h-4 w-4" />
                    Artists
                  </TabsTrigger>
                </TabsList>

                {/* App Branding Tab */}
                <TabsContent value="branding" className="space-y-6 mt-6">
                  {/* App Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        App Information
                      </CardTitle>
                      <CardDescription>
                        Configure your app name and logo that will appear throughout the application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appName">App Name</Label>
                          <Input
                            id="appName"
                            value={appBrandingSettings.appName}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, appName: e.target.value }))}
                            placeholder="Enter your app name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appLogo">App Logo URL</Label>
                          <Input
                            id="appLogo"
                            value={appBrandingSettings.appLogo}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, appLogo: e.target.value }))}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hero Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Hero Section
                      </CardTitle>
                      <CardDescription>
                        Customize the main hero section on your homepage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="heroTitle">Hero Title</Label>
                          <Input
                            id="heroTitle"
                            value={appBrandingSettings.heroTitle}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                            placeholder="Enter hero title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                          <Textarea
                            id="heroSubtitle"
                            value={appBrandingSettings.heroSubtitle}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                            placeholder="Enter hero subtitle"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heroImage">Hero Image URL</Label>
                          <Input
                            id="heroImage"
                            value={appBrandingSettings.heroImage}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, heroImage: e.target.value }))}
                            placeholder="https://example.com/hero-image.jpg"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="heroButtonText">Button Text</Label>
                            <Input
                              id="heroButtonText"
                              value={appBrandingSettings.heroButtonText}
                              onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, heroButtonText: e.target.value }))}
                              placeholder="Enter button text"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="heroButtonLink">Button Link</Label>
                            <Input
                              id="heroButtonLink"
                              value={appBrandingSettings.heroButtonLink}
                              onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, heroButtonLink: e.target.value }))}
                              placeholder="/beats"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Login Page */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Login Page
                      </CardTitle>
                      <CardDescription>
                        Customize the login page appearance and content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="loginTitle">Login Title</Label>
                          <Input
                            id="loginTitle"
                            value={appBrandingSettings.loginTitle}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, loginTitle: e.target.value }))}
                            placeholder="Enter login title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loginSubtitle">Login Subtitle</Label>
                          <Input
                            id="loginSubtitle"
                            value={appBrandingSettings.loginSubtitle}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, loginSubtitle: e.target.value }))}
                            placeholder="Enter login subtitle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loginImage">Login Image URL</Label>
                          <Input
                            id="loginImage"
                            value={appBrandingSettings.loginImage}
                            onChange={(e) => setAppBrandingSettings(prev => ({ ...prev, loginImage: e.target.value }))}
                            placeholder="https://example.com/login-image.jpg"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Homepage Settings Tab */}
                <TabsContent value="homepage" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Featured Section
                      </CardTitle>
                      <CardDescription>
                        Customize the featured section on your home page with title, description, features, and image
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="home-title">Section Title</Label>
                          <Input
                            id="home-title"
                            value={homeSettings.title}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Premium Beats for Your Next Hit"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="home-description">Section Description</Label>
                          <Textarea
                            id="home-description"
                            value={homeSettings.description}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Discover high-quality beats crafted by professional producers."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="home-feature1">Feature 1</Label>
                          <Input
                            id="home-feature1"
                            value={homeSettings.feature1}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, feature1: e.target.value }))}
                            placeholder="Instant download after purchase"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="home-feature2">Feature 2</Label>
                          <Input
                            id="home-feature2"
                            value={homeSettings.feature2}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, feature2: e.target.value }))}
                            placeholder="High-quality WAV & MP3 files"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="home-feature3">Feature 3</Label>
                          <Input
                            id="home-feature3"
                            value={homeSettings.feature3}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, feature3: e.target.value }))}
                            placeholder="Professional mixing and mastering"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="home-image">Featured Image URL</Label>
                          <Input
                            id="home-image"
                            value={homeSettings.imageUrl}
                            onChange={(e) => setHomeSettings(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop"
                          />
                        </div>
                        {homeSettings.imageUrl && (
                          <div className="mt-4">
                            <Label>Image Preview</Label>
                            <div className="mt-2 rounded-lg overflow-hidden border max-w-md">
                              <img
                                src={homeSettings.imageUrl}
                                alt="Featured section preview"
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%236366f1'/%3E%3Ctext x='300' y='200' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3EImage not found%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="pt-4">
                        <Button 
                          onClick={() => saveHomeSettingsMutation.mutate(homeSettings)}
                          disabled={saveHomeSettingsMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveHomeSettingsMutation.isPending ? 'Saving...' : 'Save Home Settings'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Page Tab */}
                <TabsContent value="contact" className="space-y-6 mt-6">
                  {/* Band Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Band Information
                      </CardTitle>
                      <CardDescription>
                        Configure the band image and name displayed on the contact page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="band-name">Band Name</Label>
                          <Input
                            id="band-name"
                            value={contactSettings.bandName}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, bandName: e.target.value }))}
                            placeholder="Enter band name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="band-image">Band Image URL</Label>
                          <Input
                            id="band-image"
                            value={contactSettings.bandImageUrl}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, bandImageUrl: e.target.value }))}
                            placeholder="https://example.com/band-image.jpg"
                          />
                        </div>
                      </div>
                      {contactSettings.bandImageUrl && (
                        <div className="mt-4">
                          <Label>Preview</Label>
                          <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                            <img
                              src={contactSettings.bandImageUrl}
                              alt="Band Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%236366f1'/%3E%3Ctext x='64' y='70' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                      <CardDescription>
                        Configure contact details displayed on the contact page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Email</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactSettings.contactEmail}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder="contact@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-phone">Phone</Label>
                          <Input
                            id="contact-phone"
                            value={contactSettings.contactPhone}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-address">Address</Label>
                        <Input
                          id="contact-address"
                          value={contactSettings.contactAddress}
                          onChange={(e) => setContactSettings(prev => ({ ...prev, contactAddress: e.target.value }))}
                          placeholder="123 Music Street"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-city">City</Label>
                          <Input
                            id="contact-city"
                            value={contactSettings.contactCity}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactCity: e.target.value }))}
                            placeholder="Los Angeles"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-state">State</Label>
                          <Input
                            id="contact-state"
                            value={contactSettings.contactState}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactState: e.target.value }))}
                            placeholder="CA"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-zip">ZIP Code</Label>
                          <Input
                            id="contact-zip"
                            value={contactSettings.contactZipCode}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactZipCode: e.target.value }))}
                            placeholder="90210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-country">Country</Label>
                          <Input
                            id="contact-country"
                            value={contactSettings.contactCountry}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, contactCountry: e.target.value }))}
                            placeholder="USA"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Facebook className="h-5 w-5" />
                        Social Media Links
                      </CardTitle>
                      <CardDescription>
                        Configure social media links that will appear as buttons on the contact page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="facebook-url">Facebook URL</Label>
                          <Input
                            id="facebook-url"
                            type="url"
                            value={contactSettings.facebookUrl}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                            placeholder="https://facebook.com/yourpage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagram-url">Instagram URL</Label>
                          <Input
                            id="instagram-url"
                            type="url"
                            value={contactSettings.instagramUrl}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                            placeholder="https://instagram.com/yourpage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter-url">Twitter URL</Label>
                          <Input
                            id="twitter-url"
                            type="url"
                            value={contactSettings.twitterUrl}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, twitterUrl: e.target.value }))}
                            placeholder="https://twitter.com/yourpage"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube-url">YouTube URL</Label>
                          <Input
                            id="youtube-url"
                            type="url"
                            value={contactSettings.youtubeUrl}
                            onChange={(e) => setContactSettings(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                            placeholder="https://youtube.com/yourchannel"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Preview</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          These links will appear as buttons on the contact page:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {contactSettings.facebookUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              style={{
                                backgroundColor: themeColors.primary,
                                color: 'white',
                                borderColor: themeColors.primary
                              }}
                            >
                              <Facebook className="h-4 w-4 mr-2" />
                              Facebook
                            </Button>
                          )}
                          {contactSettings.instagramUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              style={{
                                background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.accent})`,
                                color: 'white',
                                borderColor: themeColors.primary
                              }}
                            >
                              <Instagram className="h-4 w-4 mr-2" />
                              Instagram
                            </Button>
                          )}
                          {contactSettings.twitterUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              style={{
                                backgroundColor: themeColors.primary,
                                color: 'white',
                                borderColor: themeColors.primary
                              }}
                            >
                              <Twitter className="h-4 w-4 mr-2" />
                              Twitter
                            </Button>
                          )}
                          {contactSettings.youtubeUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderColor: '#ef4444'
                              }}
                            >
                              <Youtube className="h-4 w-4 mr-2" />
                              YouTube
                            </Button>
                          )}
                          {!contactSettings.facebookUrl && !contactSettings.instagramUrl && !contactSettings.twitterUrl && !contactSettings.youtubeUrl && (
                            <p className="text-sm text-muted-foreground">No social media links configured</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </TabsContent>

                {/* Plans Page Tab */}
                <TabsContent value="plans" className="space-y-6 mt-6">
                  {/* Page Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Page Settings
                      </CardTitle>
                      <CardDescription>
                        Configure the main page title and subtitle for the plans page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plans-title">Page Title</Label>
                        <Input
                          id="plans-title"
                          value={plansSettings.pageTitle}
                          onChange={(e) => setPlansSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                          placeholder="Beat Licensing Plans"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plans-subtitle">Page Subtitle</Label>
                        <Textarea
                          id="plans-subtitle"
                          value={plansSettings.pageSubtitle}
                          onChange={(e) => setPlansSettings(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                          placeholder="Choose the perfect licensing plan for your music project."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Plan</CardTitle>
                      <CardDescription>Configure the basic licensing plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="basic-name">Plan Name</Label>
                          <Input
                            id="basic-name"
                            value={plansSettings.basicPlan.name}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              basicPlan: { ...prev.basicPlan, name: e.target.value }
                            }))}
                            placeholder="Basic License"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="basic-price">Price ($)</Label>
                          <Input
                            id="basic-price"
                            type="number"
                            value={plansSettings.basicPlan.price}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              basicPlan: { ...prev.basicPlan, price: parseInt(e.target.value) || 0 }
                            }))}
                            placeholder="29"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="basic-description">Description</Label>
                        <Textarea
                          id="basic-description"
                          value={plansSettings.basicPlan.description}
                          onChange={(e) => setPlansSettings(prev => ({ 
                            ...prev, 
                            basicPlan: { ...prev.basicPlan, description: e.target.value }
                          }))}
                          placeholder="Perfect for independent artists and small projects"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="basic-active"
                          checked={plansSettings.basicPlan.isActive}
                          onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                            ...prev, 
                            basicPlan: { ...prev.basicPlan, isActive: checked }
                          }))}
                        />
                        <Label htmlFor="basic-active">Active</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Premium Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Premium Plan</CardTitle>
                      <CardDescription>Configure the premium licensing plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="premium-name">Plan Name</Label>
                          <Input
                            id="premium-name"
                            value={plansSettings.premiumPlan.name}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              premiumPlan: { ...prev.premiumPlan, name: e.target.value }
                            }))}
                            placeholder="Premium License"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="premium-price">Price ($)</Label>
                          <Input
                            id="premium-price"
                            type="number"
                            value={plansSettings.premiumPlan.price}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              premiumPlan: { ...prev.premiumPlan, price: parseInt(e.target.value) || 0 }
                            }))}
                            placeholder="99"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="premium-description">Description</Label>
                        <Textarea
                          id="premium-description"
                          value={plansSettings.premiumPlan.description}
                          onChange={(e) => setPlansSettings(prev => ({ 
                            ...prev, 
                            premiumPlan: { ...prev.premiumPlan, description: e.target.value }
                          }))}
                          placeholder="Ideal for established artists and larger projects"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="premium-active"
                            checked={plansSettings.premiumPlan.isActive}
                            onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                              ...prev, 
                              premiumPlan: { ...prev.premiumPlan, isActive: checked }
                            }))}
                          />
                          <Label htmlFor="premium-active">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="premium-popular"
                            checked={plansSettings.premiumPlan.isPopular}
                            onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                              ...prev, 
                              premiumPlan: { ...prev.premiumPlan, isPopular: checked }
                            }))}
                          />
                          <Label htmlFor="premium-popular">Popular</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exclusive Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Exclusive Plan</CardTitle>
                      <CardDescription>Configure the exclusive licensing plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="exclusive-name">Plan Name</Label>
                          <Input
                            id="exclusive-name"
                            value={plansSettings.exclusivePlan.name}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              exclusivePlan: { ...prev.exclusivePlan, name: e.target.value }
                            }))}
                            placeholder="Exclusive Rights"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="exclusive-price">Price ($)</Label>
                          <Input
                            id="exclusive-price"
                            type="number"
                            value={plansSettings.exclusivePlan.price}
                            onChange={(e) => setPlansSettings(prev => ({ 
                              ...prev, 
                              exclusivePlan: { ...prev.exclusivePlan, price: parseInt(e.target.value) || 0 }
                            }))}
                            placeholder="999"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exclusive-description">Description</Label>
                        <Textarea
                          id="exclusive-description"
                          value={plansSettings.exclusivePlan.description}
                          onChange={(e) => setPlansSettings(prev => ({ 
                            ...prev, 
                            exclusivePlan: { ...prev.exclusivePlan, description: e.target.value }
                          }))}
                          placeholder="Complete ownership and exclusive rights to the beat"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="exclusive-active"
                          checked={plansSettings.exclusivePlan.isActive}
                          onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                            ...prev, 
                            exclusivePlan: { ...prev.exclusivePlan, isActive: checked }
                          }))}
                        />
                        <Label htmlFor="exclusive-active">Active</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Additional Features Section
                      </CardTitle>
                      <CardDescription>
                        Configure the "Why Choose BeatBazaar?" section
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="additional-features-title">Section Title</Label>
                        <Input
                          id="additional-features-title"
                          value={plansSettings.additionalFeaturesTitle}
                          onChange={(e) => setPlansSettings(prev => ({ ...prev, additionalFeaturesTitle: e.target.value }))}
                          placeholder="Why Choose BeatBazaar?"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>Features</Label>
                        {plansSettings.additionalFeatures.map((feature, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                            <div className="space-y-2">
                              <Label htmlFor={`feature-title-${index}`}>Title</Label>
                              <Input
                                id={`feature-title-${index}`}
                                value={feature.title}
                                onChange={(e) => {
                                  const newFeatures = [...plansSettings.additionalFeatures];
                                  newFeatures[index] = { ...feature, title: e.target.value };
                                  setPlansSettings(prev => ({ ...prev, additionalFeatures: newFeatures }));
                                }}
                                placeholder="Feature Title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`feature-description-${index}`}>Description</Label>
                              <Input
                                id={`feature-description-${index}`}
                                value={feature.description}
                                onChange={(e) => {
                                  const newFeatures = [...plansSettings.additionalFeatures];
                                  newFeatures[index] = { ...feature, description: e.target.value };
                                  setPlansSettings(prev => ({ ...prev, additionalFeatures: newFeatures }));
                                }}
                                placeholder="Feature Description"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`feature-icon-${index}`}>Icon</Label>
                              <Input
                                id={`feature-icon-${index}`}
                                value={feature.icon}
                                onChange={(e) => {
                                  const newFeatures = [...plansSettings.additionalFeatures];
                                  newFeatures[index] = { ...feature, icon: e.target.value };
                                  setPlansSettings(prev => ({ ...prev, additionalFeatures: newFeatures }));
                                }}
                                placeholder="Shield, Users, Download, etc."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        FAQ Section
                      </CardTitle>
                      <CardDescription>
                        Configure frequently asked questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="faq-title">Section Title</Label>
                        <Input
                          id="faq-title"
                          value={plansSettings.faqSection.title}
                          onChange={(e) => setPlansSettings(prev => ({ 
                            ...prev, 
                            faqSection: { ...prev.faqSection, title: e.target.value }
                          }))}
                          placeholder="Frequently Asked Questions"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>Questions & Answers</Label>
                        {plansSettings.faqSection.questions.map((faq, index) => (
                          <div key={index} className="space-y-4 p-4 border rounded-lg">
                            <div className="space-y-2">
                              <Label htmlFor={`faq-question-${index}`}>Question</Label>
                              <Input
                                id={`faq-question-${index}`}
                                value={faq.question}
                                onChange={(e) => {
                                  const newQuestions = [...plansSettings.faqSection.questions];
                                  newQuestions[index] = { ...faq, question: e.target.value };
                                  setPlansSettings(prev => ({ 
                                    ...prev, 
                                    faqSection: { ...prev.faqSection, questions: newQuestions }
                                  }));
                                }}
                                placeholder="What's the difference between Basic and Premium licenses?"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                              <Textarea
                                id={`faq-answer-${index}`}
                                value={faq.answer}
                                onChange={(e) => {
                                  const newQuestions = [...plansSettings.faqSection.questions];
                                  newQuestions[index] = { ...faq, answer: e.target.value };
                                  setPlansSettings(prev => ({ 
                                    ...prev, 
                                    faqSection: { ...prev.faqSection, questions: newQuestions }
                                  }));
                                }}
                                placeholder="Basic licenses are perfect for independent artists..."
                                rows={3}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Badges */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Trust Badges
                      </CardTitle>
                      <CardDescription>
                        Configure trust badges displayed on the plans page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plansSettings.trustBadges.map((badge, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor={`badge-text-${index}`}>Badge Text</Label>
                            <Input
                              id={`badge-text-${index}`}
                              value={badge.text}
                              onChange={(e) => {
                                const newBadges = [...plansSettings.trustBadges];
                                newBadges[index] = { ...badge, text: e.target.value };
                                setPlansSettings(prev => ({ ...prev, trustBadges: newBadges }));
                              }}
                              placeholder="Legal Protection Included"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`badge-icon-${index}`}>Icon</Label>
                            <Input
                              id={`badge-icon-${index}`}
                              value={badge.icon}
                              onChange={(e) => {
                                const newBadges = [...plansSettings.trustBadges];
                                newBadges[index] = { ...badge, icon: e.target.value };
                                setPlansSettings(prev => ({ ...prev, trustBadges: newBadges }));
                              }}
                              placeholder="Shield, Zap, Users, etc."
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => savePlansSettingsMutation.mutate(plansSettings)}
                      disabled={savePlansSettingsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savePlansSettingsMutation.isPending ? "Saving..." : "Save Plans Settings"}
                    </Button>
                  </div>
                </TabsContent>

                {/* Artist Bios Tab */}
                <TabsContent value="artists" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Artist Bios</CardTitle>
                        <CardDescription>Manage artist profiles and biographies</CardDescription>
                      </div>
                      <Button onClick={() => setShowBioDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Artist
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {artistBios.map((bio: any) => (
                            <TableRow key={bio.id}>
                              <TableCell>
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                  <img
                                    src={bio.imageUrl}
                                    alt={bio.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{bio.name}</TableCell>
                              <TableCell>{bio.role}</TableCell>
                              <TableCell>
                                <Badge variant={bio.isActive ? "default" : "secondary"}>
                                  {bio.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingBio(bio);
                                      setBioFormData({
                                        name: bio.name,
                                        imageUrl: bio.imageUrl,
                                        bio: bio.bio,
                                        role: bio.role,
                                        socialLinks: bio.socialLinks || { instagram: '', twitter: '', youtube: '', spotify: '' },
                                        isActive: bio.isActive,
                                        sortOrder: typeof bio.sortOrder === 'number' ? bio.sortOrder : 0
                                      });
                                      setShowBioDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteArtistBioMutation.mutate(bio.id)}
                                    disabled={deleteArtistBioMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Banner Creator */}
          {activeTab === "banner-creator" && (
            <HeroBannerCreator />
          )}

          {/* Payment Settings */}
          {activeTab === "payment-settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    Payment Settings
                  </h2>
                  <p style={{ color: themeColors.textSecondary }}>
                    Configure payment methods and processing options
                  </p>
                </div>
              </div>

              <Tabs defaultValue="paypal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                  <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                </TabsList>

                <TabsContent value="paypal">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        PayPal Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure PayPal payment processing settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable PayPal Payments</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow customers to pay using PayPal
                          </p>
                        </div>
                        <Switch
                          checked={settings.paypal.enabled}
                          onCheckedChange={(checked) => updatePaypalSetting('enabled', checked)}
                        />
                      </div>

                      {settings.paypal.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="paypal-client-id">Client ID *</Label>
                              <Input
                                id="paypal-client-id"
                                type="text"
                                value={settings.paypal.clientId}
                                onChange={(e) => updatePaypalSetting('clientId', e.target.value)}
                                placeholder="Enter PayPal Client ID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="paypal-environment">Environment *</Label>
                              <select
                                id="paypal-environment"
                                value={settings.paypal.environment}
                                onChange={(e) => updatePaypalSetting('environment', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="live">Live (Production)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="paypal-client-secret">Client Secret *</Label>
                            <div className="relative">
                              <Input
                                id="paypal-client-secret"
                                type={showSecrets ? "text" : "password"}
                                value={settings.paypal.clientSecret}
                                onChange={(e) => updatePaypalSetting('clientSecret', e.target.value)}
                                placeholder="Enter PayPal Client Secret"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowSecrets(!showSecrets)}
                              >
                                {showSecrets ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="paypal-webhook-id">Webhook ID</Label>
                            <Input
                              id="paypal-webhook-id"
                              type="text"
                              value={settings.paypal.webhookId}
                              onChange={(e) => updatePaypalSetting('webhookId', e.target.value)}
                              placeholder="Enter PayPal Webhook ID (optional)"
                            />
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  PayPal Setup Instructions
                                </p>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                  <li>• Create a PayPal Developer account at developer.paypal.com</li>
                                  <li>• Create a new application to get your Client ID and Secret</li>
                                  <li>• Use Sandbox for testing, Live for production</li>
                                  <li>• Configure webhooks for payment notifications</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stripe">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Stripe Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure Stripe payment processing settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Stripe</Label>
                          <p className="text-sm text-muted-foreground">Allow customers to pay using Stripe</p>
                        </div>
                        <Switch
                          checked={!!settings.stripe?.enabled}
                          onCheckedChange={(checked) => updateStripeSetting('enabled', checked)}
                        />
                      </div>

                      {settings.stripe?.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="stripe-publishable">Publishable Key *</Label>
                              <Input
                                id="stripe-publishable"
                                type="text"
                                value={settings.stripe?.publishableKey || ''}
                                onChange={(e) => updateStripeSetting('publishableKey', e.target.value)}
                                placeholder="pk_test_..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="stripe-currency">Currency</Label>
                              <Input
                                id="stripe-currency"
                                type="text"
                                value={settings.stripe?.currency || 'usd'}
                                onChange={(e) => updateStripeSetting('currency', e.target.value)}
                                placeholder="usd"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripe-secret">Secret Key *</Label>
                            <div className="relative">
                              <Input
                                id="stripe-secret"
                                type={showSecrets ? 'text' : 'password'}
                                value={settings.stripe?.secretKey || ''}
                                onChange={(e) => updateStripeSetting('secretKey', e.target.value)}
                                placeholder="sk_test_..."
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowSecrets(!showSecrets)}
                              >
                                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripe-webhook">Webhook Signing Secret</Label>
                            <Input
                              id="stripe-webhook"
                              type="text"
                              value={settings.stripe?.webhookSecret || ''}
                              onChange={(e) => updateStripeSetting('webhookSecret', e.target.value)}
                              placeholder="whsec_..."
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="stripe-test-mode"
                              checked={!!settings.stripe?.testMode}
                              onCheckedChange={(checked) => updateStripeSetting('testMode', checked)}
                            />
                            <Label htmlFor="stripe-test-mode">Test Mode</Label>
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Stripe Setup Instructions</p>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                  <li>• Create a Stripe account at dashboard.stripe.com</li>
                                  <li>• Get your Publishable and Secret keys from Developers → API keys</li>
                                  <li>• Use test keys for development and live keys in production</li>
                                  <li>• Configure a webhook endpoint for <code>payment_intent.succeeded</code></li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bank">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Bank Account Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure bank account details for wire transfers and ACH payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Bank Transfers</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow customers to pay via bank transfer
                          </p>
                        </div>
                        <Switch
                          checked={settings.bank.enabled}
                          onCheckedChange={(checked) => updateBankSetting('enabled', checked)}
                        />
                      </div>

                      {settings.bank.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="bank-name">Bank Name *</Label>
                              <Input
                                id="bank-name"
                                type="text"
                                value={settings.bank.bankName}
                                onChange={(e) => updateBankSetting('bankName', e.target.value)}
                                placeholder="Enter bank name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="account-holder">Account Holder Name *</Label>
                              <Input
                                id="account-holder"
                                type="text"
                                value={settings.bank.accountHolderName}
                                onChange={(e) => updateBankSetting('accountHolderName', e.target.value)}
                                placeholder="Enter account holder name"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="account-number">Account Number *</Label>
                              <Input
                                id="account-number"
                                type="text"
                                value={settings.bank.accountNumber}
                                onChange={(e) => updateBankSetting('accountNumber', e.target.value)}
                                placeholder="Enter account number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="routing-number">Routing Number *</Label>
                              <Input
                                id="routing-number"
                                type="text"
                                value={settings.bank.routingNumber}
                                onChange={(e) => updateBankSetting('routingNumber', e.target.value)}
                                placeholder="Enter routing number"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bank-address">Bank Address *</Label>
                            <Textarea
                              id="bank-address"
                              value={settings.bank.bankAddress}
                              onChange={(e) => updateBankSetting('bankAddress', e.target.value)}
                              placeholder="Enter complete bank address"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="swift-code">SWIFT Code</Label>
                              <Input
                                id="swift-code"
                                type="text"
                                value={settings.bank.swiftCode}
                                onChange={(e) => updateBankSetting('swiftCode', e.target.value)}
                                placeholder="Enter SWIFT code (for international transfers)"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="transfer-instructions">Transfer Instructions</Label>
                            <Textarea
                              id="transfer-instructions"
                              value={settings.bank.instructions}
                              onChange={(e) => updateBankSetting('instructions', e.target.value)}
                              placeholder="Enter specific instructions for customers making bank transfers"
                              rows={4}
                            />
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  Security Notice
                                </p>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                  Bank account information is sensitive. Ensure this data is encrypted and stored securely.
                                  Consider using a secure payment processor for handling bank details.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === "email" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for password reset emails and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Email Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email functionality for password reset and notifications
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.enabled}
                    onCheckedChange={(checked) => updateEmailSetting('enabled', checked)}
                  />
                </div>

                {emailSettings.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host *</Label>
                        <Input
                          id="smtp-host"
                          type="text"
                          value={emailSettings.smtpHost}
                          onChange={(e) => updateEmailSetting('smtpHost', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port *</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={emailSettings.smtpPort}
                          onChange={(e) => updateEmailSetting('smtpPort', parseInt(e.target.value))}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-user">SMTP Username *</Label>
                        <Input
                          id="smtp-user"
                          type="text"
                          value={emailSettings.smtpUser}
                          onChange={(e) => updateEmailSetting('smtpUser', e.target.value)}
                          placeholder="your-email@gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-pass">SMTP Password *</Label>
                        <div className="relative">
                          <Input
                            id="smtp-pass"
                            type={showSecrets ? "text" : "password"}
                            value={emailSettings.smtpPass}
                            onChange={(e) => updateEmailSetting('smtpPass', e.target.value)}
                            placeholder="Enter SMTP password or app password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-name">From Name *</Label>
                        <Input
                          id="from-name"
                          type="text"
                          value={emailSettings.fromName}
                          onChange={(e) => updateEmailSetting('fromName', e.target.value)}
                          placeholder="BeatBazaar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-email">From Email *</Label>
                        <Input
                          id="from-email"
                          type="email"
                          value={emailSettings.fromEmail}
                          onChange={(e) => updateEmailSetting('fromEmail', e.target.value)}
                          placeholder="noreply@beatbazaar.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp-secure"
                        checked={emailSettings.smtpSecure}
                        onCheckedChange={(checked) => updateEmailSetting('smtpSecure', checked)}
                      />
                      <Label htmlFor="smtp-secure">Use SSL/TLS (usually for port 465)</Label>
                    </div>

                    {/* Test Email Section */}
                    <div className="border-t pt-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Test Email Configuration</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Send a test email to verify your SMTP configuration
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="email"
                            placeholder="test@example.com"
                            id="test-email"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              const testEmail = (document.getElementById('test-email') as HTMLInputElement)?.value;
                              if (testEmail) {
                                testEmailMutation.mutate(testEmail);
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Please enter a test email address",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={testEmailMutation.isPending}
                            className="gap-2 w-full sm:w-auto"
                          >
                            {testEmailMutation.isPending ? (
                              <>
                                <Send className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Sending...</span>
                                <span className="sm:hidden">Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                <span className="hidden sm:inline">Send Test Email</span>
                                <span className="sm:hidden">Send Test</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Email Setup Instructions
                          </p>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• <strong>Gmail:</strong> Use smtp.gmail.com:587, enable 2FA, and use an App Password</li>
                            <li>• <strong>Outlook:</strong> Use smtp-mail.outlook.com:587 with your regular password</li>
                            <li>• <strong>Yahoo:</strong> Use smtp.mail.yahoo.com:587 with an App Password</li>
                            <li>• <strong>Custom SMTP:</strong> Contact your email provider for SMTP settings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Settings */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              {/* Band Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Band Information
                  </CardTitle>
                  <CardDescription>
                    Configure the band image and name displayed on the contact page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="band-image-url">Band Image URL</Label>
                    <Input
                      id="band-image-url"
                      type="url"
                      value={contactSettings.bandImageUrl}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, bandImageUrl: e.target.value }))}
                      placeholder="https://example.com/band-image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="band-name">Band Name</Label>
                    <Input
                      id="band-name"
                      type="text"
                      value={contactSettings.bandName}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, bandName: e.target.value }))}
                      placeholder="BeatBazaar"
                    />
                  </div>
                  {contactSettings.bandImageUrl && (
                    <div className="mt-4">
                      <Label>Preview</Label>
                      <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                        <img
                          src={contactSettings.bandImageUrl}
                          alt="Band Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%236366f1'/%3E%3Ctext x='64' y='70' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Configure contact details displayed on the contact page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactSettings.contactEmail}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="contact@beatbazaar.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Contact Phone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={contactSettings.contactPhone}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-address">Address</Label>
                    <Input
                      id="contact-address"
                      type="text"
                      value={contactSettings.contactAddress}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, contactAddress: e.target.value }))}
                      placeholder="123 Music Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-city">City</Label>
                      <Input
                        id="contact-city"
                        type="text"
                        value={contactSettings.contactCity}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, contactCity: e.target.value }))}
                        placeholder="Los Angeles"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-state">State</Label>
                      <Input
                        id="contact-state"
                        type="text"
                        value={contactSettings.contactState}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, contactState: e.target.value }))}
                        placeholder="CA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-zip">Zip Code</Label>
                      <Input
                        id="contact-zip"
                        type="text"
                        value={contactSettings.contactZipCode}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, contactZipCode: e.target.value }))}
                        placeholder="90210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-country">Country</Label>
                    <Input
                      id="contact-country"
                      type="text"
                      value={contactSettings.contactCountry}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, contactCountry: e.target.value }))}
                      placeholder="USA"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Message Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message Settings
                  </CardTitle>
                  <CardDescription>
                    Configure contact form behavior and email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="message-enabled">Enable Contact Form</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow visitors to submit messages through the contact form
                      </p>
                    </div>
                    <Switch
                      id="message-enabled"
                      checked={contactSettings.messageEnabled}
                      onCheckedChange={(checked) => setContactSettings(prev => ({ ...prev, messageEnabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-subject">Email Subject Template</Label>
                    <Input
                      id="message-subject"
                      type="text"
                      value={contactSettings.messageSubject}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, messageSubject: e.target.value }))}
                      placeholder="New Contact Form Submission"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-template">Email Template</Label>
                    <Textarea
                      id="message-template"
                      rows={4}
                      value={contactSettings.messageTemplate}
                      onChange={(e) => setContactSettings(prev => ({ ...prev, messageTemplate: e.target.value }))}
                      placeholder="You have received a new message from your contact form."
                    />
                    <p className="text-sm text-muted-foreground">
                      Use placeholders: {"{name}"}, {"{email}"}, {"{subject}"}, {"{message}"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>
                    Configure social media links that will appear as buttons on the contact page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook-url">Facebook URL</Label>
                      <Input
                        id="facebook-url"
                        type="url"
                        value={contactSettings.facebookUrl}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram-url">Instagram URL</Label>
                      <Input
                        id="instagram-url"
                        type="url"
                        value={contactSettings.instagramUrl}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter-url">Twitter URL</Label>
                      <Input
                        id="twitter-url"
                        type="url"
                        value={contactSettings.twitterUrl}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, twitterUrl: e.target.value }))}
                        placeholder="https://twitter.com/yourpage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-url">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        type="url"
                        value={contactSettings.youtubeUrl}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                        placeholder="https://youtube.com/yourchannel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok-url">TikTok URL</Label>
                      <Input
                        id="tiktok-url"
                        type="url"
                        value={contactSettings.tiktokUrl}
                        onChange={(e) => setContactSettings(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                        placeholder="https://tiktok.com/@yourpage"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These links will appear as buttons on the contact page:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contactSettings.facebookUrl && (
                        <Button size="sm" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                          <Facebook className="h-4 w-4 mr-2" />
                          Facebook
                        </Button>
                      )}
                      {contactSettings.instagramUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          style={{
                            background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.accent})`,
                            color: 'white',
                            borderColor: themeColors.primary
                          }}
                        >
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                      )}
                      {contactSettings.twitterUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          style={{
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            borderColor: themeColors.primary
                          }}
                        >
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </Button>
                      )}
                      {contactSettings.youtubeUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderColor: '#ef4444'
                          }}
                        >
                          <Youtube className="h-4 w-4 mr-2" />
                          YouTube
                        </Button>
                      )}
                      {contactSettings.tiktokUrl && (
                        <Button size="sm" variant="outline" className="bg-black text-white hover:bg-gray-800">
                          <Music className="h-4 w-4 mr-2" />
                          TikTok
                        </Button>
                      )}
                      {!contactSettings.facebookUrl && !contactSettings.instagramUrl && !contactSettings.twitterUrl && !contactSettings.youtubeUrl && !contactSettings.tiktokUrl && (
                        <p className="text-sm text-muted-foreground">No social media links configured</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plans Settings */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              {/* Page Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Page Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the main page title and subtitle for the plans page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="page-title">Page Title</Label>
                    <Input
                      id="page-title"
                      value={plansSettings.pageTitle}
                      onChange={(e) => setPlansSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                      placeholder="Beat Licensing Plans"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-subtitle">Page Subtitle</Label>
                    <Textarea
                      id="page-subtitle"
                      value={plansSettings.pageSubtitle}
                      onChange={(e) => setPlansSettings(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                      placeholder="Choose the perfect licensing plan for your music project..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Basic Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Basic Plan
                  </CardTitle>
                  <CardDescription>
                    Configure the basic licensing plan details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basic-name">Plan Name</Label>
                      <Input
                        id="basic-name"
                        value={plansSettings.basicPlan.name}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          basicPlan: { ...prev.basicPlan, name: e.target.value }
                        }))}
                        placeholder="Basic License"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="basic-price">Price ($)</Label>
                      <Input
                        id="basic-price"
                        type="number"
                        value={plansSettings.basicPlan.price}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          basicPlan: { ...prev.basicPlan, price: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="29"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic-description">Description</Label>
                    <Textarea
                      id="basic-description"
                      value={plansSettings.basicPlan.description}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        basicPlan: { ...prev.basicPlan, description: e.target.value }
                      }))}
                      placeholder="Perfect for independent artists and small projects"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={plansSettings.basicPlan.features.join('\n')}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        basicPlan: { ...prev.basicPlan, features: e.target.value.split('\n').filter(f => f.trim()) }
                      }))}
                      placeholder="Commercial use rights&#10;Up to 5,000 copies&#10;Streaming on all platforms"
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="basic-active"
                      checked={plansSettings.basicPlan.isActive}
                      onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                        ...prev, 
                        basicPlan: { ...prev.basicPlan, isActive: checked }
                      }))}
                    />
                    <Label htmlFor="basic-active">Active</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Premium Plan
                  </CardTitle>
                  <CardDescription>
                    Configure the premium licensing plan details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="premium-name">Plan Name</Label>
                      <Input
                        id="premium-name"
                        value={plansSettings.premiumPlan.name}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          premiumPlan: { ...prev.premiumPlan, name: e.target.value }
                        }))}
                        placeholder="Premium License"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="premium-price">Price ($)</Label>
                      <Input
                        id="premium-price"
                        type="number"
                        value={plansSettings.premiumPlan.price}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          premiumPlan: { ...prev.premiumPlan, price: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="99"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premium-description">Description</Label>
                    <Textarea
                      id="premium-description"
                      value={plansSettings.premiumPlan.description}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        premiumPlan: { ...prev.premiumPlan, description: e.target.value }
                      }))}
                      placeholder="Ideal for established artists and larger projects"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={plansSettings.premiumPlan.features.join('\n')}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        premiumPlan: { ...prev.premiumPlan, features: e.target.value.split('\n').filter(f => f.trim()) }
                      }))}
                      placeholder="Everything in Basic License&#10;Up to 50,000 copies&#10;Radio play unlimited"
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="premium-active"
                        checked={plansSettings.premiumPlan.isActive}
                        onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                          ...prev, 
                          premiumPlan: { ...prev.premiumPlan, isActive: checked }
                        }))}
                      />
                      <Label htmlFor="premium-active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="premium-popular"
                        checked={plansSettings.premiumPlan.isPopular}
                        onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                          ...prev, 
                          premiumPlan: { ...prev.premiumPlan, isPopular: checked }
                        }))}
                      />
                      <Label htmlFor="premium-popular">Popular</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exclusive Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Exclusive Plan
                  </CardTitle>
                  <CardDescription>
                    Configure the exclusive rights plan details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exclusive-name">Plan Name</Label>
                      <Input
                        id="exclusive-name"
                        value={plansSettings.exclusivePlan.name}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          exclusivePlan: { ...prev.exclusivePlan, name: e.target.value }
                        }))}
                        placeholder="Exclusive Rights"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exclusive-price">Price ($)</Label>
                      <Input
                        id="exclusive-price"
                        type="number"
                        value={plansSettings.exclusivePlan.price}
                        onChange={(e) => setPlansSettings(prev => ({ 
                          ...prev, 
                          exclusivePlan: { ...prev.exclusivePlan, price: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exclusive-description">Description</Label>
                    <Textarea
                      id="exclusive-description"
                      value={plansSettings.exclusivePlan.description}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        exclusivePlan: { ...prev.exclusivePlan, description: e.target.value }
                      }))}
                      placeholder="Complete ownership and exclusive rights to the beat"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={plansSettings.exclusivePlan.features.join('\n')}
                      onChange={(e) => setPlansSettings(prev => ({ 
                        ...prev, 
                        exclusivePlan: { ...prev.exclusivePlan, features: e.target.value.split('\n').filter(f => f.trim()) }
                      }))}
                      placeholder="Complete ownership of the beat&#10;Unlimited commercial use&#10;Unlimited copies and streams"
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="exclusive-active"
                      checked={plansSettings.exclusivePlan.isActive}
                      onCheckedChange={(checked) => setPlansSettings(prev => ({ 
                        ...prev, 
                        exclusivePlan: { ...prev.exclusivePlan, isActive: checked }
                      }))}
                    />
                    <Label htmlFor="exclusive-active">Active</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Features Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Additional Features Section
                  </CardTitle>
                  <CardDescription>
                    Configure the "Why Choose BeatBazaar?" section and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="additional-features-title">Section Title</Label>
                    <Input
                      id="additional-features-title"
                      value={plansSettings.additionalFeaturesTitle}
                      onChange={(e) => setPlansSettings(prev => ({ ...prev, additionalFeaturesTitle: e.target.value }))}
                      placeholder="Why Choose BeatBazaar?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line, format: Title|Description|Icon)</Label>
                    <Textarea
                      value={plansSettings.additionalFeatures.map(f => `${f.title}|${f.description}|${f.icon}`).join('\n')}
                      onChange={(e) => {
                        const features = e.target.value.split('\n').filter(f => f.trim()).map(line => {
                          const [title, description, icon] = line.split('|');
                          return {
                            title: title?.trim() || '',
                            description: description?.trim() || '',
                            icon: icon?.trim() || 'Shield'
                          };
                        });
                        setPlansSettings(prev => ({ ...prev, additionalFeatures: features }));
                      }}
                      placeholder="Legal Protection|All licenses come with legal documentation and protection|Shield&#10;Artist Support|Dedicated support team to help with your music career|Users&#10;Instant Download|Get your beats immediately after purchase|Download&#10;High Quality|Professional studio quality beats and stems|Headphones"
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: Title|Description|Icon (one per line). Available icons: Shield, Users, Download, Headphones, Zap, Star, Music, Crown
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => savePlansSettingsMutation.mutate(plansSettings)}
                  disabled={savePlansSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savePlansSettingsMutation.isPending ? 'Saving...' : 'Save Plans Settings'}
                </Button>
              </div>
            </div>
          )}

          {/* Artist Bios Management */}
          {activeTab === "artists" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users2 className="h-5 w-5" />
                        Artist Bios
                      </CardTitle>
                      <CardDescription>
                        Manage artist profiles and biographies
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowBioDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Artist
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {artistBios.length === 0 ? (
                    <div className="text-center py-8">
                      <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No artists yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first artist profile
                      </p>
                      <Button onClick={() => setShowBioDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Artist
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {artistBios.map((bio) => (
                        <div key={bio.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                            {bio.imageUrl ? (
                              <img
                                src={bio.imageUrl}
                                alt={bio.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%236366f1'/%3E%3Ctext x='32' y='35' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users2 className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{bio.name}</h3>
                            <p className="text-sm text-muted-foreground">{bio.role}</p>
                            <p className="text-sm text-muted-foreground truncate">{bio.bio}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBio(bio);
                                setBioFormData({
                                  name: bio.name,
                                  imageUrl: bio.imageUrl,
                                  bio: bio.bio,
                                  role: bio.role,
                                  socialLinks: {
                                    instagram: bio.socialLinks?.instagram || '',
                                    twitter: bio.socialLinks?.twitter || '',
                                    youtube: bio.socialLinks?.youtube || '',
                                    spotify: bio.socialLinks?.spotify || ''
                                  },
                                  isActive: bio.isActive,
                                  sortOrder: bio.sortOrder
                                });
                                setShowBioDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteArtistBioMutation.mutate(bio.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management */}
          {activeTab === "users" && (
            <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin User Management
          </CardTitle>
          <CardDescription>
            Manage admin user accounts and permissions
          </CardDescription>
        </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Admin Users</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage admin user accounts and permissions
                    </p>
                  </div>
                  <Button onClick={() => setShowUserDialog(true)} className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </div>

                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <div className="min-w-full">
                          <table className="w-full">
                            <thead className="border-b">
                              <tr>
                                <th className="text-left p-3 sm:p-4 font-medium">User</th>
                                <th className="text-left p-3 sm:p-4 font-medium">Email</th>
                                <th className="text-left p-3 sm:p-4 font-medium">Role</th>
                                <th className="text-left p-3 sm:p-4 font-medium">Created</th>
                                <th className="text-left p-3 sm:p-4 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user: any) => (
                                <tr key={user.id} className="border-b hover:bg-muted/50">
                                  <td className="p-3 sm:p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm sm:text-base">{user.username}</span>
                                          {user.id === currentUser?.id && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                              You
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    <div className="text-xs sm:text-sm">{user.email || 'No email'}</div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    <div className="flex items-center gap-2">
                                      {user.role === 'admin' ? (
                                        <Shield className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <User className="h-4 w-4 text-blue-500" />
                                      )}
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin' 
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                      }`}>
                                        {user.role}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingUser(user);
                                          setUserFormData({
                                            username: user.username,
                                            email: user.email || '',
                                            password: '',
                                            role: user.role as 'admin' | 'client'
                                          });
                                          setShowUserDialog(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      {user.id !== currentUser?.id && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
                                              deleteUserMutation.mutate(user.id);
                                            }
                                          }}
                                          disabled={deleteUserMutation.isPending}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Backup & Restore */}
          {activeTab === "backup" && (
            <div>
              <BackupRestoreManager />
            </div>
          )}

          {/* Database Management */}
          {activeTab === "database" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Manage database data and perform maintenance operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        ⚠️ Danger Zone
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        This action will permanently delete all customers, songs, purchases, payments, and cart data from the database. 
                        This action cannot be undone. Admin accounts will be preserved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Reset Database</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear all customer data, songs, purchases, payments, and cart items. 
                      This is useful for testing or starting fresh.
                    </p>
                  </div>

            <div className="space-y-4">
              <Button
                onClick={() => migrateCustomersMutation.mutate()}
                disabled={migrateCustomersMutation.isPending}
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                {migrateCustomersMutation.isPending ? (
                  <>
                    <Database className="h-5 w-5 animate-spin" />
                    Migrating Customers...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    Migrate Missing Customers
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => checkDatabaseMutation.mutate()}
                disabled={checkDatabaseMutation.isPending || resetDatabaseMutation.isPending}
              >
                {checkDatabaseMutation.isPending || resetDatabaseMutation.isPending ? (
                  <>
                    <Trash2 className="h-5 w-5 animate-spin" />
                    {checkDatabaseMutation.isPending ? 'Checking...' : 'Clearing All Data...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Clear All Data
                  </>
                )}
              </Button>
            </div>
                </div>
              </CardContent>
            </Card>
          )}



          {/* Theme Selection */}
          {activeTab === "themes" && (
            <div className="space-y-6">
            <ThemeSelector />
            <ThemePreview />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending || saveEmailSettingsMutation.isPending || saveContactSettingsMutation.isPending || saveAppBrandingSettingsMutation.isPending}
            size="lg"
            className="px-6 sm:px-8 w-full sm:w-auto"
          >
            {saveSettingsMutation.isPending || saveEmailSettingsMutation.isPending || saveContactSettingsMutation.isPending || saveAppBrandingSettingsMutation.isPending ? (
              <>
                <Settings className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Database Reset Confirmation Dialog */}
        <Dialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirm Database Reset
              </DialogTitle>
              <DialogDescription>
                This action will permanently delete all data from your database. This cannot be undone!
              </DialogDescription>
            </DialogHeader>
            
            {databaseCounts && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-medium text-sm">Current Database Contents:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">{databaseCounts.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beats:</span>
                      <span className="font-medium">{databaseCounts.beats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Genres:</span>
                      <span className="font-medium">{databaseCounts.genres}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchases:</span>
                      <span className="font-medium">{databaseCounts.purchases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customers:</span>
                      <span className="font-medium">{databaseCounts.customers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cart Items:</span>
                      <span className="font-medium">{databaseCounts.cart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payments:</span>
                      <span className="font-medium">{databaseCounts.payments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analytics:</span>
                      <span className="font-medium">{databaseCounts.analytics}</span>
                    </div>
                  </div>
                </div>

                {Object.values(databaseCounts).some((count: any) => count > 0) ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warning: Your database contains data!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      All of the above data will be permanently deleted. A new admin user will be created with default credentials (username: admin, password: admin123).
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your database is empty. Resetting will recreate the default admin user.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowResetConfirmDialog(false)}
                    disabled={resetDatabaseMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => resetDatabaseMutation.mutate(true)}
                    disabled={resetDatabaseMutation.isPending}
                  >
                    {resetDatabaseMutation.isPending ? (
                      <>
                        <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Yes, Delete All Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Form Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? 'Update admin user information' : 'Create a new admin user account'}
          </DialogDescription>
        </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingUser) {
                updateUserMutation.mutate({ 
                  id: editingUser.id, 
                  userData: userFormData 
                });
              } else {
                createUserMutation.mutate(userFormData);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                  required={!editingUser}
                />
              </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value="admin"
              disabled={true}
            >
              <SelectTrigger>
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only admin users can be managed here</p>
          </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createUserMutation.isPending || updateUserMutation.isPending 
                    ? 'Saving...' 
                    : editingUser ? 'Update User' : 'Create User'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Artist Bio Dialog */}
      <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBio ? 'Edit Artist Bio' : 'Add New Artist Bio'}
            </DialogTitle>
            <DialogDescription>
              {editingBio ? 'Update the artist information below.' : 'Fill in the artist information below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bio-name">Artist Name</Label>
                <Input
                  id="bio-name"
                  value={bioFormData.name}
                  onChange={(e) => setBioFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter artist name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio-role">Role</Label>
                <Input
                  id="bio-role"
                  value={bioFormData.role}
                  onChange={(e) => setBioFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Producer, Singer, Rapper"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio-image">Image URL</Label>
              <Input
                id="bio-image"
                value={bioFormData.imageUrl}
                onChange={(e) => setBioFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/artist-image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio-bio">Biography</Label>
              <Textarea
                id="bio-bio"
                rows={4}
                value={bioFormData.bio}
                onChange={(e) => setBioFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about the artist..."
              />
            </div>

            <div className="space-y-2">
              <Label>Social Media Links</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bio-instagram">Instagram</Label>
                  <Input
                    id="bio-instagram"
                    value={bioFormData.socialLinks.instagram}
                    onChange={(e) => setBioFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio-twitter">Twitter</Label>
                  <Input
                    id="bio-twitter"
                    value={bioFormData.socialLinks.twitter}
                    onChange={(e) => setBioFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio-youtube">YouTube</Label>
                  <Input
                    id="bio-youtube"
                    value={bioFormData.socialLinks.youtube}
                    onChange={(e) => setBioFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                    }))}
                    placeholder="https://youtube.com/channel/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio-spotify">Spotify</Label>
                  <Input
                    id="bio-spotify"
                    value={bioFormData.socialLinks.spotify}
                    onChange={(e) => setBioFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, spotify: e.target.value }
                    }))}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bio-sort">Sort Order</Label>
                <Input
                  id="bio-sort"
                  type="number"
                  value={bioFormData.sortOrder}
                  onChange={(e) => setBioFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="bio-active"
                  checked={bioFormData.isActive}
                  onCheckedChange={(checked) => setBioFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="bio-active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBioDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingBio) {
                    updateArtistBioMutation.mutate({ id: editingBio.id, data: bioFormData });
                  } else {
                    createArtistBioMutation.mutate(bioFormData);
                  }
                }}
                disabled={createArtistBioMutation.isPending || updateArtistBioMutation.isPending}
              >
                {createArtistBioMutation.isPending || updateArtistBioMutation.isPending ? 'Saving...' : editingBio ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}
