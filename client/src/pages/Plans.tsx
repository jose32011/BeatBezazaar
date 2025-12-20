import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import PlanUpgrade from '@/components/PlanUpgrade';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Shield, Calendar, DollarSign } from 'lucide-react';
import Header from "@/components/Header";

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
}

export default function Plans() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const planData = await response.json();
        setCurrentPlan(planData);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handlePlanUpdated = () => {
    fetchCurrentPlan();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <Header />
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p style={{ color: themeColors.textSecondary }}>Loading your plan information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.background }}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Current Plan Status */}
        {currentPlan && (
          <div className="mb-8">
            <Card style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: themeColors.text }}>
                  <div className="flex items-center gap-2">
                    {currentPlan.plan === 'premium' && <Star className="h-5 w-5 text-blue-500" />}
                    {currentPlan.plan === 'exclusive' && <Crown className="h-5 w-5 text-purple-500" />}
                    {currentPlan.plan === 'basic' && <Shield className="h-5 w-5 text-gray-500" />}
                    Current Plan: {currentPlan.plan.charAt(0).toUpperCase() + currentPlan.plan.slice(1)}
                  </div>
                  <Badge className={`${
                    currentPlan.status === 'active' ? 'bg-green-500' :
                    currentPlan.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                  } text-white`}>
                    {currentPlan.status}
                  </Badge>
                </CardTitle>
                <CardDescription style={{ color: themeColors.textSecondary }}>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Started: {new Date(currentPlan.startDate).toLocaleDateString()}
                    </div>
                    {currentPlan.endDate && !currentPlan.isLifetime && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires: {new Date(currentPlan.endDate).toLocaleDateString()}
                      </div>
                    )}
                    {currentPlan.isLifetime && (
                      <Badge variant="outline">Lifetime Access</Badge>
                    )}
                    {currentPlan.paymentAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${currentPlan.paymentAmount}/month
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Plan Upgrade Component */}
        <PlanUpgrade 
          currentPlan={currentPlan} 
          onPlanUpdated={handlePlanUpdated}
        />
      </div>
    </div>
  );
}

