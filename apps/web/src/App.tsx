import { useState, lazy, Suspense } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { RouterProvider, useRouter } from "./lib/router";
import { Navbar } from "./components/Navbar";
import { BottomNav, type TabType } from "./components/BottomNav";
import { QuickAddModal } from "./components/QuickAddModal";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsPage } from "./pages/TermsPage";
import { AboutDeveloperPage } from "./pages/AboutDeveloperPage";

// Code splitting / Lazy-load heavy dashboard tabs
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const TransactionsPage = lazy(() =>
  import("./pages/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function TabFallback() {
  return (
    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-ink-muted">
      <div className="w-8 h-8 rounded-full bg-rausch/10 text-rausch flex items-center justify-center animate-pulse">
        <Heart className="w-4 h-4 fill-rausch" />
      </div>
      <p className="text-xs font-medium">Memuat...</p>
    </div>
  );
}

function AppMain() {
  const { user, activeWorkspace, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full bg-rausch/10 text-rausch flex items-center justify-center animate-pulse mb-3">
          <Heart className="w-6 h-6 fill-rausch" />
        </div>
        <p className="text-xs font-semibold text-ink-muted">
          Memuat Couple Ledger...
        </p>
      </div>
    );
  }

  // If user is not logged in or has no active workspace yet
  if (!user || !activeWorkspace) {
    return <AuthPage initialMode="login" />;
  }

  const handleQuickAddSuccess = () => {
    void queryClient.invalidateQueries();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col max-w-md mx-auto border-x border-hairline-soft shadow-sm relative">
      {/* Top Mobile Sticky Navbar */}
      <Navbar />

      {/* Main Tab Screen Content with Suspense */}
      <main className="flex-1 overflow-x-hidden">
        <Suspense fallback={<TabFallback />}>
          {activeTab === "home" && (
            <HomePage
              key={`home-${refreshKey}`}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onNavigateToTransactions={() => setActiveTab("transactions")}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionsPage key={`tx-${refreshKey}`} />
          )}
          {activeTab === "reports" && (
            <ReportsPage key={`rep-${refreshKey}`} />
          )}
          {activeTab === "settings" && <SettingsPage />}
        </Suspense>
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Global Fast Record Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}

function AppRoutes() {
  const { pathname } = useRouter();
  const { user, activeWorkspace, isLoading } = useAuth();

  // Legal & Public Informational Pages
  if (pathname === "/kebijakan-privasi" || pathname === "/privacy") {
    return <PrivacyPolicyPage />;
  }

  if (pathname === "/syarat-ketentuan" || pathname === "/terms") {
    return <TermsPage />;
  }

  if (
    pathname === "/tentang" ||
    pathname === "/pengembang" ||
    pathname === "/about" ||
    pathname === "/developer"
  ) {
    return <AboutDeveloperPage />;
  }

  // Auth pages
  if (pathname === "/masuk" || pathname === "/login") {
    if (!isLoading && user && activeWorkspace) {
      return <AppMain />;
    }
    return <AuthPage initialMode="login" />;
  }

  if (pathname === "/daftar" || pathname === "/register") {
    if (!isLoading && user && activeWorkspace) {
      return <AppMain />;
    }
    return <AuthPage initialMode="register" />;
  }

  // Dedicated App Dashboard route
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return <AppMain />;
  }

  // Default: Public Homepage / Landing Page
  return <LandingPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <RealtimeProvider>
              <RouterProvider>
                <AppRoutes />
              </RouterProvider>
            </RealtimeProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
