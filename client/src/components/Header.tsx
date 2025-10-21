import { ShoppingCart, Search, User, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export default function Header({ cartCount = 0, onCartClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        backgroundColor: `${themeColors.background}90`,
        borderColor: themeColors.border
      }}
    >
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 
                className="text-2xl font-bold font-display cursor-pointer" 
                data-testid="text-logo"
                style={{ color: themeColors.primary }}
              >
                Beat-Bazaar
              </h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-browse">
                  Browse
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin/upload">
                  <Button variant="ghost" size="sm" data-testid="button-upload">
                    Upload
                  </Button>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
                style={{ color: themeColors.textSecondary }}
              />
              <Input
                type="search"
                placeholder="Search beats..."
                className="pl-10"
                data-testid="input-search"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-user-menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                >
                  <div 
                    className="px-2 py-1.5 text-sm"
                    style={{ color: themeColors.textSecondary }}
                  >
                    {user.username}
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "admin" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/upload" className="cursor-pointer">
                          Upload Beat
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="button-logout">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
