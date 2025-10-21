import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AudioProvider } from "@/contexts/AudioContext";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetCode from "@/pages/VerifyResetCode";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import AdminUpload from "@/pages/AdminUpload";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-reset-code" component={VerifyResetCode} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/upload" component={AdminUpload} />
      <Route path="/dashboard" component={ClientDashboard} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { showPasswordChangeModal, setShowPasswordChangeModal, user } = useAuth();

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChangeModal(false);
    // Refresh the user data to clear the passwordChangeRequired flag
    window.location.reload();
  };

  return (
    <>
      <Router />
      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        isRequired={user?.passwordChangeRequired}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AudioProvider>
            <TooltipProvider>
              <div className="dark">
                <Toaster />
                <AppContent />
              </div>
            </TooltipProvider>
          </AudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
