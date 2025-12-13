import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Beat } from "@shared/schema";

interface CartContextType {
  cart: Beat[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (beatId: string) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  openCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch user's cart
  const { data: cart = [], isLoading } = useQuery<Beat[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/cart", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch cart");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds - cart changes frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (beatId: string) => {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ beatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Beat has been added to your cart",
      });
    },
    onError: (error) => {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add beat to cart",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (beatId: string) => {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ beatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from cart");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Removed from cart",
        description: "Beat has been removed from your cart",
      });
    },
    onError: (error) => {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove beat from cart",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: (error) => {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (beatId: string) => {
    if (!user) {
      setLocation("/login");
      return;
    }
    addToCartMutation.mutate(beatId);
  };

  const handleRemoveFromCart = (beatId: string) => {
    removeFromCartMutation.mutate(beatId);
  };

  const handleClearCart = () => {
    clearCartMutation.mutate();
  };

  const isInCart = (beatId: string) => {
    return cart.some((item) => item.id === beatId);
  };

  const openCart = () => {
    setIsCartOpen(true);
    // TODO: Implement cart modal/drawer
    // For now, navigate to a cart page or show a toast
    toast({
      title: "Cart",
      description: `You have ${cart.length} item(s) in your cart`,
    });
  };

  const value: CartContextType = {
    cart,
    cartCount: cart.length,
    isLoading,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    clearCart: handleClearCart,
    isInCart,
    openCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}