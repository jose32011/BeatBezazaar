import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppBranding } from "@/hooks/useAppBranding";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const { appName } = useAppBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState("");
  
  const themeColors = getThemeColors();
  const [formData, setFormData] = useState({
    username: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setUserId(data.userId);
      setSuccess(true);
      
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToVerification = () => {
    setLocation(`/verify-reset-code?userId=${userId}`);
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
            Reset your password
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
              {success ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription 
              className="text-center"
              style={{ color: themeColors.textSecondary }}
            >
              {success 
                ? "We've sent a verification code to your email address"
                : "Enter your username to receive a verification code"
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
                    htmlFor="username"
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
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-500/20 border-green-500/50">
                  <AlertDescription className="text-green-200">
                    Verification code has been sent to your email address. Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleContinueToVerification}
                  className="w-full"
                >
                  Continue to Verification
                </Button>
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
