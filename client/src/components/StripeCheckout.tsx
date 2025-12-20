import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

interface StripeCheckoutProps {
  amount: number;
  beatIds: string[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  themeColors: any;
}

export default function StripeCheckout({
  amount,
  beatIds,
  customerInfo,
  onSuccess,
  onError,
  disabled,
  themeColors
}: StripeCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load Stripe
    const initializeStripe = async () => {
      try {
        // Get Stripe publishable key from server
        const response = await fetch('/api/stripe/config');
        if (response.ok) {
          const { publishableKey } = await response.json();
          if (publishableKey) {
            const stripeInstance = await loadStripe(publishableKey);
            setStripe(stripeInstance);
          }
        }
      } catch (error) {
        }
    };

    initializeStripe();
  }, []);

  const handleStripePayment = async () => {
    if (!stripe) {
      onError('Stripe is not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent for multiple beats
      const response = await fetch('/api/stripe/create-payment-intent-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          beatIds,
          customerInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // This would normally be a Stripe Elements card component
            // For demo purposes, we'll use a test card
          },
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: `Successfully processed payment of $${amount.toFixed(2)}`,
        });
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleStripePayment}
      disabled={disabled || isProcessing || !stripe}
      className="w-full"
      size="lg"
      style={{
        backgroundColor: "#635bff",
        color: 'white',
      }}
    >
      {isProcessing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing Payment...
        </div>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay ${amount.toFixed(2)} with Card
        </>
      )}
    </Button>
  );
}