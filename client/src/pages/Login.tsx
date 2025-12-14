import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login: setUser } = useAuth();
  const { getThemeColors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const themeColors = getThemeColors();

  // Get app branding settings
  const { appName, loginTitle, loginSubtitle, loginImage } = useAppBranding();
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const user: User = data.user;
      
      // Update the global auth state
      setUser(user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });

      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        // Redirect based on role
        if (user.role === "admin") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/"); // Redirect customers to home page
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const user: User = data.user;
      
      // Update the global auth state
      setUser(user);
      
      toast({
        title: "Registration successful",
        description: `Welcome to ${appName}, ${user.username}!`,
      });

      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        setLocation("/"); // Redirect new customers to home page
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: themeColors.background }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music 
              className="h-12 w-12" 
              style={{ color: themeColors.text }}
            />
            <h1 
              className="text-3xl font-bold ml-2"
              style={{ color: themeColors.text }}
            >
              {appName}
            </h1>
          </div>
          <p style={{ color: themeColors.textSecondary }}>
            Your premium beat marketplace
          </p>
        </div>

        <Card 
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text
          }}
        >
          <CardHeader>
            <CardTitle 
              className="text-center"
              style={{ color: themeColors.text }}
            >
              {loginTitle}
            </CardTitle>
            <CardDescription 
              className="text-center"
              style={{ color: themeColors.textSecondary }}
            >
              {loginSubtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList 
                className="grid w-full grid-cols-2"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border
                }}
              >
                <TabsTrigger 
                  value="login"
                  style={{
                    color: themeColors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  style={{
                    color: themeColors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label 
                      htmlFor="login-username"
                      style={{ color: themeColors.text }}
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <User 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="login-password"
                      style={{ color: themeColors.text }}
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setLocation("/forgot-password")}
                      className="text-sm underline hover:opacity-80"
                      style={{ color: themeColors.text }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <Alert className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-red-200">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label 
                      htmlFor="register-username"
                      style={{ color: themeColors.text }}
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <User 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="register-email"
                      style={{ color: themeColors.text }}
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="register-password"
                      style={{ color: themeColors.text }}
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="register-confirm-password"
                      style={{ color: themeColors.text }}
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-3 top-3 h-4 w-4" 
                        style={{ color: themeColors.textSecondary }}
                      />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label 
                        htmlFor="register-first-name"
                        style={{ color: themeColors.text }}
                      >
                        First Name
                      </Label>
                      <Input
                        id="register-first-name"
                        type="text"
                        placeholder="First name"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label 
                        htmlFor="register-last-name"
                        style={{ color: themeColors.text }}
                      >
                        Last Name
                      </Label>
                      <Input
                        id="register-last-name"
                        type="text"
                        placeholder="Last name"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="register-phone"
                      style={{ color: themeColors.text }}
                    >
                      Phone (Optional)
                    </Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="Phone number"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>







                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
             
              </TabsContent>
            </Tabs>
          </CardContent>
          <div className="text-center mt-2 mb-5">
            <a 
              href="/" 
              className="text-sm hover:opacity-80"
              style={{ color: themeColors.textSecondary }}
            >
              Home
            </a>
          </div>
        </Card>

       
      </div>
    </div>
  );
}
