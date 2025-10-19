import { X, Trash2, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SiPaypal } from "react-icons/si";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export interface CartItem {
  id: string;
  title: string;
  producer: string;
  price: number | string;
  imageUrl: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  onRemoveItem?: (id: string) => void;
  onCheckout?: (paymentMethod: string) => void;
}

export default function Cart({ 
  isOpen, 
  onClose, 
  items = [],
  onRemoveItem,
  onCheckout 
}: CartProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("paypal");
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 backdrop-blur-sm z-50"
        style={{ backgroundColor: `${themeColors.background}80` }}
        onClick={onClose}
        data-testid="overlay-cart"
      />
      
      <div 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l z-50 flex flex-col"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border
        }}
      >
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <h2 
            className="text-2xl font-bold font-display" 
            data-testid="text-cart-title"
            style={{ color: themeColors.text }}
          >
            Shopping Cart
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-muted-foreground text-center" data-testid="text-cart-empty">
              Your cart is empty
              <br />
              <span className="text-sm">Add some beats to get started!</span>
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 rounded-lg bg-background/50"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-16 w-16 rounded-md object-cover"
                      data-testid={`img-cart-${item.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" data-testid={`text-cart-title-${item.id}`}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-cart-producer-${item.id}`}>
                        {item.producer}
                      </p>
                      <p className="font-semibold mt-1" data-testid={`text-cart-price-${item.id}`}>
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem?.(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold font-display" data-testid="text-cart-subtotal">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              
              <Separator />

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment Method</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={selectedPaymentMethod === "paypal"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <SiPaypal className="h-5 w-5 text-[#0070ba]" />
                    <span className="flex-1">PayPal</span>
                    <span className="text-sm text-muted-foreground">Instant</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={selectedPaymentMethod === "bank_transfer"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="flex-1">Bank Transfer</span>
                    <span className="text-sm text-muted-foreground">Manual approval</span>
                  </label>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => onCheckout?.(selectedPaymentMethod)}
                data-testid="button-checkout"
                style={{
                  backgroundColor: selectedPaymentMethod === "paypal" ? "#0070ba" : "#2563eb",
                }}
              >
                {selectedPaymentMethod === "paypal" ? (
                  <>
                    <SiPaypal className="h-5 w-5" />
                    Checkout with PayPal
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5" />
                    Proceed with Bank Transfer
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {selectedPaymentMethod === "paypal" 
                  ? "Secure payment powered by PayPal"
                  : "Bank transfer requires manual approval. You'll receive instructions after checkout."
                }
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
