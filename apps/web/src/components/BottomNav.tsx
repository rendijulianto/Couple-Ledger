import { Home, Receipt, Plus, PieChart, Settings } from "lucide-react";

export type TabType = "home" | "transactions" | "reports" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  onOpenQuickAdd,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-canvas/95 backdrop-blur-md border-t border-hairline px-3 py-1.5 flex items-center justify-around safe-area-bottom">
      {/* Tab 1: Home */}
      <button
        type="button"
        onClick={() => onTabChange("home")}
        className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
          activeTab === "home"
            ? "text-rausch font-semibold"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Beranda</span>
      </button>

      {/* Tab 2: Transactions */}
      <button
        type="button"
        onClick={() => onTabChange("transactions")}
        className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
          activeTab === "transactions"
            ? "text-rausch font-semibold"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <Receipt className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Riwayat</span>
      </button>

      {/* Center Floating Action Button: + Catat */}
      <div className="-mt-5 flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="w-13 h-13 p-3.5 rounded-full bg-rausch hover:bg-rausch-active text-white shadow-float flex items-center justify-center active:scale-95 transition-all focus:outline-none"
          aria-label="Tambah Transaksi Cepat"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        <span className="text-[10px] font-medium text-ink mt-0.5">Catat</span>
      </div>

      {/* Tab 3: Reports */}
      <button
        type="button"
        onClick={() => onTabChange("reports")}
        className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
          activeTab === "reports"
            ? "text-rausch font-semibold"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <PieChart className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Laporan</span>
      </button>

      {/* Tab 4: Settings */}
      <button
        type="button"
        onClick={() => onTabChange("settings")}
        className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
          activeTab === "settings"
            ? "text-rausch font-semibold"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Setelan</span>
      </button>
    </nav>
  );
}
