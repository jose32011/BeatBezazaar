import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const { appName } = useAppBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  
  const themeColors = getThemeColors();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Get userId and code from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    const codeParam = urlParams.get('code');
    
    if (userIdParam && codeParam) {
      setUserId(userIdParam);
      setCode(codeParam);
    } else {
      // Redirect to forgot password if no params
      setLocation("/forgot-password");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          code,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      
      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully.",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
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
            {success ? "Password Reset Complete" : "Reset Your Password"}
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
              {success ? "Success!" : "Create New Password"}
            </CardTitle>
            <CardDescription 
              className="text-center"
              style={{ color: themeColors.textSecondary }}
            >
              {success 
                ? "Your password has been updated successfully"
                : "Enter your new password below"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="bg-red-500/20 border-red-500/50">
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label 
                    htmlFor="newPassword"
                    style={{ color: themeColors.text }}
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock 
                      className="absolute left-3 top-3 h-4 w-4" 
                      style={{ color: themeColors.textSecondary }}
                    />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="confirmPassword"
                    style={{ color: themeColors.text }}
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock 
                      className="absolute left-3 top-3 h-4 w-4" 
                      style={{ color: themeColors.textSecondary }}
                    />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-500/20 border-green-500/50">
                  <AlertDescription className="text-green-200 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Password updated successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="flex items-center justify-center text-sm text-blue-400 hover:text-blue-300 underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
