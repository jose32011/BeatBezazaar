import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Music, Crown, Zap, Shield, Users, Download, Headphones } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";

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

function Plans() {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  // Fetch plans settings from API
  const { data: plansSettings, isLoading, error } = useQuery<PlansSettings>({
    queryKey: ["plans-settings"],
    queryFn: async () => {
      const response = await fetch("/api/plans-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch plans settings");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="h-6 w-6" />;
      case 'Users':
        return <Users className="h-6 w-6" />;
      case 'Download':
        return <Download className="h-6 w-6" />;
      case 'Headphones':
        return <Headphones className="h-6 w-6" />;
      case 'Zap':
        return <Zap className="h-4 w-4" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.foreground
        }}
      >
        <Header />
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error || !plansSettings) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.foreground
        }}
      >
        <Header />
        <div className="text-center">
          <p className="text-red-500">Failed to load plans. Please try again later.</p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "basic",
      name: plansSettings.basicPlan.name,
      price: plansSettings.basicPlan.price,
      description: plansSettings.basicPlan.description,
      features: plansSettings.basicPlan.features,
      popular: false,
      icon: <Music className="h-8 w-8" />,
      color: "bg-blue-500",
      isActive: plansSettings.basicPlan.isActive
    },
    {
      id: "premium",
      name: plansSettings.premiumPlan.name,
      price: plansSettings.premiumPlan.price,
      description: plansSettings.premiumPlan.description,
      features: plansSettings.premiumPlan.features,
      popular: plansSettings.premiumPlan.isPopular,
      icon: <Crown className="h-8 w-8" />,
      color: "bg-purple-500",
      isActive: plansSettings.premiumPlan.isActive
    },
    {
      id: "exclusive",
      name: plansSettings.exclusivePlan.name,
      price: plansSettings.exclusivePlan.price,
      description: plansSettings.exclusivePlan.description,
      features: plansSettings.exclusivePlan.features,
      popular: false,
      icon: <Star className="h-8 w-8" />,
      color: "bg-gradient-to-r from-yellow-400 to-orange-500",
      isActive: plansSettings.exclusivePlan.isActive
    }
  ].filter(plan => plan.isActive);

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground
      }}
    >
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ color: themeColors.primary }}
          >
            {plansSettings.pageTitle}
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-8"
            style={{ color: themeColors.mutedForeground }}
          >
            {plansSettings.pageSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {plansSettings.trustBadges.map((badge, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="px-4 py-2 text-sm"
                style={{
                  backgroundColor: themeColors.secondary,
                  color: themeColors.secondaryForeground
                }}
              >
                {getIcon(badge.icon)}
                <span className="ml-2">{badge.text}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative group hover:shadow-2xl transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
              style={{
                backgroundColor: themeColors.card,
                borderColor: plan.popular ? themeColors.primary : themeColors.border
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge 
                    className="px-4 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: themeColors.primaryForeground
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white ${plan.color}`}>
                  {plan.icon}
                </div>
                <CardTitle 
                  className="text-2xl font-bold mb-2"
                  style={{ color: themeColors.foreground }}
                >
                  {plan.name}
                </CardTitle>
                <CardDescription 
                  className="text-base mb-4"
                  style={{ color: themeColors.mutedForeground }}
                >
                  {plan.description}
                </CardDescription>
                <div className="mb-4">
                  <span 
                    className="text-4xl font-bold"
                    style={{ color: themeColors.primary }}
                  >
                    ${plan.price}
                  </span>
                  {plan.id !== "exclusive" && (
                    <span 
                      className="text-lg ml-1"
                      style={{ color: themeColors.mutedForeground }}
                    >
                      /license
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check 
                        className="h-5 w-5 flex-shrink-0 mt-0.5" 
                        style={{ color: themeColors.primary }}
                      />
                      <span 
                        className="text-sm"
                        style={{ color: themeColors.mutedForeground }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full mt-6"
                  size="lg"
                  style={{
                    backgroundColor: plan.popular ? themeColors.primary : themeColors.secondary,
                    color: plan.popular ? themeColors.primaryForeground : themeColors.secondaryForeground
                  }}
                >
                  {plan.id === "exclusive" ? "Get Exclusive Rights" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-3xl font-bold text-center mb-12"
            style={{ color: themeColors.foreground }}
          >
            {plansSettings.additionalFeaturesTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plansSettings.additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.primaryForeground
                  }}
                >
                  {getIcon(feature.icon)}
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: themeColors.foreground }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: themeColors.mutedForeground }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 
            className="text-3xl font-bold text-center mb-12"
            style={{ color: themeColors.foreground }}
          >
            {plansSettings.faqSection.title}
          </h2>
          <div className="space-y-6">
            {plansSettings.faqSection.questions.map((faq, index) => (
              <Card key={index} style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                <CardContent className="p-6">
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: themeColors.foreground }}
                  >
                    {faq.question}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: themeColors.mutedForeground }}
                  >
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Plans;
