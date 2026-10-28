import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GuestGateProvider } from "@/context/GuestGateContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { UserListingsProvider } from "@/context/UserListingsContext";
import { ChatProvider } from "@/context/ChatContext";
import { SavedProvider } from "@/context/SavedContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { SellerCompareProvider } from "@/context/SellerCompareContext";
import { PriceAlertProvider } from "@/context/PriceAlertContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ListingDetailRoute from "./pages/ListingDetailRoute";
import SavedListingsPage from "./pages/SavedListingsPage";
import RecentlyViewedPage from "./pages/RecentlyViewedPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import SellerComparePage from "./pages/SellerComparePage";
import PriceAlertsPage from "./pages/PriceAlertsPage";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import SellerCompareBar from "@/components/compare/SellerCompareBar";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const BrowseRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
};

const GUEST_BROWSE_SECTIONS = new Set([
  'marketplace', 'jobs', 'services', 'events', 'transport', 'real-estate', 'reels', 'business',
]);

const SectionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams<{ section?: string }>();
  const section = params.section ?? '';
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!GUEST_BROWSE_SECTIONS.has(section) && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

document.title = "Buzzer — Community Platform";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

const ThemeInitializer = () => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeInitializer />
    <AuthProvider>
      <BrowserRouter>
        <GuestGateProvider>
        <ChatProvider>
        <UserListingsProvider>
        <SavedProvider>
        <ReviewsProvider>
        <RecentlyViewedProvider>
        <PriceAlertProvider>
        <SellerCompareProvider>
        <SidebarProvider>
          <div className="w-full h-full">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Index />} />

                  {/* Dashboard sections — browse sections open to guests, others require auth */}
                  <Route path="/dashboard/saved"           element={<ProtectedRoute><SavedListingsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/recently-viewed" element={<ProtectedRoute><RecentlyViewedPage /></ProtectedRoute>} />
                  <Route path="/dashboard/compare"         element={<ProtectedRoute><SellerComparePage /></ProtectedRoute>} />
                  <Route path="/dashboard/price-alerts"    element={<ProtectedRoute><PriceAlertsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/dashboard"                 element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/:section"        element={<SectionRoute><Dashboard /></SectionRoute>} />

                  {/* Listing detail + seller profile — browsable, interactions gated */}
                  <Route path="/dashboard/seller/:sellerName" element={<BrowseRoute><SellerProfilePage /></BrowseRoute>} />
                  <Route path="/dashboard/:section/:id"       element={<BrowseRoute><ListingDetailRoute /></BrowseRoute>} />

                  <Route path="/admin" element={<Admin />} />

                  {/* Auth */}
                  <Route path="/auth"               element={<AuthPage />} />
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/setup" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/food"  element={<Navigate to="/dashboard" replace />} />
                  <Route path="/taxi"  element={<Navigate to="/dashboard" replace />} />

                  {/* Legacy section redirects */}
                  <Route path="/messages"    element={<Navigate to="/dashboard/messages"    replace />} />
                  <Route path="/marketplace" element={<Navigate to="/dashboard/marketplace" replace />} />
                  <Route path="/jobs"        element={<Navigate to="/dashboard/jobs"        replace />} />
                  <Route path="/services"    element={<Navigate to="/dashboard/services"    replace />} />
                  <Route path="/real-estate" element={<Navigate to="/dashboard/real-estate" replace />} />
                  <Route path="/transport"   element={<Navigate to="/dashboard/transport"   replace />} />
                  <Route path="/events"      element={<Navigate to="/dashboard/events"      replace />} />
                  <Route path="/settings"    element={<Navigate to="/dashboard/settings"    replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
              <SellerCompareBar />
            </TooltipProvider>
          </div>
        </SidebarProvider>
        </SellerCompareProvider>
        </PriceAlertProvider>
        </RecentlyViewedProvider>
        </ReviewsProvider>
        </SavedProvider>
        </UserListingsProvider>
        </ChatProvider>
        </GuestGateProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
