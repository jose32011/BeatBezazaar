import { useState } from "react";
import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import type { Beat } from "@shared/schema";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, cartCount, removeFromCart, clearCart } = useCart();
  const { getThemeColors } = useTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const themeColors = getThemeColors();

  const totalPrice = cart.reduce((sum, beat) => sum + beat.price, 0);

  const handleCheckout = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    // TODO: Implement checkout flow
    // For now, navigate to a checkout page or show checkout modal
    onClose();
    setLocation("/checkout");
  };

  const handleContinueShopping = () => {
    onClose();
    setLocation("/music");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ease-in-out shadow-2xl"
        style={{
          backgroundColor: themeColors.background,
          borderLeft: `1px solid ${themeColors.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: themeColors.primary }} />
            <h2 className="text-lg font-semibold" style={{ color: themeColors.text }}>
              Shopping Cart
            </h2>
            {cartCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cartCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-full">
          {cart.length === 0 ? (
            /* Empty Cart */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart 
                className="h-16 w-16 mb-4" 
                style={{ color: themeColors.textSecondary }} 
              />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: themeColors.text }}
              >
                Your cart is empty
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ color: themeColors.textSecondary }}
              >
                Add some beats to get started!
              </p>
              <Button
                onClick={handleContinueShopping}
                style={{
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                Browse Music
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.map((beat) => (
                  <div
                    key={beat.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    }}
                  >
                    {/* Beat Image */}
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

                    {/* Beat Info */}
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-sm truncate"
                        style={{ color: themeColors.text }}
                      >
                        {beat.title}
                      </h4>
                      <p 
                        className="text-xs truncate"
                        style={{ color: themeColors.textSecondary }}
                      >
                        by {beat.producer}
                      </p>
                      <p 
                        className="text-sm font-semibold mt-1"
                        style={{ color: themeColors.primary }}
                      >
                        ${beat.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(beat.id)}
                      className="h-8 w-8 flex-shrink-0"
                      style={{ color: themeColors.textSecondary }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div
                className="border-t p-4 space-y-4"
                style={{ borderColor: themeColors.border }}
              >
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span 
                    className="text-lg font-semibold"
                    style={{ color: themeColors.text }}
                  >
                    Total:
                  </span>
                  <span 
                    className="text-xl font-bold"
                    style={{ color: themeColors.primary }}
                  >
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <Separator style={{ backgroundColor: themeColors.border }} />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`,
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleContinueShopping}
                      variant="outline"
                      className="flex-1"
                      style={{
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                      Continue Shopping
                    </Button>
                    
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      className="flex-1"
                      style={{
                        borderColor: themeColors.border,
                        color: themeColors.textSecondary,
                      }}
                    >
                      Clear Cart
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}