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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
  MapPin
} from "lucide-react";
import GenreManagement from "@/components/GenreManagement";
import ThemeSelector from "@/components/ThemeSelector";
import ThemePreview from "@/components/ThemePreview";

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
  const [showSecrets, setShowSecrets] = useState(false);
  const [activeTab, setActiveTab] = useState("paypal");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const [socialMediaSettings, setSocialMediaSettings] = useState({
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    tiktokUrl: ''
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
    messageTemplate: 'You have received a new message from your contact form.'
  });

  // Navigation menu items
  const menuItems = [
    { id: "paypal", label: "PayPal", icon: CreditCard, shortLabel: "PayPal" },
    { id: "bank", label: "Bank Account", icon: Building2, shortLabel: "Bank" },
    { id: "email", label: "Email Settings", icon: Mail, shortLabel: "Email" },
    { id: "social", label: "Social Media", icon: Share2, shortLabel: "Social" },
    { id: "contact", label: "Contact Page", icon: MessageSquare, shortLabel: "Contact" },
    { id: "users", label: "Admin Users", icon: Users, shortLabel: "Users" },
    { id: "genres", label: "Genre Management", icon: Music, shortLabel: "Genres" },
    { id: "themes", label: "Themes", icon: Palette, shortLabel: "Themes" },
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

    // Load social media settings from API
    fetch('/api/social-media-settings', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSocialMediaSettings({
            facebookUrl: data.facebookUrl || '',
            instagramUrl: data.instagramUrl || '',
            twitterUrl: data.twitterUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            tiktokUrl: data.tiktokUrl || ''
          });
        }
      })
      .catch(error => {
        console.error('Failed to load social media settings:', error);
      });

    // Load contact settings from API
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
            messageTemplate: data.messageTemplate || 'You have received a new message from your contact form.'
          });
        }
      })
      .catch(error => {
        console.error('Failed to load contact settings:', error);
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

  const saveSocialMediaMutation = useMutation({
    mutationFn: async (socialSettings: typeof socialMediaSettings) => {
      const response = await fetch('/api/admin/social-media-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(socialSettings),
      });
      if (!response.ok) throw new Error('Failed to save social media settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Social Media Settings Saved",
        description: "Your social media settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save social media settings",
        variant: "destructive",
      });
    },
  });

  const saveContactSettingsMutation = useMutation({
    mutationFn: async (contactSettingsData: typeof contactSettings) => {
      const response = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactSettingsData),
      });
      if (!response.ok) throw new Error('Failed to save contact settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact Settings Saved",
        description: "Your contact page settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contact settings",
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

  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to reset database');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Database Reset",
        description: data.message || "All customers, songs, and related data have been cleared successfully",
      });
      
      // If redirect is required, logout and redirect to login
      if (data.redirectToLogin) {
        setTimeout(() => {
          logout();
        }, 2000); // Wait 2 seconds to show the success message
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset database",
        variant: "destructive",
      });
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
    saveSocialMediaMutation.mutate(socialMediaSettings);
    saveContactSettingsMutation.mutate(contactSettings);
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

          {/* PayPal Settings */}
          {activeTab === "paypal" && (
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
          )}

          {/* Bank Account Settings */}
          {activeTab === "bank" && (
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

          {/* Social Media Settings */}
          {activeTab === "social" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Configure social media links that appear on the contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook-url">Facebook URL</Label>
                    <Input
                      id="facebook-url"
                      type="url"
                      value={socialMediaSettings.facebookUrl}
                      onChange={(e) => setSocialMediaSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram-url">Instagram URL</Label>
                    <Input
                      id="instagram-url"
                      type="url"
                      value={socialMediaSettings.instagramUrl}
                      onChange={(e) => setSocialMediaSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-url">Twitter URL</Label>
                    <Input
                      id="twitter-url"
                      type="url"
                      value={socialMediaSettings.twitterUrl}
                      onChange={(e) => setSocialMediaSettings(prev => ({ ...prev, twitterUrl: e.target.value }))}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <Input
                      id="youtube-url"
                      type="url"
                      value={socialMediaSettings.youtubeUrl}
                      onChange={(e) => setSocialMediaSettings(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok-url">TikTok URL</Label>
                    <Input
                      id="tiktok-url"
                      type="url"
                      value={socialMediaSettings.tiktokUrl}
                      onChange={(e) => setSocialMediaSettings(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                      placeholder="https://tiktok.com/@yourpage"
                    />
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    These links will appear as buttons on the contact page:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialMediaSettings.facebookUrl && (
                      <Button size="sm" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </Button>
                    )}
                    {socialMediaSettings.instagramUrl && (
                      <Button size="sm" variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </Button>
                    )}
                    {socialMediaSettings.twitterUrl && (
                      <Button size="sm" variant="outline" className="bg-blue-400 text-white hover:bg-blue-500">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </Button>
                    )}
                    {socialMediaSettings.youtubeUrl && (
                      <Button size="sm" variant="outline" className="bg-red-600 text-white hover:bg-red-700">
                        <Youtube className="h-4 w-4 mr-2" />
                        YouTube
                      </Button>
                    )}
                    {socialMediaSettings.tiktokUrl && (
                      <Button size="sm" variant="outline" className="bg-black text-white hover:bg-gray-800">
                        <Music className="h-4 w-4 mr-2" />
                        TikTok
                      </Button>
                    )}
                    {!socialMediaSettings.facebookUrl && !socialMediaSettings.instagramUrl && !socialMediaSettings.twitterUrl && !socialMediaSettings.youtubeUrl && !socialMediaSettings.tiktokUrl && (
                      <p className="text-sm text-muted-foreground">No social media links configured</p>
                    )}
                  </div>
                </div>
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
                onClick={() => resetDatabaseMutation.mutate()}
                disabled={resetDatabaseMutation.isPending}
                variant="destructive"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                {resetDatabaseMutation.isPending ? (
                  <>
                    <Database className="h-5 w-5 animate-spin" />
                    Resetting Database...
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

          {/* Genre Management */}
          {activeTab === "genres" && (
            <GenreManagement />
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
            disabled={saveSettingsMutation.isPending || saveEmailSettingsMutation.isPending}
            size="lg"
            className="px-6 sm:px-8 w-full sm:w-auto"
          >
            {saveSettingsMutation.isPending || saveEmailSettingsMutation.isPending ? (
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
