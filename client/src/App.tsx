import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetCode from "@/pages/VerifyResetCode";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import AdminUpload from "@/pages/AdminUpload";
import Contact from "@/pages/Contact";
import Bio from "@/pages/Bio";
import Plans from "@/pages/Plans";
import ExclusiveMusic from "@/pages/ExclusiveMusic";
import NotFound from "@/pages/not-found";
import Setup from "@/pages/Setup";

// Lazy load music pages for better performance
const MusicPage = lazy(() => import("@/pages/MusicPage"));
const GenreViewPage = lazy(() => import("@/pages/GenreViewPage"));
const Library = lazy(() => import("@/pages/Library"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
        <Route path="/setup" component={Setup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-reset-code" component={VerifyResetCode} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/upload" component={AdminUpload} />
      <Route path="/dashboard" component={ClientDashboard} />
      <Route path="/contact" component={Contact} />
      <Route path="/bio" component={Bio} />
      <Route path="/plans" component={Plans} />
      <Route path="/exclusive-music" component={ExclusiveMusic} />
      <Route path="/music">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <MusicPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/music/genre/:genreId">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <GenreViewPage />
          </Suspense>
        </ErrorBoundary>
      </Route>
      <Route path="/library">
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Library />
          </Suspense>
        </ErrorBoundary>
      </Route>
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
            <AudioPlayerProvider>
              <TooltipProvider>
                <div className="dark">
                  <Toaster />
                  <AppContent />
                </div>
              </TooltipProvider>
            </AudioPlayerProvider>
          </AudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
