import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Crown, Star, Shield, Calendar, DollarSign, User, Search } from 'lucide-react';

interface UserPlan {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate?: string;
  isLifetime: boolean;
  paymentAmount?: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  currentPlan: string;
  planStatus: string;
  createdAt: string;
}

export default function UserPlanManager() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  
  // Plan update form state
  const [newPlan, setNewPlan] = useState('basic');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLifetime, setIsLifetime] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/user-plans')
      ]);
      
      if (usersResponse.ok && plansResponse.ok) {
        const usersData = await usersResponse.json();
        const plansData = await plansResponse.json();
        setUsers(usersData);
        setUserPlans(plansData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPlan = async () => {
    if (!selectedUser) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/user-plans/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          paymentMethod,
          paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined,
          isLifetime
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Updated ${selectedUser.username}'s plan to ${newPlan}`
        });
        setShowPlanDialog(false);
        fetchData();
      } else {
        throw new Error('Failed to update plan');
      }
    } catch (error) {
      console.error('Failed to update user plan:', error);
      toast({
        title: "Error",
        description: "Failed to update user plan",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium': return <Star className="h-4 w-4" />;
      case 'exclusive': return <Crown className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-blue-500';
      case 'exclusive': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      case 'cancelled': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUserCurrentPlan = (userId: string) => {
    return userPlans
      .filter(plan => plan.userId === userId && plan.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p style={{ color: themeColors.textSecondary }}>Loading user plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>User Plan Management</h2>
          <p style={{ color: themeColors.textSecondary }}>Manage user subscriptions and plan access</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: themeColors.textSecondary }} />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text
          }}
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const currentPlan = getUserCurrentPlan(user.id);
          const planToShow = currentPlan || { plan: user.currentPlan, status: user.planStatus };
          
          return (
            <Card 
              key={user.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border
              }}
              onClick={() => {
                setSelectedUser(user);
                setNewPlan(planToShow.plan);
                setPaymentMethod('manual');
                setPaymentAmount('');
                setIsLifetime(currentPlan?.isLifetime || false);
                setShowPlanDialog(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2" style={{ color: themeColors.text }}>
                    <User className="h-4 w-4" />
                    {user.username}
                  </CardTitle>
                  <Badge className={`${getPlanColor(planToShow.plan)} text-white`}>
                    {getPlanIcon(planToShow.plan)}
                    {planToShow.plan}
                  </Badge>
                </div>
                {user.email && (
                  <CardDescription style={{ color: themeColors.textSecondary }}>
                    {user.email}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: themeColors.textSecondary }}>Status:</span>
                    <Badge className={`${getStatusColor(planToShow.status)} text-white text-xs`}>
                      {planToShow.status}
                    </Badge>
                  </div>
                  {currentPlan && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: themeColors.textSecondary }}>Started:</span>
                        <span style={{ color: themeColors.text }}>
                          {new Date(currentPlan.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      {currentPlan.endDate && !currentPlan.isLifetime && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: themeColors.textSecondary }}>Expires:</span>
                          <span style={{ color: themeColors.text }}>
                            {new Date(currentPlan.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {currentPlan.isLifetime && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: themeColors.textSecondary }}>Type:</span>
                          <Badge variant="outline">Lifetime</Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Update Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: themeColors.text }}>
              Update Plan for {selectedUser?.username}
            </DialogTitle>
            <DialogDescription style={{ color: themeColors.textSecondary }}>
              Change the user's subscription plan and payment details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: themeColors.text }}>Plan Type</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (Free)</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium" style={{ color: themeColors.text }}>Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual/Admin</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium" style={{ color: themeColors.text }}>Payment Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lifetime"
                checked={isLifetime}
                onChange={(e) => setIsLifetime(e.target.checked)}
              />
              <label htmlFor="lifetime" className="text-sm" style={{ color: themeColors.text }}>
                Lifetime Plan
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserPlan} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}