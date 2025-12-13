import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, CreditCard, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import AudioPlayerFooter from "@/components/AudioPlayerFooter";

export default function Checkout() {
  const { cart, cartCount, clearCart } = useCart();
  const { getThemeColors } = useTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const themeColors = getThemeColors();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = cart.reduce((sum, beat) => sum + beat.price, 0);

  const handleBackToCart = () => {
    setLocation("/music");
  };

  const handleCheckout = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Implement actual payment processing
      // For now, simulate a successful checkout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearCart();
      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${cartCount} beat(s) for $${totalPrice.toFixed(2)}`,
      });
      
      setLocation("/library");
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: themeColors.background }}
      >
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <ShoppingCart 
              className="h-16 w-16 mx-auto mb-4" 
              style={{ color: themeColors.textSecondary }} 
            />
            <h1 
              className="text-2xl font-bold mb-4"
              style={{ color: themeColors.text }}
            >
              Your cart is empty
            </h1>
            <p 
              className="text-lg mb-6"
              style={{ color: themeColors.textSecondary }}
            >
              Add some beats to your cart before checking out.
            </p>
            <Button
              onClick={() => setLocation("/music")}
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.primaryForeground,
              }}
            >
              Browse Music
            </Button>
          </div>
        </div>
        <AudioPlayerFooter />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ backgroundColor: themeColors.background }}
    >
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToCart}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Music
          </Button>
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: themeColors.text }}
            >
              Checkout
            </h1>
            <p style={{ color: themeColors.textSecondary }}>
              Complete your purchase of {cartCount} beat{cartCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <CardHeader>
              <CardTitle style={{ color: themeColors.text }}>Order Summary</CardTitle>
              <CardDescription style={{ color: themeColors.textSecondary }}>
                Review your items before checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((beat) => (
                <div key={beat.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={beat.imageUrl || '/placeholder-beat.svg'}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-beat.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium" style={{ color: themeColors.text }}>
                      {beat.title}
                    </h4>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                      by {beat.producer}
                    </p>
                  </div>
                  <span className="font-semibold" style={{ color: themeColors.primary }}>
                    ${beat.price.toFixed(2)}
                  </span>
                </div>
              ))}
              
              <Separator style={{ backgroundColor: themeColors.border }} />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span style={{ color: themeColors.text }}>Total:</span>
                <span style={{ color: themeColors.primary }}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: themeColors.text }}>
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription style={{ color: themeColors.textSecondary }}>
                This is a demo checkout. No real payment will be processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" style={{ color: themeColors.text }}>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" style={{ color: themeColors.text }}>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: themeColors.text }}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  defaultValue={user?.email || ""}
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber" style={{ color: themeColors.text }}>
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry" style={{ color: themeColors.text }}>
                    Expiry Date
                  </Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" style={{ color: themeColors.text }}>
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full mt-6"
                size="lg"
                style={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.primaryForeground,
                }}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Complete Purchase - $${totalPrice.toFixed(2)}`
                )}
              </Button>

              <p className="text-xs text-center mt-4" style={{ color: themeColors.textSecondary }}>
                This is a demo. No real payment will be processed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AudioPlayerFooter />
    </div>
  );
}