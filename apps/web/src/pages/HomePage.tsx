import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Wallet,
  Loader2,
  Heart,
  User,
} from "lucide-react";
import { formatRupiah } from "@couple-ledger/shared";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { PendingApprovalsCard } from "../components/PendingApprovalsCard";
import { CategoryIcon } from "../components/CategoryIcon";

interface HomePageProps {
  onOpenQuickAdd: () => void;
  onNavigateToTransactions: () => void;
}

interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME";
  amountIdr: number;
  note?: string | null;
  occurredOn: string | Date;
  category: { id: string; name: string; icon: string; color: string };
  subcategory?: { id: string; name: string } | null;
  wallet?: { id: string; name: string; type: string } | null;
  createdBy: { id: string; name: string; email: string };
  pendingApproval?: {
    id: string;
    actionType: "UPDATE" | "DELETE";
    requesterId: string;
    requesterName?: string;
  } | null;
}

interface BudgetStatus {
  budgetAmountIdr: number;
  spentAmountIdr: number;
  remainingAmountIdr: number;
  percentageUsed: number;
  isThreshold80: boolean;
  isThreshold100: boolean;
}

interface WalletItem {
  id: string;
  name: string;
  type: string;
}

const HOME_PAGE_SIZE = 6;

export function HomePage({
  onOpenQuickAdd,
  onNavigateToTransactions,
}: HomePageProps) {
  const { user, activeWorkspace } = useAuth();
  const { showToast } = useToast();

  // Current selected month: YYYY-MM
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const homeSentinelRef = useRef<HTMLDivElement>(null);

  // Budget Edit state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(0);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const isSavingBudgetRef = useRef(false);

  // Soft Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const [approvalKey, setApprovalKey] = useState(0);

  // DBA Optimization: Wallets are static per workspace, NOT re-fetched on every month change
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    let isMounted = true;

    api.wallets
      .get({ query: { workspaceId: activeWorkspace.id } })
      .then((walRes) => {
        if (!isMounted) return;
        if (walRes.data?.success && walRes.data.data) {
          setWallets(walRes.data.data as WalletItem[]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.id]);

  // DBA + Frontend Optimization: Scroll pagination for recent transactions & month budget
  const fetchHomeTransactions = useCallback(
    async (offsetToFetch: number, isInitial: boolean) => {
      if (!activeWorkspace?.id) return;
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const [txRes, budgetRes] = await Promise.all([
          api.transactions.get({
            query: {
              workspaceId: activeWorkspace.id,
              month: selectedMonth,
              limit: HOME_PAGE_SIZE,
              offset: offsetToFetch,
            },
          }),
          isInitial
            ? api.budgets.get({
                query: {
                  workspaceId: activeWorkspace.id,
                  month: selectedMonth,
                },
              })
            : Promise.resolve(null),
        ]);

        if (txRes.data?.success && txRes.data.data) {
          const newItems = txRes.data.data as TransactionItem[];
          if (isInitial) {
            setTransactions(newItems);
          } else {
            setTransactions((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const filtered = newItems.filter((t) => !existingIds.has(t.id));
              return [...prev, ...filtered];
            });
          }
          setHasMore(newItems.length >= HOME_PAGE_SIZE);
        }

        if (budgetRes?.data?.success && budgetRes.data.data) {
          const b = budgetRes.data.data as BudgetStatus;
          setBudgetStatus(b);
          setBudgetInput(b.budgetAmountIdr);
        }
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [activeWorkspace?.id, selectedMonth],
  );

  // Trigger initial fetch when month changes
  useEffect(() => {
    setHasMore(true);
    void fetchHomeTransactions(0, true);
  }, [fetchHomeTransactions]);

  // Infinite Scroll IntersectionObserver for Recent Transactions
  useEffect(() => {
    const target = homeSentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !isLoading && !isFetchingMore) {
          void fetchHomeTransactions(transactions.length, false);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchHomeTransactions, hasMore, isLoading, isFetchingMore, transactions.length]);

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

  const handleSaveBudget = async () => {
    if (!activeWorkspace) return;

    // 🛡️ Synchronous debounce guard against double clicks
    if (isSavingBudgetRef.current || isSavingBudget) return;

    if (budgetInput < 0) {
      showToast({
        type: "warning",
        title: "Nominal Tidak Valid",
        message: "Target anggaran tidak boleh bernilai negatif.",
      });
      return;
    }

    isSavingBudgetRef.current = true;
    setIsSavingBudget(true);

    try {
      const res = await api.budgets.post({
        workspaceId: activeWorkspace.id,
        month: selectedMonth,
        amountIdr: Math.max(0, Math.round(budgetInput)),
      });

      if (res.data?.success && res.data.data) {
        setBudgetStatus(res.data.data as BudgetStatus);
        showToast({
          type: "success",
          title: "Anggaran Disimpan",
          message: `Target batas anggaran bulan ini diatur ke ${formatRupiah(budgetInput)}.`,
        });
        setIsEditingBudget(false);
      } else if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        throw new Error(errVal?.error?.message || "Gagal menyimpan anggaran");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan anggaran";
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        message: msg,
      });
    } finally {
      isSavingBudgetRef.current = false;
      setIsSavingBudget(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    // 🛡️ Synchronous debounce guard against double clicks
    if (isDeletingRef.current || isDeleting) return;
    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const res = await api.transactions({ id }).delete();
      if (res.data?.success) {
        const resData = res.data as { requiresApproval?: boolean };
        if (resData.requiresApproval) {
          showToast({
            type: "partner",
            title: "Menunggu Persetujuan Pasangan",
            message: "Permohonan penghapusan transaksi telah diajukan. Transaksi tetap utuh sampai pasanganmu menyetujuinya.",
            duration: 6000,
          });
          setApprovalKey((k) => k + 1);
          void fetchHomeTransactions(0, true);
        } else {
          showToast({
            type: "success",
            title: "Transaksi Dihapus",
            message: "Transaksi berhasil dihapus dari pembukuan bersama.",
          });
          setTransactions((prev) => prev.filter((t) => t.id !== id));
        }
      }
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Calculations for current month view
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const netBalance = totalIncome - totalExpense;

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedMonth}-01`));

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Month Selector Carousel Header */}
      <div className="flex items-center justify-between bg-surface-soft border border-hairline rounded-sm px-3 py-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-full text-ink-muted hover:text-ink active:scale-95 transition-all"
          aria-label="Bulan Sebelumnya"
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
          aria-label="Bulan Selanjutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pending Partner Approvals Card */}
      <PendingApprovalsCard
        key={`approvals-${approvalKey}`}
        onRefreshNeeded={() => {
          setTransactions([]);
          void fetchHomeTransactions(0, true);
        }}
      />

      {/* Financial Snapshot Card (Airbnb Float Shadow) */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Ringkasan Keuangan Bersama
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              netBalance >= 0
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rausch/10 text-rausch border border-rausch/20"
            }`}
          >
            {netBalance >= 0 ? "Surplus" : "Defisit"}
          </span>
        </div>

        {/* Net Flow Big Text */}
        <div>
          <div className="text-2xl font-bold tracking-tight text-ink">
            {formatRupiah(netBalance)}
          </div>
          <div className="text-[11px] text-ink-muted">Selisih Kas Bulan Ini</div>
        </div>

        {/* Inflow & Outflow Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline">
          <div className="flex items-center gap-2 p-2 rounded-sm bg-surface-soft">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-ink-muted">Pemasukan</div>
              <div className="text-xs font-bold text-emerald-700">
                {formatRupiah(totalIncome)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-sm bg-surface-soft">
            <div className="w-7 h-7 rounded-full bg-rausch/10 text-rausch flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-ink-muted">Pengeluaran</div>
              <div className="text-xs font-bold text-rausch">
                {formatRupiah(totalExpense)}
              </div>
            </div>
          </div>
        </div>

        {/* Active Wallets Bar */}
        {wallets.length > 0 && (
          <div className="pt-2 border-t border-hairline-soft flex items-center gap-1.5 overflow-x-auto text-[11px] text-ink-muted">
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-ink">Dompet:</span>
            {wallets.map((w) => (
              <span
                key={w.id}
                className="px-2 py-0.5 rounded-full bg-surface-soft border border-hairline-soft font-medium text-ink"
              >
                {w.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Monthly Budget Card with Threshold Alerts */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Batas Anggaran Bulanan
          </span>
          <button
            type="button"
            onClick={() => setIsEditingBudget(!isEditingBudget)}
            className="text-xs text-rausch hover:underline font-semibold flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            {budgetStatus?.budgetAmountIdr ? "Ubah Budget" : "Atur Budget"}
          </button>
        </div>

        {/* Edit Budget Inline Form */}
        {isEditingBudget ? (
          <div className="p-3 bg-surface-soft rounded-sm space-y-2 border border-hairline">
            <label className="text-[11px] font-semibold text-ink">
              Target Anggaran Pengeluaran (Rp):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={budgetInput}
                onChange={(e) => setBudgetInput(Number(e.target.value) || 0)}
                className="flex-1 text-xs px-2.5 py-1.5 bg-canvas border border-hairline rounded-sm focus:outline-none focus:border-ink font-semibold"
              />
              <button
                type="button"
                onClick={handleSaveBudget}
                disabled={isSavingBudget}
                className={`px-3 py-1.5 bg-rausch text-white rounded-sm text-xs font-semibold hover:bg-rausch-active active:scale-95 transition-all flex items-center gap-1.5 ${
                  isSavingBudget ? "opacity-75 pointer-events-none cursor-not-allowed select-none" : ""
                }`}
              >
                {isSavingBudget ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-ink-muted">Terpakai:</span>
              <span className="font-bold text-ink">
                {formatRupiah(budgetStatus?.spentAmountIdr || totalExpense)} /{" "}
                <span className="text-ink-muted">
                  {budgetStatus?.budgetAmountIdr
                    ? formatRupiah(budgetStatus.budgetAmountIdr)
                    : "Belum diatur"}
                </span>
              </span>
            </div>

            {/* Progress Bar */}
            {budgetStatus && budgetStatus.budgetAmountIdr > 0 ? (
              <div className="space-y-1.5">
                <div className="w-full bg-surface-strong h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      budgetStatus.isThreshold100
                        ? "bg-error"
                        : budgetStatus.isThreshold80
                          ? "bg-amber-500"
                          : "bg-rausch"
                    }`}
                    style={{
                      width: `${Math.min(100, budgetStatus.percentageUsed)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-ink-muted">
                  <span>{budgetStatus.percentageUsed}% terpakai</span>
                  <span>
                    Sisa: {formatRupiah(Math.max(0, budgetStatus.remainingAmountIdr))}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Threshold Warning Banners */}
            {budgetStatus?.isThreshold100 ? (
              <div className="p-2.5 rounded-sm bg-error-soft border border-red-200 text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Perhatian Overbudget:</strong> Pengeluaran telah melebihi batas anggaran bulanan ({budgetStatus.percentageUsed}%)!
                </span>
              </div>
            ) : budgetStatus?.isThreshold80 ? (
              <div className="p-2.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Peringatan 80%:</strong> Pengeluaran sudah mencapai {budgetStatus.percentageUsed}% dari anggaran.
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Recent 5 Transactions Header & List */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
            Transaksi Terakhir
          </h2>
          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="text-xs text-rausch hover:underline font-semibold"
          >
            Lihat Semua →
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-ink-muted bg-surface-soft rounded-md">
            Memuat transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center bg-surface-soft border border-hairline rounded-md space-y-2">
            <Clock className="w-8 h-8 text-ink-muted mx-auto" />
            <div className="text-xs font-semibold text-ink">
              Belum ada transaksi di bulan ini
            </div>
            <p className="text-[11px] text-ink-muted">
              Tekan tombol di bawah untuk mencatat pengeluaran atau pemasukan pertama.
            </p>
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rausch hover:bg-rausch-active text-white rounded-sm text-xs font-semibold active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Catat Transaksi
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((t) => {
              const isMine = t.createdBy.id === user?.id;
              const hasPending = !!t.pendingApproval;
              const isPendingDelete = t.pendingApproval?.actionType === "DELETE";
              const isPendingUpdate = t.pendingApproval?.actionType === "UPDATE";

              return (
                <div
                  key={t.id}
                  className={`border rounded-sm p-3 flex items-center justify-between shadow-2xs transition-all ${
                    hasPending
                      ? isPendingDelete
                        ? "bg-rose-50/40 border-rose-200/90 border-l-[3.5px] border-l-rose-500"
                        : "bg-blue-50/40 border-blue-200/90 border-l-[3.5px] border-l-blue-500"
                      : isMine
                        ? "bg-canvas border-hairline hover:border-hairline-strong border-l-[3.5px] border-l-transparent"
                        : "bg-gradient-to-r from-rausch/[0.05] to-canvas border-hairline hover:border-rausch/30 border-l-[3.5px] border-l-rausch"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Category Icon Badge */}
                    <CategoryIcon
                      icon={t.category.icon}
                      color={t.category.color}
                      name={t.category.name}
                      size="md"
                    />

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-ink truncate">
                          {t.category.name}
                          {t.subcategory?.name ? ` • ${t.subcategory.name}` : ""}
                        </span>

                        {/* Author Indicator Pill Badge */}
                        {isMine ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-surface-strong text-ink-muted border border-hairline-soft shrink-0">
                            <User className="w-2.5 h-2.5 text-ink-muted" />
                            <span>Kamu</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rausch/10 text-rausch border border-rausch/20 shrink-0 shadow-2xs">
                            <Heart className="w-2.5 h-2.5 fill-rausch text-rausch" />
                            <span>{t.createdBy.name}</span>
                          </span>
                        )}

                        {/* Status Badges */}
                        {isPendingDelete && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Clock className="w-2.5 h-2.5 animate-pulse text-rose-600" />
                            Diajukan Hapus
                          </span>
                        )}
                        {isPendingUpdate && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-2.5 h-2.5 animate-pulse text-blue-600" />
                            Diajukan Ubah
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-ink-muted truncate">
                        {t.note || "Tanpa catatan"}
                        {t.wallet ? <span> • {t.wallet.name}</span> : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold ${
                          hasPending && isPendingDelete
                            ? "text-ink-muted line-through"
                            : t.type === "EXPENSE"
                            ? "text-rausch"
                            : "text-emerald-600"
                        }`}
                      >
                        {t.type === "EXPENSE" ? "-" : "+"}
                        {formatRupiah(t.amountIdr)}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        {typeof t.occurredOn === "object" && t.occurredOn instanceof Date
                          ? t.occurredOn.toISOString().split("T")[0]
                          : String(t.occurredOn)}
                      </div>
                    </div>

                    {/* Delete button (Soft Delete) or Pending Indicator */}
                    {hasPending ? (
                      <div
                        className="p-1 text-amber-700 bg-amber-50 rounded-sm border border-amber-200 cursor-not-allowed select-none"
                        title="Sedang menunggu persetujuan pasangan"
                      >
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteId(t.id)}
                        className="p-1 text-ink-muted hover:text-error rounded-sm active:scale-95 transition-colors"
                        title="Hapus transaksi (Soft Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Scroll Pagination Sentinel */}
            <div ref={homeSentinelRef} className="pt-2 pb-1 flex flex-col items-center justify-center">
              {isFetchingMore && (
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-surface-soft border border-hairline text-xs font-medium text-ink shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rausch" />
                  <span>Memuat transaksi terdahulu...</span>
                </div>
              )}
              {!hasMore && transactions.length > 0 && !isLoading && (
                <div className="text-[11px] text-ink-muted text-center py-1">
                  Semua transaksi bulan ini ditampilkan ({transactions.length})
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Soft Delete Modal Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-canvas border border-hairline rounded-md p-5 max-w-xs w-full shadow-float space-y-3">
            <h3 className="text-sm font-bold text-ink">Hapus Transaksi?</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Transaksi ini akan dihapus dari riwayat aktif (Soft Delete) dan riwayat perubahan tetap aman tersimpan di jejak audit.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-medium text-ink border border-hairline rounded-sm hover:bg-surface-soft active:scale-95 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSoftDelete(deleteId)}
                className={`flex-1 py-2 text-xs font-semibold text-white bg-error hover:bg-red-700 rounded-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                  isDeleting ? "opacity-75 pointer-events-none cursor-not-allowed select-none" : ""
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
