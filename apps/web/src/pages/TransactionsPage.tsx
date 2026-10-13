import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Edit2,
  Calendar,
  X,
  Loader2,
  RotateCcw,
  Clock,
} from "lucide-react";
import { formatRupiah } from "@couple-ledger/shared";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { PendingApprovalsCard } from "../components/PendingApprovalsCard";
import { CategoryIcon } from "../components/CategoryIcon";

interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME";
  amountIdr: number;
  note?: string | null;
  occurredOn: string | Date;
  category: { id: string; name: string; icon: string; color: string };
  wallet?: { id: string; name: string; type: string } | null;
  createdBy: { id: string; name: string; email: string };
  pendingApproval?: {
    id: string;
    actionType: "UPDATE" | "DELETE";
    requesterId: string;
    requesterName?: string;
  } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon?: string;
  color?: string;
}

interface WalletItem {
  id: string;
  name: string;
}

const PAGE_SIZE = 15;

export function TransactionsPage() {
  const { user, activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [walletFilter, setWalletFilter] = useState<string>("ALL");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editType, setEditType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [editNote, setEditNote] = useState<string>("");
  const [editOccurredOn, setEditOccurredOn] = useState<string>("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Soft Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [approvalKey, setApprovalKey] = useState(0);

  // DBA Optimization: Static categories & wallets only fetched when workspace changes, NOT on filter changes
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    let isMounted = true;

    Promise.all([
      api.categories.get({
        query: {
          workspaceId: activeWorkspace.id,
        },
      }),
      api.wallets.get({
        query: {
          workspaceId: activeWorkspace.id,
        },
      }),
    ]).then(([catRes, walRes]) => {
      if (!isMounted) return;
      if (catRes.data?.success && catRes.data.data) {
        setCategories(catRes.data.data as CategoryItem[]);
      }
      if (walRes.data?.success && walRes.data.data) {
        setWallets(walRes.data.data as WalletItem[]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.id]);

  // DBA + Frontend Optimization: Scroll pagination with offset & limit
  const fetchPage = useCallback(
    async (offsetToFetch: number, isInitial: boolean) => {
      if (!activeWorkspace?.id) return;

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFetchingNextPage(true);
      }

      try {
        const txRes = await api.transactions.get({
          query: {
            workspaceId: activeWorkspace.id,
            month: selectedMonth,
            type:
              typeFilter === "ALL"
                ? undefined
                : (typeFilter as "EXPENSE" | "INCOME"),
            categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
            walletId: walletFilter === "ALL" ? undefined : walletFilter,
            createdById:
              memberFilter === "ALL"
                ? undefined
                : memberFilter === "ME"
                  ? user?.id
                  : activeWorkspace.members.find((m) => m.userId !== user?.id)
                      ?.userId,
            limit: PAGE_SIZE,
            offset: offsetToFetch,
          },
        });

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
          setHasMore(newItems.length >= PAGE_SIZE);
        }
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [
      activeWorkspace?.id,
      selectedMonth,
      typeFilter,
      categoryFilter,
      walletFilter,
      memberFilter,
      user?.id,
    ],
  );

  // Trigger initial page load when filters change
  useEffect(() => {
    setHasMore(true);
    void fetchPage(0, true);
  }, [fetchPage]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !isLoading && !isFetchingNextPage) {
          void fetchPage(transactions.length, false);
        }
      },
      { threshold: 0.1, rootMargin: "150px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, isLoading, isFetchingNextPage, transactions.length]);

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

  const getOccurredOnStr = (val: string | Date): string => {
    if (val instanceof Date) {
      return val.toISOString().split("T")[0] || "";
    }
    return String(val);
  };

  const handleOpenEdit = (tx: TransactionItem) => {
    setEditingTx(tx);
    setEditAmount(tx.amountIdr);
    setEditType(tx.type);
    setEditNote(tx.note || "");
    setEditOccurredOn(getOccurredOnStr(tx.occurredOn));
    setEditCategoryId(tx.category.id);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;

    if (editAmount <= 0) {
      showToast({
        type: "warning",
        title: "Nominal Tidak Valid",
        message: "Nominal transaksi harus lebih dari Rp 0.",
      });
      return;
    }

    if (!editCategoryId) {
      showToast({
        type: "warning",
        title: "Kategori Belum Dipilih",
        message: "Silakan pilih salah satu kategori transaksi.",
      });
      return;
    }

    setIsSavingEdit(true);

    try {
      const res = await api.transactions({ id: editingTx.id }).patch({
        amountIdr: Math.max(1, Math.round(editAmount)),
        type: editType,
        note: editNote.trim(),
        categoryId: editCategoryId,
      });

      if (res.data?.success) {
        const resData = res.data as { requiresApproval?: boolean; data?: TransactionItem };
        if (resData.requiresApproval) {
          showToast({
            type: "partner",
            title: "Menunggu Persetujuan Pasangan",
            message: "Permohonan perubahan transaksi telah diajukan. Nominal dan rincian transaksi tetap kembali ke posisi semula sampai disetujui pasangan kamu.",
            duration: 6500,
          });
          setApprovalKey((k) => k + 1);
          setEditingTx(null);
          void fetchPage(0, true);
        } else if (resData.data) {
          showToast({
            type: "success",
            title: "Transaksi Diperbarui",
            message: "Data transaksi berhasil disimpan.",
          });
          const updated = resData.data;
          setTransactions((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
          );
          setEditingTx(null);
        }
      } else if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        throw new Error(errVal?.error?.message || "Gagal memperbarui transaksi");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui transaksi";
      showToast({
        type: "error",
        title: "Gagal Memperbarui",
        message: msg,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
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
            duration: 6500,
          });
          setApprovalKey((k) => k + 1);
          void fetchPage(0, true);
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
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Filter by local search query
  const filteredList = transactions.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.note?.toLowerCase().includes(query) ||
      t.category.name.toLowerCase().includes(query) ||
      t.createdBy.name.toLowerCase().includes(query)
    );
  });

  // Group by date
  const groupedByDate: Record<string, TransactionItem[]> = {};
  filteredList.forEach((tx) => {
    const dKey = getOccurredOnStr(tx.occurredOn);
    if (!groupedByDate[dKey]) {
      groupedByDate[dKey] = [];
    }
    groupedByDate[dKey]?.push(tx);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const totalExpense = filteredList
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const totalIncome = filteredList
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amountIdr, 0);

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedMonth}-01`));

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Month Carousel Header */}
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

      {/* Pending Partner Approvals Card */}
      <PendingApprovalsCard
        key={`approvals-${approvalKey}`}
        onRefreshNeeded={() => {
          setTransactions([]);
          void fetchPage(0, true);
        }}
      />

      {/* Search & Filters */}
      <div className="space-y-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari catatan, kategori, atau nama..."
            className="w-full text-xs text-ink pl-9 pr-3 py-2 bg-surface-soft border border-hairline rounded-sm focus:outline-none focus:border-ink transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Responsive 2-Column Filters (No Horizontal Scroll) */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full py-1.5 px-2.5 bg-surface-soft border rounded-lg text-ink font-medium focus:outline-none focus:border-ink transition-colors truncate ${
                typeFilter !== "ALL"
                  ? "bg-rausch/10 border-rausch/40 text-rausch font-semibold"
                  : "border-hairline"
              }`}
            >
              <option value="ALL">Semua Jenis</option>
              <option value="EXPENSE">💸 Pengeluaran</option>
              <option value="INCOME">💰 Pemasukan</option>
            </select>
          </div>

          {/* Member Filter */}
          <div className="relative">
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className={`w-full py-1.5 px-2.5 bg-surface-soft border rounded-lg text-ink font-medium focus:outline-none focus:border-ink transition-colors truncate ${
                memberFilter !== "ALL"
                  ? "bg-rausch/10 border-rausch/40 text-rausch font-semibold"
                  : "border-hairline"
              }`}
            >
              <option value="ALL">Semua Anggota</option>
              <option value="ME">Hanya Saya</option>
              <option value="PARTNER">Hanya Pasangan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`w-full py-1.5 px-2.5 bg-surface-soft border rounded-lg text-ink font-medium focus:outline-none focus:border-ink transition-colors truncate ${
                categoryFilter !== "ALL"
                  ? "bg-rausch/10 border-rausch/40 text-rausch font-semibold"
                  : "border-hairline"
              }`}
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet Filter */}
          <div className="relative">
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className={`w-full py-1.5 px-2.5 bg-surface-soft border rounded-lg text-ink font-medium focus:outline-none focus:border-ink transition-colors truncate ${
                walletFilter !== "ALL"
                  ? "bg-rausch/10 border-rausch/40 text-rausch font-semibold"
                  : "border-hairline"
              }`}
            >
              <option value="ALL">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Reset Button if any filter active */}
        {(typeFilter !== "ALL" ||
          memberFilter !== "ALL" ||
          categoryFilter !== "ALL" ||
          walletFilter !== "ALL" ||
          searchQuery.trim() !== "") && (
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-ink-muted">Filter aktif diterapkan</span>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setMemberFilter("ALL");
                setCategoryFilter("ALL");
                setWalletFilter("ALL");
                setSearchQuery("");
              }}
              className="text-rausch font-semibold hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Filtered Summary Card */}
      <div className="bg-surface-soft border border-hairline-soft rounded-sm p-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-ink-muted">Hasil Filter: </span>
          <span className="font-bold text-ink">{filteredList.length} Transaksi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 font-bold">
            +{formatRupiah(totalIncome)}
          </span>
          <span className="text-rausch font-bold">
            -{formatRupiah(totalExpense)}
          </span>
        </div>
      </div>

      {/* Grouped Transactions List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-ink-muted">
          Memuat riwayat transaksi...
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="p-8 text-center bg-surface-soft border border-hairline rounded-md text-xs text-ink-muted space-y-1">
          <div>Tidak ada transaksi yang sesuai kriteria.</div>
          <div className="text-[11px] text-ink-muted">
            Coba ubah filter atau bulan yang dipilih.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dateObj = new Date(`${dateStr}T12:00:00Z`);
            const formattedHeader = new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(dateObj);

            const txs = groupedByDate[dateStr] ?? [];

            return (
              <div key={dateStr} className="space-y-1.5">
                <div className="text-[11px] font-bold text-ink-muted px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {formattedHeader}
                </div>

                <div className="space-y-1.5">
                  {txs.map((t) => {
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
                              ? "bg-rose-50/40 border-rose-200/90"
                              : "bg-blue-50/40 border-blue-200/90"
                            : "bg-canvas border border-hairline hover:border-hairline-strong"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CategoryIcon
                            icon={t.category.icon}
                            color={t.category.color}
                            name={t.category.name}
                            size="md"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-ink truncate">
                                {t.category.name}
                              </span>
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
                              {t.note || "Tanpa catatan"} •{" "}
                              <span className="font-medium text-ink">
                                {isMine ? "Kamu" : t.createdBy.name}
                              </span>
                              {t.wallet ? ` • ${t.wallet.name}` : ""}
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
                          </div>

                          {/* Action Buttons or Pending Review Indicator */}
                          {hasPending ? (
                            <div
                              className="px-2 py-0.5 text-[10px] font-medium text-amber-800 bg-amber-50 rounded border border-amber-200/80 flex items-center gap-1 cursor-not-allowed select-none"
                              title="Sedang menunggu persetujuan pasangan"
                            >
                              <Clock className="w-3 h-3 animate-pulse text-amber-600" />
                              <span>Dalam Review</span>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(t)}
                                className="p-1 text-ink-muted hover:text-ink rounded-sm active:scale-95 transition-colors"
                                title="Edit transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(t.id)}
                                className="p-1 text-ink-muted hover:text-error rounded-sm active:scale-95 transition-colors"
                                title="Hapus transaksi (Soft Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Scroll Pagination Sentinel & Loading Indicator */}
          <div ref={sentinelRef} className="pt-2 pb-4 flex flex-col items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-full bg-surface-soft border border-hairline text-xs font-medium text-ink shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rausch" />
                <span>Memuat transaksi berikutnya...</span>
              </div>
            )}
            {!hasMore && transactions.length > 0 && !isLoading && (
              <div className="py-2 text-[11px] text-ink-muted">
                — Semua riwayat bulan ini telah ditampilkan ({transactions.length} transaksi) —
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-canvas border border-hairline rounded-md p-5 max-w-sm w-full shadow-float space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h3 className="text-sm font-bold text-ink">Edit Transaksi</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Segmented Type Toggle (Pengeluaran vs Pemasukan) */}
              <div className="grid grid-cols-2 p-1 bg-surface-strong rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditType("EXPENSE");
                    const firstExpense = categories.find((c) => c.type === "EXPENSE");
                    if (firstExpense) setEditCategoryId(firstExpense.id);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editType === "EXPENSE"
                      ? "bg-canvas text-rausch shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  💸 Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditType("INCOME");
                    const firstIncome = categories.find((c) => c.type === "INCOME");
                    if (firstIncome) setEditCategoryId(firstIncome.id);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    editType === "INCOME"
                      ? "bg-canvas text-emerald-600 shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  💰 Pemasukan
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-muted">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                  className="w-full text-base font-bold text-ink px-3 py-2 bg-surface-soft border border-hairline rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-muted">
                  Kategori {editType === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
                </label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const selCat = categories.find((c) => c.id === editCategoryId);
                    return selCat ? (
                      <CategoryIcon
                        icon={selCat.icon}
                        color={selCat.color}
                        name={selCat.name}
                        size="sm"
                      />
                    ) : null;
                  })()}
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="flex-1 text-xs text-ink p-2 bg-surface-soft border border-hairline rounded-sm focus:outline-none focus:border-ink font-medium"
                  >
                    {categories
                      .filter((c) => c.type === editType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Tanggal Terkunci (Readonly demi integritas audit bersama) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-ink-muted">
                    Tanggal Transaksi
                  </label>
                  <span className="text-[10px] font-semibold text-ink-muted bg-surface-strong px-2 py-0.5 rounded-full border border-hairline flex items-center gap-1">
                    🔒 Terkunci
                  </span>
                </div>
                <div className="w-full text-xs text-ink p-2.5 bg-surface-soft border border-hairline rounded-sm flex items-center justify-between">
                  <span className="font-semibold">{editOccurredOn}</span>
                  <span className="text-[10px] text-ink-muted">Tanggal asli tidak dapat diubah</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-muted">
                  Catatan
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full text-xs text-ink px-3 py-2 bg-surface-soft border border-hairline rounded-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="flex-1 py-2 text-xs font-medium text-ink border border-hairline rounded-sm hover:bg-surface-soft"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingEdit || editAmount <= 0}
                onClick={handleSaveEdit}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rausch hover:bg-rausch-active rounded-sm"
              >
                {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-canvas border border-hairline rounded-md p-5 max-w-xs w-full shadow-float space-y-3">
            <h3 className="text-sm font-bold text-ink">Hapus Transaksi?</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Transaksi ini akan dihapus dari riwayat (Soft Delete). Jejak perubahan tetap aman dicatat di Jejak Audit.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-medium text-ink border border-hairline rounded-sm hover:bg-surface-soft"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleSoftDelete(deleteId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-error hover:bg-red-700 rounded-sm"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
