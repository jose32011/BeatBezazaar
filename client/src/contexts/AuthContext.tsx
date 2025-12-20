import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  passwordChangeRequired?: boolean;
  theme?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  showPasswordChangeModal: boolean;
  setShowPasswordChangeModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If the user changed (different ID), invalidate user-specific cache
        if (user && user.id !== data.user.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/playlist'] });
          queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
          queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        }
        
        setUser(data.user);
      } else {
        // If user was logged in but now isn't, clear cache
        if (user) {
          queryClient.clear();
        }
        setUser(null);
      }
    } catch (error) {
      // If there was an error and user was logged in, clear cache
      if (user) {
        queryClient.clear();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    
    // Invalidate user-specific cached data when user logs in
    queryClient.invalidateQueries({ queryKey: ['/api/playlist'] });
    queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
    queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    
    // Show password change modal if password change is required
    if (userData.passwordChangeRequired) {
      setShowPasswordChangeModal(true);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      } finally {
      setUser(null);
      
      // Clear all cached data when user logs out
      queryClient.clear();
      
      setLocation("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user, showPasswordChangeModal, setShowPasswordChangeModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && requireAdmin && user?.role !== "admin") {
      setLocation("/"); // Redirect non-admin users to home page
    }
  }, [user, isLoading, requireAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
