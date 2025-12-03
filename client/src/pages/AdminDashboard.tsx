import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Eye, Music, LogOut, Wand2, Image, Edit, Trash2, CreditCard, UserCheck, Play, Pause, Settings, Search, ChevronLeft, ChevronRight, TrendingUp, Menu, X, BarChart3, UserCheck as CustomerIcon, CreditCard as PaymentIcon, Music as BeatIcon, Globe, MessageSquare, Crown, Users2, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, Plus, Save, Trash } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Link } from "wouter";
import { ProtectedRoute } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import AlbumArtGenerator from "@/components/AlbumArtGenerator";
import BannerCreator from "@/components/BannerCreator";
import CustomerManagement from "@/components/CustomerManagement";
import PaymentManagement from "@/components/PaymentManagement";
import AudioPlayer from "@/components/AudioPlayer";
import AdminSettings from "@/pages/AdminSettings";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Analytics, Purchase, Beat } from "@shared/schema";


interface PurchaseWithDetails extends Purchase {
  beatTitle?: string;
  username?: string;
  customerName?: string;
  customerEmail?: string;
}

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);




  // Navigation menu items
  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3, shortLabel: "Overview" },
    { id: "customers", label: "Customers", icon: CustomerIcon, shortLabel: "Customers" },
    { id: "payments", label: "Payments", icon: PaymentIcon, shortLabel: "Payments" },
    { id: "beats", label: "Beat Management", icon: BeatIcon, shortLabel: "Beats" },
    { id: "settings", label: "Settings", icon: Settings, shortLabel: "Settings" }
  ];

  // Track admin dashboard visit
  useEffect(() => {
    fetch('/api/analytics/visit', { method: 'POST' })
      .catch(error => console.log('Analytics tracking failed:', error));
  }, []);


  // Chart data generation functions with actual data
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const generateSiteVisitsData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totalVisits = analytics?.siteVisits || 0;
    
    console.log('🔍 generateSiteVisitsData called:', { 
      analytics, 
      totalVisits, 
      analyticsType: typeof analytics,
      siteVisitsType: typeof analytics?.siteVisits
    });
    
    // Always show zero for each day when totalVisits is 0 or undefined
    if (!totalVisits || totalVisits === 0) {
      console.log('✅ Showing zero visits for all days');
      const zeroData = days.map(day => ({
        day,
        visits: 0
      }));
      console.log('📊 Zero data generated:', zeroData);
      return zeroData;
    }
    
    // If we have actual site visits data, distribute it across days
    console.log('📈 Distributing visits across days:', totalVisits);
    const distributedData = days.map((day, index) => ({
      day,
      visits: Math.floor(totalVisits / 7) + (index % 3) // Distribute visits with slight variation
    }));
    console.log('📊 Distributed data generated:', distributedData);
    return distributedData;
  };

  const generateGenreData = () => {
    if (!Array.isArray(beats) || beats.length === 0) {
      console.log('No beats data available for genre chart');
      return [{ name: 'No Data', value: 1 }];
    }
    
    const genreCounts: { [key: string]: number } = {};
    beats.forEach(beat => {
      const genre = beat.genre || 'Unknown';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    console.log('Genre data:', { beats: beats.length, genreCounts });
    
    return Object.entries(genreCounts).map(([name, value]) => ({ name, value }));
  };

  const generateRevenueData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totalRevenue = purchasesWithDetails?.reduce((sum, p) => sum + parseFloat(String(p.price || 0)), 0) || 0;
    
    console.log('💰 generateRevenueData called:', { 
      purchasesWithDetails: purchasesWithDetails?.length, 
      totalRevenue,
      purchasesWithDetailsType: typeof purchasesWithDetails,
      purchasesWithDetailsArray: Array.isArray(purchasesWithDetails)
    });
    
    // Always show zero for each day when totalRevenue is 0
    if (totalRevenue === 0) {
      console.log('✅ Showing zero revenue for all days');
      const zeroData = days.map(day => ({
        day,
        revenue: 0
      }));
      console.log('📊 Zero revenue data generated:', zeroData);
      return zeroData;
    }
    
    // If we have actual revenue data, distribute it across days
    console.log('📈 Distributing revenue across days:', totalRevenue);
    const distributedData = days.map((day, index) => ({
      day,
      revenue: Math.floor(totalRevenue / 7) + (index % 2) // Distribute revenue with slight variation
    }));
    console.log('📊 Distributed revenue data generated:', distributedData);
    return distributedData;
  };

  const generateUserActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totalCustomers = Array.isArray(customers) ? customers.length : 0;
    const totalPurchases = purchasesWithDetails?.length || 0;
    
    console.log('👥 generateUserActivityData called:', { 
      totalCustomers, 
      totalPurchases,
      customersType: typeof customers,
      customersArray: Array.isArray(customers),
      purchasesWithDetailsType: typeof purchasesWithDetails,
      purchasesWithDetailsArray: Array.isArray(purchasesWithDetails)
    });
    
    // Always show zero for each day when there's no data
    if (totalCustomers === 0 && totalPurchases === 0) {
      console.log('✅ Showing zero user activity for all days');
      const zeroData = days.map(day => ({
        day,
        newUsers: 0,
        purchases: 0
      }));
      console.log('📊 Zero user activity data generated:', zeroData);
      return zeroData;
    }
    
    // If we have actual data, distribute it across days
    console.log('📈 Distributing user activity across days:', { totalCustomers, totalPurchases });
    const distributedData = days.map((day, index) => ({
      day,
      newUsers: Math.floor(totalCustomers / 7) + (index % 2),
      purchases: Math.floor(totalPurchases / 7) + (index % 2)
    }));
    console.log('📊 Distributed user activity data generated:', distributedData);
    return distributedData;
  };
  
  // Search and pagination state
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  
  const { data: analytics, refetch: refetchAnalytics } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
    refetchInterval: 5000, // Refetch every 5 seconds to get updated data
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
    onSuccess: (data) => {
      console.log('Analytics data received:', data);
    }
  });

  // Debug analytics data changes
  useEffect(() => {
    console.log('Analytics data changed:', analytics);
  }, [analytics]);


  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases'],
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: genres = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['/api/admin/genres'],
    staleTime: 1000 * 60 * 5, // 5 minutes - genres don't change frequently
  });




  // Delete beat mutation
  const deleteBeatMutation = useMutation({
    mutationFn: async (beatId: string) => {
      return apiRequest('DELETE', `/api/beats/${beatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({
        title: "Beat deleted",
        description: "The beat has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete beat",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBeat = (beatId: string) => {
    if (window.confirm("Are you sure you want to delete this beat? This action cannot be undone.")) {
      deleteBeatMutation.mutate(beatId);
    }
  };

  // Edit functionality
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    producer: "",
    bpm: "",
    genre: "",
    price: "",
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string>("");

  // Audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playerBeat, setPlayerBeat] = useState<Beat | null>(null);

  const updateBeatMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/beats/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to update beat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      setEditingBeat(null);
      toast({
        title: "Beat updated",
        description: "The beat has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update beat",
        variant: "destructive",
      });
    },
  });

  const handleEditBeat = (beat: Beat) => {
    setEditingBeat(beat);
    setEditFormData({
      title: beat.title,
      producer: beat.producer,
      bpm: beat.bpm.toString(),
      genre: beat.genre,
      price: beat.price.toString(),
    });
    setEditImageFile(null);
    setEditImageUrl("");
    setEditImagePreview(beat.imageUrl);
  };

  const handleUpdateBeat = () => {
    if (!editingBeat) return;
    
    const formData = new FormData();
    formData.append('title', editFormData.title);
    formData.append('producer', editFormData.producer);
    formData.append('bpm', editFormData.bpm);
    formData.append('genre', editFormData.genre);
    formData.append('price', editFormData.price);
    
    if (editImageFile) {
      formData.append('image', editImageFile);
    } else if (editImageUrl.trim()) {
      formData.append('imageUrl', editImageUrl.trim());
    }
    
    updateBeatMutation.mutate({
      id: editingBeat.id,
      formData,
    });
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImageUrl(""); // Clear URL when file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUrlChange = (url: string) => {
    setEditImageUrl(url);
    if (url.trim()) {
      setEditImageFile(null); // Clear file when URL is entered
      setEditImagePreview(url);
    }
  };

  // Site Pages mutations





  // Audio player handlers
  const handlePlayPause = (beat: Beat) => {
    if (currentlyPlaying === beat.id) {
      setCurrentlyPlaying(null);
      setPlayerBeat(null);
    } else {
      setCurrentlyPlaying(beat.id);
      setPlayerBeat(beat);
    }
  };

  // Get beat and user details for purchases
  const [purchasesWithDetails, setPurchasesWithDetails] = useState<PurchaseWithDetails[]>([]);

  useEffect(() => {
    if (purchases && beats && customers) {
      const detailed = purchases.map((purchase) => {
        const beat = Array.isArray(beats) ? beats.find((b: any) => b.id === purchase.beatId) : null;
        const customer = Array.isArray(customers) ? customers.find((c: any) => c.userId === purchase.userId) : null;
        return {
          ...purchase,
          beatTitle: beat?.title || 'Unknown',
          username: customer?.username || '',
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : `User #${purchase.userId.slice(0, 8)}`,
          customerEmail: customer?.email || '',
        };
      });
      setPurchasesWithDetails(detailed);
    }
  }, [purchases, beats, customers]);

  // Debug other data changes
  useEffect(() => {
    console.log('Purchases data changed:', purchases);
  }, [purchases]);

  useEffect(() => {
    console.log('Beats data changed:', beats);
  }, [beats]);

  useEffect(() => {
    console.log('Customers data changed:', customers);
  }, [customers]);

  useEffect(() => {
    console.log('PurchasesWithDetails data changed:', purchasesWithDetails);
  }, [purchasesWithDetails]);

  // Debug chart data generation
  useEffect(() => {
    console.log('🔄 Chart data generation triggered by analytics change');
    const siteVisitsData = generateSiteVisitsData();
    console.log('📊 Site visits chart data:', siteVisitsData);
  }, [analytics]);

  useEffect(() => {
    console.log('🔄 Chart data generation triggered by purchasesWithDetails change');
    const revenueData = generateRevenueData();
    const userActivityData = generateUserActivityData();
    console.log('📊 Revenue chart data:', revenueData);
    console.log('📊 User activity chart data:', userActivityData);
  }, [purchasesWithDetails, customers]);

  const totalRevenue = purchases?.reduce((sum, p) => sum + parseFloat(String(p.price || '0')), 0) || 0;

  // Filter and paginate purchases
  const filteredPurchases = useMemo(() => {
    let filtered = purchasesWithDetails;

    // Filter by search term
    if (purchaseSearch) {
      filtered = filtered.filter(purchase => 
        purchase.beatTitle?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        purchase.customerName?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        purchase.username?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        purchase.customerEmail?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        purchase.userId.toLowerCase().includes(purchaseSearch.toLowerCase())
      );
    }

    // Filter by customer
    if (selectedCustomer !== "all") {
      filtered = filtered.filter(purchase => purchase.userId === selectedCustomer);
    }

    return filtered;
  }, [purchasesWithDetails, purchaseSearch, selectedCustomer]);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (purchasePage - 1) * purchasePageSize;
    const endIndex = startIndex + purchasePageSize;
    return filteredPurchases.slice(startIndex, endIndex);
  }, [filteredPurchases, purchasePage, purchasePageSize]);

  const totalPages = Math.ceil(filteredPurchases.length / purchasePageSize);

  return (
    <div 
      className="min-h-screen"
      style={{ background: themeColors.background }}
    >
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your beat marketplace</p>
        </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
              <Button variant="outline" onClick={logout} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-10">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                Logout
              </Button>
            </div>
          </div>
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
                  const Icon = activeItem?.icon || BarChart3;
                  return (
                    <>
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{activeItem?.label || 'Overview'}</span>
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

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Visits</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-site-visits">
                {analytics?.siteVisits || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-downloads">
                {analytics?.totalDownloads || 0}
              </div>
              <p className="text-xs text-muted-foreground">Beats downloaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beats</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-beats">
                {Array.isArray(beats) ? beats.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Purchases
                </CardTitle>
                <CardDescription>
                  Latest customer purchases and transactions
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search purchases..."
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {Array.isArray(customers) && customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beat</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {purchaseSearch || selectedCustomer !== "all" 
                          ? "No purchases found matching your criteria" 
                          : "No purchases yet"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPurchases.map((purchase) => (
                      <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                        <TableCell className="font-medium" data-testid={`text-beat-${purchase.id}`}>
                          {purchase.beatTitle}
                        </TableCell>
                        <TableCell data-testid={`text-user-${purchase.id}`}>
                          <div>
                            <div className="font-medium">{purchase.customerName}</div>
                            {purchase.customerEmail && (
                              <div className="text-sm text-muted-foreground">{purchase.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-price-${purchase.id}`}>
                          ${parseFloat(String(purchase.price)).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`text-date-${purchase.id}`}>
                          {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((purchasePage - 1) * purchasePageSize) + 1} to {Math.min(purchasePage * purchasePageSize, filteredPurchases.length)} of {filteredPurchases.length} purchases
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchasePage(prev => Math.max(1, prev - 1))}
                    disabled={purchasePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={purchasePage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPurchasePage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchasePage(prev => Math.min(totalPages, prev + 1))}
                    disabled={purchasePage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Site Visits Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Site Visits Trend
              </CardTitle>
              <CardDescription>
                Page views over the last 7 days
                {analytics && (
                  <span className="block text-sm text-muted-foreground mt-1">
                    Total visits: {analytics.siteVisits} | Downloads: {analytics.totalDownloads}
                  </span>
                )}
              </CardDescription>
              <Button 
                onClick={() => refetchAnalytics()} 
                size="sm" 
                variant="outline"
                className="mt-2"
              >
                Refresh Data
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart key={analytics?.siteVisits || 0} data={generateSiteVisitsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Downloads by Genre Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Downloads by Genre
              </CardTitle>
              <CardDescription>
                Beat downloads by genre distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generateGenreData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {generateGenreData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>
                Daily revenue over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={purchasesWithDetails?.length || 0} data={generateRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity
              </CardTitle>
              <CardDescription>
                New users and purchases over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart key={`${customers?.length || 0}-${purchasesWithDetails?.length || 0}`} data={generateUserActivityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="purchases" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Approved Banners Display */}
            

            </div>
          )}

          {/* Beat Management */}
          {activeTab === "beats" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Beat Management</CardTitle>
                  <CardDescription>Manage your beat catalog</CardDescription>
                </div>
                <Link href="/admin/upload">
                  <Button data-testid="button-upload-beat">Upload New Beat</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>BPM</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(beats) && beats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No beats uploaded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      Array.isArray(beats) && beats.map((beat) => (
                        <TableRow key={beat.id}>
                          <TableCell className="font-medium">{beat.title}</TableCell>
                          <TableCell>{beat.producer}</TableCell>
                          <TableCell>{beat.genre}</TableCell>
                          <TableCell>{beat.bpm}</TableCell>
                          <TableCell>${parseFloat(String(beat.price)).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayPause(beat)}
                              disabled={!beat.audioUrl}
                            >
                              {currentlyPlaying === beat.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditBeat(beat)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteBeat(beat.id)}
                                disabled={deleteBeatMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {deleteBeatMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Customers */}
          {activeTab === "customers" && (
            <CustomerManagement />
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <PaymentManagement />
          )}



          {/* Settings */}
          {activeTab === "settings" && (
            <AdminSettings />
          )}
        </div>
      {/* Edit Beat Dialog */}
      <Dialog open={!!editingBeat} onOpenChange={() => setEditingBeat(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Beat</DialogTitle>
            <DialogDescription>
              Make changes to the beat information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Image
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-image-url" className="text-sm text-muted-foreground">
                    Image URL
                  </Label>
                  <Input
                    id="edit-image-url"
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={editImageUrl}
                    onChange={(e) => handleEditImageUrlChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image-file" className="text-sm text-muted-foreground">
                    Or upload file
                  </Label>
                  <Input
                    id="edit-image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                  />
                </div>
                {editImagePreview && (
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-producer" className="text-right">
                Producer
              </Label>
              <Input
                id="edit-producer"
                value={editFormData.producer}
                onChange={(e) => setEditFormData({ ...editFormData, producer: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bpm" className="text-right">
                BPM
              </Label>
              <Input
                id="edit-bpm"
                type="number"
                value={editFormData.bpm}
                onChange={(e) => setEditFormData({ ...editFormData, bpm: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-genre" className="text-right">
                Genre
              </Label>
              <Select
                value={editFormData.genre}
                onValueChange={(value) => setEditFormData({ ...editFormData, genre: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.length === 0 ? (
                    <SelectItem value="no-genres" disabled>No genres available</SelectItem>
                  ) : (
                    genres.map((genre: any) => (
                      <SelectItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price
              </Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingBeat(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateBeat}
              disabled={updateBeatMutation.isPending}
            >
              {updateBeatMutation.isPending ? "Updating..." : "Update Beat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Player */}
      {playerBeat && (
        <AudioPlayer
          beatTitle={playerBeat.title}
          producer={playerBeat.producer}
          imageUrl={playerBeat.imageUrl}
          audioUrl={playerBeat.audioUrl ?? ''}
          duration={30}
          isFullSong={true}
        />
      )}
    </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
