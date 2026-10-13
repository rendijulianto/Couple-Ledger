import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Users,
  User,
  Heart,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "@couple-ledger/shared";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { CategoryIcon } from "../components/CategoryIcon";

interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME";
  amountIdr: number;
  occurredOn: string;
  category: { id: string; name: string; color: string; icon?: string };
  createdBy: { id: string; name: string };
}

export function ReportsPage() {
  const { user, activeWorkspace } = useAuth();
  const { currentTheme } = useTheme();

  // Airbnb palette accents for charts, starting with user's selected primary theme color
  const chartColors = [
    currentTheme.hex,
    "#008489", // Teal
    "#d93b30", // Vermilion
    "#fc642d", // Orange
    "#484848", // Charcoal
    "#8ce071", // Lime
    "#7b0051", // Plum
    "#2b6cb0", // Blue
    "#ecc94b", // Yellow
    "#9f7aea", // Purple
  ];

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [viewScope, setViewScope] = useState<"ALL" | "ME" | "PARTNER">("ALL");

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);

    try {
      const res = await api.transactions.get({
        query: {
          workspaceId: activeWorkspace.id,
          month: selectedMonth,
          limit: 250,
        },
      });

      if (res.data?.success && res.data.data) {
        setTransactions(res.data.data as TransactionItem[]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTransactions();
  }, [activeWorkspace?.id, selectedMonth]);

  const handlePrevMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const newDate = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const newDate = new Date(year, month, 1);
    setSelectedMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const partner = activeWorkspace?.members.find((m) => m.userId !== user?.id);
  const partnerFirstName = partner?.name ? partner.name.split(" ")[0] : "Pasangan";

  // Filter transactions based on viewScope (ALL / ME / PARTNER)
  const scopedTransactions = transactions.filter((t) => {
    if (viewScope === "ME") return t.createdBy.id === user?.id;
    if (viewScope === "PARTNER") return t.createdBy.id === partner?.userId;
    return true; // "ALL"
  });

  // Group scoped expenses by category
  const scopedExpenses = scopedTransactions.filter((t) => t.type === "EXPENSE");
  const scopedTotalExpense = scopedExpenses.reduce((acc, t) => acc + t.amountIdr, 0);

  const scopedIncomes = scopedTransactions.filter((t) => t.type === "INCOME");
  const scopedTotalIncome = scopedIncomes.reduce((acc, t) => acc + t.amountIdr, 0);
  const scopedNetCashflow = scopedTotalIncome - scopedTotalExpense;

  const categoryAgg: Record<
    string,
    { name: string; amount: number; color?: string; icon?: string }
  > = {};
  scopedExpenses.forEach((t) => {
    const catName = t.category.name;
    if (!categoryAgg[catName]) {
      categoryAgg[catName] = {
        name: catName,
        amount: 0,
        color: t.category.color,
        icon: t.category.icon,
      };
    }
    const current = categoryAgg[catName];
    if (current) {
      current.amount += t.amountIdr;
    }
  });

  const categoryData = Object.values(categoryAgg)
    .sort((a, b) => b.amount - a.amount)
    .map((item, idx) => ({
      ...item,
      color: item.color || chartColors[idx % chartColors.length]!,
      percentage:
        scopedTotalExpense > 0 ? Math.round((item.amount / scopedTotalExpense) * 100) : 0,
    }));

  // Overall Member Contribution Breakdown (Always calculated across all workspace expenses)
  const allExpenses = transactions.filter((t) => t.type === "EXPENSE");
  const allTotalExpense = allExpenses.reduce((acc, t) => acc + t.amountIdr, 0);

  const myExpenses = allExpenses
    .filter((t) => t.createdBy.id === user?.id)
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const partnerExpenses = allExpenses
    .filter((t) => t.createdBy.id === partner?.userId)
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const myPercentage =
    allTotalExpense > 0 ? Math.round((myExpenses / allTotalExpense) * 100) : 50;
  const partnerPercentage = 100 - myPercentage;

  // Comparison Bar Chart Data (Inflow vs Outflow based on scoped data)
  const comparisonData = [
    {
      name:
        viewScope === "ALL"
          ? "Gabungan"
          : viewScope === "ME"
            ? "Aku"
            : partnerFirstName,
      Pemasukan: scopedTotalIncome,
      Pengeluaran: scopedTotalExpense,
    },
  ];

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedMonth}-01`));

  const scopeBadgeLabel =
    viewScope === "ALL"
      ? "Gabungan"
      : viewScope === "ME"
        ? "Catatan Aku"
        : `Catatan ${partnerFirstName}`;

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Month Carousel */}
      <div className="flex items-center justify-between bg-surface-soft border border-hairline rounded-sm px-3 py-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-full text-ink-muted hover:text-ink active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-ink capitalize tracking-wide">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-full text-ink-muted hover:text-ink active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scope Selector: Gabungan / Aku / Pasangan */}
      <div className="bg-surface-soft p-1 rounded-full border border-hairline grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setViewScope("ALL")}
          className={`py-2 px-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
            viewScope === "ALL"
              ? "bg-canvas text-ink shadow-xs border border-hairline"
              : "text-ink-muted hover:text-ink active:scale-95"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Gabungan</span>
        </button>

        <button
          type="button"
          onClick={() => setViewScope("ME")}
          className={`py-2 px-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
            viewScope === "ME"
              ? "bg-canvas text-ink shadow-xs border border-hairline"
              : "text-ink-muted hover:text-ink active:scale-95"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Aku</span>
        </button>

        <button
          type="button"
          disabled={!partner}
          onClick={() => partner && setViewScope("PARTNER")}
          title={!partner ? "Pasangan belum bergabung ke ruang keuangan" : undefined}
          className={`py-2 px-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
            !partner
              ? "opacity-40 cursor-not-allowed text-ink-muted"
              : viewScope === "PARTNER"
                ? "bg-canvas text-ink shadow-xs border border-hairline"
                : "text-ink-muted hover:text-ink active:scale-95"
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rausch" />
          <span className="truncate">{partnerFirstName}</span>
        </button>
      </div>

      {/* Quick Summary Pill for Selected Scope */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-canvas border border-hairline rounded-md p-2.5 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Pemasukan</span>
          </div>
          <div className="text-xs font-bold text-ink mt-1 truncate">
            {formatRupiah(scopedTotalIncome)}
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-md p-2.5 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-rausch uppercase tracking-wider">
            <ArrowUpRight className="w-3 h-3" />
            <span>Pengeluaran</span>
          </div>
          <div className="text-xs font-bold text-ink mt-1 truncate">
            {formatRupiah(scopedTotalExpense)}
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-md p-2.5 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
            <Wallet className="w-3 h-3" />
            <span>Arus Bersih</span>
          </div>
          <div
            className={`text-xs font-bold mt-1 truncate ${
              scopedNetCashflow >= 0 ? "text-emerald-600" : "text-rausch"
            }`}
          >
            {scopedNetCashflow >= 0
              ? `+${formatRupiah(scopedNetCashflow)}`
              : formatRupiah(scopedNetCashflow)}
          </div>
        </div>
      </div>

      {/* Category Donut Breakdown Card */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <PieIcon className="w-3.5 h-3.5" />
              Pengeluaran
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-surface-soft text-ink-muted border border-hairline">
              {scopeBadgeLabel}
            </span>
          </div>
          <span className="text-xs font-bold text-rausch">
            {formatRupiah(scopedTotalExpense)}
          </span>
        </div>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-xs text-ink-muted">
            Memuat grafik...
          </div>
        ) : categoryData.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-xs text-ink-muted text-center px-4">
            <p>
              Belum ada data pengeluaran untuk {viewScope === "ALL" ? "gabungan" : viewScope === "ME" ? "kamu" : partnerFirstName} di bulan ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatRupiah(val)}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #dddddd",
                      fontSize: "12px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown rows */}
            <div className="space-y-2 border-t border-hairline pt-3">
              {categoryData.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      icon={cat.icon}
                      color={cat.color}
                      name={cat.name}
                      size="xs"
                    />
                    <span className="text-ink font-medium">{cat.name}</span>
                    <span className="text-[10px] text-ink-muted">
                      ({cat.percentage}%)
                    </span>
                  </div>
                  <span className="font-bold text-ink">
                    {formatRupiah(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Cash Flow Comparison Bar Chart */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Perbandingan Arus Kas
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-surface-soft text-ink-muted border border-hairline">
              {scopeBadgeLabel}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-ink-muted">Net: </span>
            <span
              className={`text-xs font-bold ${
                scopedNetCashflow >= 0 ? "text-emerald-600" : "text-rausch"
              }`}
            >
              {scopedNetCashflow >= 0
                ? `+${formatRupiah(scopedNetCashflow)}`
                : formatRupiah(scopedNetCashflow)}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-44 flex items-center justify-center text-xs text-ink-muted">
            Memuat grafik...
          </div>
        ) : scopedTotalIncome === 0 && scopedTotalExpense === 0 ? (
          <div className="h-36 flex items-center justify-center text-xs text-ink-muted text-center px-4">
            Belum ada arus kas (pemasukan & pengeluaran) untuk filter ini.
          </div>
        ) : (
          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: number) => formatRupiah(val)}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #dddddd",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill={currentTheme.hex} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Couple Transparency Card (Who Recorded What) */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Keterbukaan Berdua (Pencatatan)
          </span>
        </div>

        <p className="text-xs text-ink-muted">
          Porsi pengeluaran yang dicatat oleh masing-masing pasangan bulan ini:
        </p>

        {/* Dual Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-surface-strong h-3 rounded-full flex overflow-hidden">
            <div
              className="transition-all duration-300"
              style={{ width: `${myPercentage}%`, backgroundColor: currentTheme.hex }}
              title={`Kamu: ${myPercentage}%`}
            />
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${partnerPercentage}%` }}
              title={`Pasangan: ${partnerPercentage}%`}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentTheme.hex }}
              />
              <span className="font-semibold text-ink">
                Kamu ({myPercentage}%)
              </span>
              <span className="text-ink-muted">({formatRupiah(myExpenses)})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-ink">
                {partner?.name || "Pasangan"} ({partnerPercentage}%)
              </span>
              <span className="text-ink-muted">({formatRupiah(partnerExpenses)})</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
