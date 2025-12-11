import { ShoppingCart, Search, User, LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useState } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get app branding settings
  const { appName, appLogo } = useAppBranding();

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        backgroundColor: `${themeColors.background}90`,
        borderColor: themeColors.border
      }}
    >
      <div className="w-full px-4 sm:px-6 py-4">
        {/* Main Header */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2">
                {appLogo && (
                  <img 
                    src={appLogo} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain"
                  />
                )}
                <h1 
                  className="text-xl sm:text-2xl font-bold font-display cursor-pointer" 
                  data-testid="text-logo"
                  style={{ color: themeColors.primary }}
                >
                  {appName}
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base" data-testid="button-home">
                Home
              </Button>
            </Link>
            <Link href="/music">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base" data-testid="button-music">
                Music
              </Button>
            </Link>
            {user && (
              <Link href="/library">
                <Button variant="ghost" size="sm" className="text-sm xl:text-base" data-testid="button-library">
                  Library
                </Button>
              </Link>
            )}
            <Link href="/bio">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base">
                Bio
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base">
                Plans
              </Button>
            </Link>
            <Link href="/exclusive-music">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base flex items-center gap-1">
                <span className="text-yellow-500">👑</span>
                Exclusive
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-sm xl:text-base">
                Contact
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin/upload">
                <Button variant="ghost" size="sm" className="text-sm xl:text-base" data-testid="button-upload">
                  Upload
                </Button>
              </Link>
            )}
          </nav>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-4">
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart */}
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

            {/* User Menu / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" data-testid="button-user-menu">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
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
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 hidden sm:flex text-xs sm:text-sm px-2 sm:px-3">
                  <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: themeColors.textSecondary }}
            />
            <Input
              type="search"
              placeholder="Search beats..."
              className="pl-10"
              data-testid="input-search-mobile"
              style={{
                backgroundColor: themeColors.inputBackground,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden mt-4 py-4 border-t"
            style={{ borderColor: themeColors.border }}
          >
            <nav className="flex flex-col space-y-1 sm:space-y-2">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10" data-testid="button-home-mobile">
                  Home
                </Button>
              </Link>
              <Link href="/music" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10" data-testid="button-music-mobile">
                  Music
                </Button>
              </Link>
              {user && (
                <Link href="/library" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10" data-testid="button-library-mobile">
                    Library
                  </Button>
                </Link>
              )}
              <Link href="/bio" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10">
                  Bio
                </Button>
              </Link>
              <Link href="/plans" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10">
                  Plans
                </Button>
              </Link>
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10">
                  Contact
                </Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin/upload" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm sm:text-base h-8 sm:h-10" data-testid="button-upload-mobile">
                    Upload
                  </Button>
                </Link>
              )}
              {!user && (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-1 sm:gap-2 text-sm sm:text-base h-8 sm:h-10">
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
