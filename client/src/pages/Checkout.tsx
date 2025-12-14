import { useState, useEffect, useMemo } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, CreditCard, ArrowLeft, Building2 } from "lucide-react";
import { SiPaypal, SiStripe } from "react-icons/si";
import Header from "@/components/Header";
import StripeCheckout from "@/components/StripeCheckout";
import PayPalCheckout from "@/components/PayPalCheckout";

export default function Checkout() {
  const { cart, cartCount } = useCart();
  const { getThemeColors } = useTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const themeColors = getThemeColors();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("stripe");
  
  // Form state for customer information
  const [customerInfo, setCustomerInfo] = useState(() => {
    // Try to extract first and last name from username
    const username = user?.username || "";
    const nameParts = username.split(" ");
    
    // If username has spaces, split into first and last name
    // If no spaces, use the whole username as first name
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    
    return {
      firstName,
      lastName,
      email: user?.email || "",
    };
  });

  const totalPrice = cart.reduce((sum, beat) => sum + beat.price, 0);
  const beatIds = cart.map(beat => beat.id);

  // Memoized validation to prevent infinite re-renders
  const isCustomerInfoValid = useMemo(() => {
    return (
      customerInfo.firstName.trim() !== "" &&
      customerInfo.lastName.trim() !== "" &&
      customerInfo.email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)
    );
  }, [customerInfo.firstName, customerInfo.lastName, customerInfo.email]);

  // Update customer info when user data changes
  useEffect(() => {
    if (user) {
      const username = user.username || "";
      const nameParts = username.split(" ");
      
      // If username has spaces, split into first and last name
      // If no spaces, use the whole username as first name
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
      
      setCustomerInfo(prev => ({
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleBackToCart = () => {
    setLocation("/music");
  };

  const validateCustomerInfo = () => {
    if (!customerInfo.firstName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerInfo.lastName.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter your last name.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerInfo.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handlePaymentSuccess = async () => {
    try {
      // Clear the cart
      const clearResponse = await fetch("/api/cart/clear", {
        method: "DELETE",
        credentials: "include",
      });

      if (!clearResponse.ok) {
        console.warn("Failed to clear cart, but payment was successful");
      }

      // Force refresh the cart data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${cartCount} beat(s) for $${totalPrice.toFixed(2)}`,
      });
      
      // Redirect to library
      setTimeout(() => {
        setLocation("/library");
      }, 1000);
    } catch (error) {
      console.error("Post-payment cleanup error:", error);
      // Still redirect even if cleanup fails
      setTimeout(() => {
        setLocation("/library");
      }, 1000);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleBankTransfer = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (!validateCustomerInfo()) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create bank transfer payment records
      const purchasePromises = cart.map(async (beat) => {
        const purchaseResponse = await fetch("/api/purchases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            beatId: beat.id,
            beatTitle: beat.title,
            beatProducer: beat.producer,
            beatAudioUrl: beat.audioUrl,
            beatImageUrl: beat.imageUrl,
            price: beat.price,
            isExclusive: "false",
            status: "pending",
          }),
        });

        if (!purchaseResponse.ok) {
          const errorData = await purchaseResponse.json();
          throw new Error(errorData.error || `Failed to create purchase for ${beat.title}`);
        }
        return purchaseResponse.json();
      });

      await Promise.all(purchasePromises);
      
      // Clear the cart
      const clearResponse = await fetch("/api/cart/clear", {
        method: "DELETE",
        credentials: "include",
      });

      if (clearResponse.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order for ${cartCount} beat(s) worth $${totalPrice.toFixed(2)} has been placed. You'll receive bank transfer instructions via email.`,
      });
      
      setTimeout(() => {
        setLocation("/library");
      }, 1000);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "There was an error processing your order. Please try again.",
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
        <div className="container mx-auto px-4 py-12 pb-32">
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
                color: 'white',
              }}
            >
              Browse Music
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: themeColors.background }}
    >
      <Header />
      
      <div className="container mx-auto px-4 py-8 pb-40">
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

          {/* Payment Method Selection */}
          <Card style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: themeColors.text }}>
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription style={{ color: themeColors.textSecondary }}>
                Choose your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Options */}
              <div className="space-y-3">
                {/* Stripe */}
                <label 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{ 
                    borderColor: selectedPaymentMethod === "stripe" ? themeColors.primary : themeColors.border,
                    backgroundColor: selectedPaymentMethod === "stripe" ? `${themeColors.primary}10` : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={selectedPaymentMethod === "stripe"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    style={{ accentColor: themeColors.primary }}
                  />
                  <SiStripe className="h-6 w-6 text-[#635bff]" />
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: themeColors.text }}>Credit/Debit Card</span>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                      Secure payment with Stripe
                    </p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: themeColors.primary }}>
                    Instant
                  </span>
                </label>

                {/* PayPal */}
                <label 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{ 
                    borderColor: selectedPaymentMethod === "paypal" ? themeColors.primary : themeColors.border,
                    backgroundColor: selectedPaymentMethod === "paypal" ? `${themeColors.primary}10` : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPaymentMethod === "paypal"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    style={{ accentColor: themeColors.primary }}
                  />
                  <SiPaypal className="h-6 w-6 text-[#0070ba]" />
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: themeColors.text }}>PayPal</span>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                      Pay with your PayPal account
                    </p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: themeColors.primary }}>
                    Instant
                  </span>
                </label>

                {/* Bank Transfer */}
                <label 
                  className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{ 
                    borderColor: selectedPaymentMethod === "bank_transfer" ? themeColors.primary : themeColors.border,
                    backgroundColor: selectedPaymentMethod === "bank_transfer" ? `${themeColors.primary}10` : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={selectedPaymentMethod === "bank_transfer"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    style={{ accentColor: themeColors.primary }}
                  />
                  <Building2 className="h-6 w-6" style={{ color: themeColors.primary }} />
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: themeColors.text }}>Bank Transfer</span>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                      Direct bank transfer (manual approval)
                    </p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
                    1-2 days
                  </span>
                </label>
              </div>

              <Separator style={{ backgroundColor: themeColors.border }} />

              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium" style={{ color: themeColors.text }}>
                    Customer Information
                  </h4>
                  <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                    Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required
                    {(customerInfo.firstName || customerInfo.lastName || customerInfo.email) && (
                      <span className="block mt-1">
                        Some information has been pre-filled from your account. You can edit it if needed.
                      </span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" style={{ color: themeColors.text }}>
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder={customerInfo.firstName || "First name"}
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" style={{ color: themeColors.text }}>
                      Last Name <span style={{ color: '#ef4444' }}>*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder={customerInfo.lastName || "Last name"}
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
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
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={customerInfo.email || "your@email.com"}
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  />
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-3">
                {selectedPaymentMethod === "stripe" && (
                  <StripeCheckout
                    amount={totalPrice}
                    beatIds={beatIds}
                    customerInfo={customerInfo}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={!isCustomerInfoValid}
                    themeColors={themeColors}
                  />
                )}

                {selectedPaymentMethod === "paypal" && (
                  <PayPalCheckout
                    amount={totalPrice}
                    beatIds={beatIds}
                    customerInfo={customerInfo}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={!isCustomerInfoValid}
                    themeColors={themeColors}
                  />
                )}

                {selectedPaymentMethod === "bank_transfer" && (
                  <Button
                    onClick={handleBankTransfer}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: 'white',
                    }}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2" />
                        Proceed with Bank Transfer - ${totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Payment Method Info */}
              <div className="text-xs text-center space-y-1" style={{ color: themeColors.textSecondary }}>
                {selectedPaymentMethod === "paypal" && (
                  <p>You'll be redirected to PayPal to complete your payment securely.</p>
                )}
                {selectedPaymentMethod === "stripe" && (
                  <p>Your payment is secured by Stripe. We don't store your card details.</p>
                )}
                {selectedPaymentMethod === "bank_transfer" && (
                  <p>You'll receive bank transfer instructions after placing your order. Payment requires manual approval.</p>
                )}
                <p>🔒 All payments are processed securely with industry-standard encryption.</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-yellow-600 font-medium">⚠️ Development Mode: Configure payment providers in admin settings before accepting real payments.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}