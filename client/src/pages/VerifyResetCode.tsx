import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function VerifyResetCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState("");
  
  const themeColors = getThemeColors();
  const [formData, setFormData] = useState({
    code: "",
  });

  useEffect(() => {
    // Get userId from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    if (userIdParam) {
      setUserId(userIdParam);
    } else {
      // Redirect to forgot password if no userId
      setLocation("/forgot-password");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.code.length !== 6) {
      setError("Verification code must be 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          code: formData.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      setSuccess(true);
      
      toast({
        title: "Code verified",
        description: "Verification code is valid. You can now reset your password.",
      });

      // Redirect to password reset page after a short delay
      setTimeout(() => {
        setLocation(`/reset-password?userId=${userId}&code=${formData.code}`);
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "resend", // This will be handled by getting user from userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification code");
      }

      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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
              BeatBazaar
            </h1>
          </div>
          <p style={{ color: themeColors.textSecondary }}>
            Enter verification code
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
              {success ? "Code Verified!" : "Enter Verification Code"}
            </CardTitle>
            <CardDescription 
              className="text-center"
              style={{ color: themeColors.textSecondary }}
            >
              {success 
                ? "Redirecting to password reset..."
                : "Please enter the 6-digit code sent to your email"
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
                    htmlFor="code"
                    style={{ color: themeColors.text }}
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.code}
                    onChange={(e) => {
                      // Only allow digits and limit to 6 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData({ ...formData, code: value });
                    }}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || formData.code.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-400 hover:text-blue-300 underline flex items-center justify-center mx-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Resend Code
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-500/20 border-green-500/50">
                  <AlertDescription className="text-green-200">
                    Verification successful! Redirecting to password reset...
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setLocation("/forgot-password")}
                className="flex items-center justify-center text-sm text-blue-400 hover:text-blue-300 underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Forgot Password
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
