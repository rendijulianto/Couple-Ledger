import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { Navbar } from "./components/Navbar";
import { BottomNav, type TabType } from "./components/BottomNav";
import { QuickAddModal } from "./components/QuickAddModal";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
    return <AuthPage />;
  }

  const handleQuickAddSuccess = () => {
    void queryClient.invalidateQueries();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col max-w-md mx-auto border-x border-hairline-soft shadow-sm relative">
      {/* Top Mobile Sticky Navbar */}
      <Navbar />

      {/* Main Tab Screen Content */}
      <main className="flex-1 overflow-x-hidden">
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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <RealtimeProvider>
              <AppMain />
            </RealtimeProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
