import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Crown, Star, Shield, Check, X } from 'lucide-react';
import StripeCheckout from './StripeCheckout';
import PayPalCheckout from './PayPalCheckout';

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

interface PlanUpgradeProps {
  currentPlan?: UserPlan | null;
  onPlanUpdated?: () => void;
}

const planFeatures = {
  basic: {
    name: 'Basic',
    price: 0,
    icon: Shield,
    color: 'bg-gray-500',
    features: [
      'Browse all beats',
      'Preview beats',
      'Basic search and filters',
      'Standard audio quality'
    ],
    limitations: [
      'No exclusive beats access',
      'No priority support',
      'Limited downloads'
    ]
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    icon: Star,
    color: 'bg-blue-500',
    features: [
      'All Basic features',
      'Access to premium beats',
      'High-quality downloads',
      'Priority customer support',
      'Advanced search filters',
      'Unlimited previews'
    ],
    limitations: [
      'No exclusive beats access'
    ]
  },
  exclusive: {
    name: 'Exclusive',
    price: 49.99,
    icon: Crown,
    color: 'bg-purple-500',
    features: [
      'All Premium features',
      'Access to exclusive beats',
      'Purchase exclusive rights',
      'VIP customer support',
      'Early access to new releases',
      'Custom beat requests',
      'Producer collaboration opportunities'
    ],
    limitations: []
  }
};

export default function PlanUpgrade({ currentPlan, onPlanUpdated }: PlanUpgradeProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlanType = currentPlan?.plan || 'basic';

  const handlePlanSelect = (planType: string) => {
    if (planType === currentPlanType) return;
    if (planType === 'basic') {
      // Downgrade to basic (free)
      handlePlanUpdate(planType, 'manual', 0);
      return;
    }
    
    setSelectedPlan(planType);
    setShowPaymentDialog(true);
  };

  const handlePlanUpdate = async (plan: string, method: string, amount: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/user/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          paymentMethod: method,
          paymentAmount: amount,
          isLifetime: false
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `Your plan has been updated to ${plan}`
        });
        setShowPaymentDialog(false);
        onPlanUpdated?.();
      } else {
        throw new Error('Failed to update plan');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (selectedPlan) {
      const plan = planFeatures[selectedPlan as keyof typeof planFeatures];
      handlePlanUpdate(selectedPlan, paymentMethod, plan.price);
    }
  };

  const getPlanOrder = (plan: string) => {
    const order = { basic: 0, premium: 1, exclusive: 2 };
    return order[plan as keyof typeof order] || 0;
  };

  const canUpgrade = (planType: string) => {
    return getPlanOrder(planType) > getPlanOrder(currentPlanType);
  };

  const canDowngrade = (planType: string) => {
    return getPlanOrder(planType) < getPlanOrder(currentPlanType);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2" style={{ color: themeColors.text }}>Choose Your Plan</h2>
        <p style={{ color: themeColors.textSecondary }}>Unlock more features and exclusive content</p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(planFeatures).map(([planType, plan]) => {
          const Icon = plan.icon;
          const isCurrent = planType === currentPlanType;
          const isUpgrade = canUpgrade(planType);
          const isDowngrade = canDowngrade(planType);
          
          return (
            <Card 
              key={planType}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                isCurrent ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                backgroundColor: themeColors.surface,
                borderColor: isCurrent ? themeColors.primary : themeColors.border
              }}
            >
              {planType === 'premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`mx-auto p-3 rounded-full ${plan.color} w-fit mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl" style={{ color: themeColors.text }}>
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold" style={{ color: themeColors.text }}>
                  ${plan.price}
                  <span className="text-sm font-normal" style={{ color: themeColors.textSecondary }}>
                    {plan.price > 0 ? '/month' : ''}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm" style={{ color: themeColors.text }}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: themeColors.border }}>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm" style={{ color: themeColors.textSecondary }}>{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Action Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handlePlanSelect(planType)}
                      style={{
                        backgroundColor: themeColors.primary,
                        color: 'white'
                      }}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  ) : isDowngrade ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handlePlanSelect(planType)}
                    >
                      Downgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handlePlanSelect(planType)}
                    >
                      Select {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: themeColors.text }}>
              Upgrade to {selectedPlan && planFeatures[selectedPlan as keyof typeof planFeatures].name}
            </DialogTitle>
            <DialogDescription style={{ color: themeColors.textSecondary }}>
              Choose your payment method to complete the upgrade.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: themeColors.surface }}>
                <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                  ${planFeatures[selectedPlan as keyof typeof planFeatures].price}/month
                </div>
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>Billed monthly, cancel anytime</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button
                    variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('stripe')}
                    className="flex-1"
                  >
                    Credit Card (Stripe)
                  </Button>
                  <Button
                    variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('paypal')}
                    className="flex-1"
                  >
                    PayPal
                  </Button>
                </div>
                
                <div className="pt-4">
                  {paymentMethod === 'stripe' ? (
                    <StripeCheckout
                      amount={planFeatures[selectedPlan as keyof typeof planFeatures].price}
                      beatIds={[]} // Empty for plan purchases
                      customerInfo={{
                        firstName: '',
                        lastName: '',
                        email: ''
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => {
                        toast({
                          title: "Payment Failed",
                          description: error,
                          variant: "destructive"
                        });
                      }}
                      themeColors={themeColors}
                    />
                  ) : (
                    <PayPalCheckout
                      amount={planFeatures[selectedPlan as keyof typeof planFeatures].price}
                      beatIds={[]} // Empty for plan purchases
                      customerInfo={{
                        firstName: '',
                        lastName: '',
                        email: ''
                      }}
                      planType={selectedPlan}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => {
                        toast({
                          title: "Payment Failed",
                          description: error,
                          variant: "destructive"
                        });
                      }}
                      themeColors={themeColors}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}