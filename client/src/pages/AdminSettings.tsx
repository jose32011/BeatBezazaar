import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Palette
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

  // Load settings on component mount
  useEffect(() => {
    // Load from localStorage or API
    const savedSettings = localStorage.getItem('payment-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
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
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure settings 
          </p>
        </div>

        <Tabs defaultValue="paypal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              PayPal Configuration
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Account
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Users
            </TabsTrigger>
            <TabsTrigger value="genres" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Genre Management
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* PayPal Settings */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Bank Account Settings */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* User Management */}
          <TabsContent value="users">
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
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Admin Users</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage admin user accounts and permissions
                    </p>
                  </div>
                  <Button onClick={() => setShowUserDialog(true)} className="gap-2">
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
                      <div className="border rounded-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b">
                              <tr>
                                <th className="text-left p-4 font-medium">User</th>
                                <th className="text-left p-4 font-medium">Email</th>
                                <th className="text-left p-4 font-medium">Role</th>
                                <th className="text-left p-4 font-medium">Created</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user: any) => (
                                <tr key={user.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{user.username}</span>
                                          {user.id === currentUser?.id && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                              You
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-sm">{user.email || 'No email'}</div>
                                  </td>
                                  <td className="p-4">
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
                                  <td className="p-4">
                                    <div className="text-sm text-muted-foreground">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                    </div>
                                  </td>
                                  <td className="p-4">
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
          </TabsContent>

          {/* Database Management */}
          <TabsContent value="database">
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
                className="gap-2"
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
                className="gap-2"
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
          </TabsContent>

          {/* Genre Management */}
          <TabsContent value="genres">
            <GenreManagement />
          </TabsContent>

          {/* Theme Selection */}
          <TabsContent value="themes" className="space-y-6">
            <ThemeSelector />
            <ThemePreview />
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            size="lg"
            className="px-8"
          >
            {saveSettingsMutation.isPending ? (
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
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
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
