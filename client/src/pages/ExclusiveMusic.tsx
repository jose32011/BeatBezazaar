import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import BeatCard from "@/components/BeatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, Music, Shield, Lock } from "lucide-react";
import type { Beat } from "@shared/schema";

interface PlansSettings {
  basicPlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
  premiumPlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
  exclusivePlan: {
    name: string;
    price: number;
    isActive: boolean;
  };
}

export default function ExclusiveMusic() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { getThemeColors } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const themeColors = getThemeColors();

  // Fetch genres for genre name mapping
  const { data: genres = [] } = useQuery<any[]>({
    queryKey: ['/api/genres'],
    queryFn: async () => {
      const response = await fetch('/api/genres');
      if (!response.ok) throw new Error('Failed to fetch genres');
      return response.json();
    },
  });

  // Fetch exclusive beats
  const { data: exclusiveBeats = [], isLoading: beatsLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats/exclusive'],
    queryFn: async () => {
      const response = await fetch('/api/beats/exclusive');
      if (!response.ok) throw new Error('Failed to fetch exclusive beats');
      return response.json();
    },
  });

  // Fetch plans settings
  const { data: plansSettings } = useQuery<PlansSettings>({
    queryKey: ['/api/plans-settings'],
    queryFn: async () => {
      const response = await fetch('/api/plans-settings');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
  });

  // Fetch user's current plan (if authenticated)
  const { data: userPlan } = useQuery<{ plan: string }>({
    queryKey: ['/api/user/plan'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/plan', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user plan');
      return response.json();
    },
  });

  const handleExclusivePurchase = (beat: Beat) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase exclusive beats",
        variant: "destructive",
      });
      setLocation('/login?redirect=/exclusive-music');
      return;
    }

    // Check if user has a plan that allows exclusive purchases
    if (!userPlan || userPlan.plan === 'basic') {
      toast({
        title: "Plan Upgrade Required",
        description: "Exclusive beats require a Premium or Exclusive plan",
        variant: "destructive",
      });
      setLocation('/plans?upgrade=exclusive');
      return;
    }

    // Proceed with exclusive purchase
    handleExclusivePurchaseFlow(beat);
  };

  const handleExclusivePurchaseFlow = async (beat: Beat) => {
    try {
      const response = await fetch('/api/exclusive-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          beatId: beat.id,
          userId: user?.id,
          price: beat.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate exclusive purchase');
      }

      // Invalidate relevant caches to show real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/beats/exclusive'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] });

      toast({
        title: "Exclusive Purchase Initiated",
        description: "Your exclusive purchase request has been submitted for admin approval. You will be notified once approved.",
      });

    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Failed to initiate exclusive purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Crown className="h-5 w-5" />;
      case 'exclusive':
        return <Star className="h-5 w-5" />;
      default:
        return <Music className="h-5 w-5" />;
    }
  };

  const canPurchaseExclusive = (beatPlan: string) => {
    if (!userPlan) return false;
    
    const planHierarchy = { basic: 1, premium: 2, exclusive: 3 };
    const userPlanLevel = planHierarchy[userPlan.plan as keyof typeof planHierarchy] || 0;
    const requiredLevel = planHierarchy[beatPlan as keyof typeof planHierarchy] || 1;
    
    return userPlanLevel >= requiredLevel;
  };

  if (beatsLoading) {
    return (
      <div 
        className="min-h-screen"
        style={{ background: themeColors.background }}
      >
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p style={{ color: themeColors.textSecondary }}>Loading exclusive beats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ background: themeColors.background }}
    >
      <Header />
      
      {/* Hero Section */}
      <section className="w-full px-6 py-16">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: themeColors.primary }}
            >
              <Crown className="h-10 w-10" style={{ color: themeColors.primaryForeground }} />
            </div>
          </div>
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ color: themeColors.text }}
          >
            Exclusive Music
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-8"
            style={{ color: themeColors.textSecondary }}
          >
            Premium exclusive beats available only to our Premium and Exclusive plan members. 
            Own these beats completely - they'll be removed from the store once purchased.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/login?redirect=/exclusive-music')}
                size="lg"
                style={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.primaryForeground
                }}
              >
                Sign In to Access
              </Button>
              <Button 
                onClick={() => setLocation('/plans')}
                variant="outline"
                size="lg"
              >
                View Plans
              </Button>
            </div>
          )}

          {isAuthenticated && (!userPlan || userPlan.plan === 'basic') && (
            <Card className="max-w-md mx-auto mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Upgrade Required
                </CardTitle>
                <CardDescription>
                  Exclusive beats require a Premium or Exclusive plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setLocation('/plans?upgrade=exclusive')}
                  className="w-full"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.primaryForeground
                  }}
                >
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Plan Requirements Section */}
      {plansSettings && (
        <section className="w-full px-6 py-8">
          <div className="container mx-auto">
            <h2 
              className="text-2xl font-bold text-center mb-8"
              style={{ color: themeColors.text }}
            >
              Plan Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <Card className={`text-center ${userPlan?.plan === 'basic' ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500 flex items-center justify-center">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.basicPlan.name}</CardTitle>
                  <CardDescription>No exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Basic plan members cannot purchase exclusive beats
                  </p>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className={`text-center ${userPlan?.plan === 'premium' ? 'ring-2 ring-purple-500' : ''}`}>
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.premiumPlan.name}</CardTitle>
                  <CardDescription>Limited exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access to premium exclusive beats
                  </p>
                </CardContent>
              </Card>

              {/* Exclusive Plan */}
              <Card className={`text-center ${userPlan?.plan === 'exclusive' ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plansSettings.exclusivePlan.name}</CardTitle>
                  <CardDescription>Full exclusive access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access to all exclusive beats
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Exclusive Beats Grid */}
      {isAuthenticated && userPlan && userPlan.plan !== 'basic' && (
        <section className="w-full px-6 py-8">
          <div className="container mx-auto">
            <h2 
              className="text-2xl font-bold mb-8"
              style={{ color: themeColors.text }}
            >
              Available Exclusive Beats
            </h2>
            
            {exclusiveBeats.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p style={{ color: themeColors.textSecondary }}>
                  No exclusive beats available at the moment. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {exclusiveBeats.map((beat) => {
                  // Find the genre name from the genre ID
                  const genreName = genres.find(g => g.id === beat.genre)?.name || beat.genre;
                  return (
                    <div key={beat.id} className="relative">
                      <BeatCard
                        beat={beat}
                        genreName={genreName}
                        isPlaying={false}
                        onPlay={() => {}}
                        onAddToCart={() => handleExclusivePurchase(beat)}
                        isInCart={false}
                        isOwned={false}
                        showAddToCart={canPurchaseExclusive(beat.exclusivePlan || 'premium')}
                        addToCartText="Purchase Exclusive"
                        />
                      <div className="absolute top-2 right-2">
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{
                          backgroundColor: themeColors.primary,
                          color: themeColors.primaryForeground
                        }}
                      >
                        {getPlanIcon(beat.exclusivePlan || 'premium')}
                        {beat.exclusivePlan || 'Premium'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}