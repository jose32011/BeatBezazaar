import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SiPaypal } from "react-icons/si";

export interface CartItem {
  id: string;
  title: string;
  producer: string;
  price: number;
  imageUrl: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
}

export default function Cart({ 
  isOpen, 
  onClose, 
  items = [],
  onRemoveItem,
  onCheckout 
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
        data-testid="overlay-cart"
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold font-display" data-testid="text-cart-title">
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
                        ${item.price.toFixed(2)}
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

              <Button
                size="lg"
                className="w-full gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white"
                onClick={onCheckout}
                data-testid="button-checkout"
              >
                <SiPaypal className="h-5 w-5" />
                Checkout with PayPal
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by PayPal
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
