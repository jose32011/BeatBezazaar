import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SiPaypal } from "react-icons/si";

interface PayPalCheckoutProps {
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

export default function PayPalCheckout({
  amount,
  beatIds,
  customerInfo,
  onSuccess,
  onError,
  disabled,
  themeColors
}: PayPalCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load PayPal SDK
    const loadPayPalSDK = async () => {
      try {
        // Get PayPal client ID from server
        const response = await fetch('/api/paypal/config');
        if (response.ok) {
          const { clientId, sandbox } = await response.json();
          if (clientId) {
            // Load PayPal SDK script
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD${sandbox ? '&debug=true' : ''}`;
            script.onload = () => setPaypalLoaded(true);
            document.head.appendChild(script);
          }
        }
      } catch (error) {
        console.error('Failed to load PayPal SDK:', error);
      }
    };

    loadPayPalSDK();
  }, []);

  const handlePayPalPayment = async () => {
    setIsProcessing(true);

    try {
      // Create PayPal order
      const response = await fetch('/api/paypal/create-order', {
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
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const { orderID, approvalUrl } = await response.json();

      // Redirect to PayPal for approval
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PayPal payment failed';
      onError(errorMessage);
      toast({
        title: "PayPal Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayPalPayment}
      disabled={disabled || isProcessing || !paypalLoaded}
      className="w-full"
      size="lg"
      style={{
        backgroundColor: "#0070ba",
        color: 'white',
      }}
    >
      {isProcessing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Redirecting to PayPal...
        </div>
      ) : (
        <>
          <SiPaypal className="h-5 w-5 mr-2" />
          Pay ${amount.toFixed(2)} with PayPal
        </>
      )}
    </Button>
  );
}