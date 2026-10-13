import React, { useState, useEffect } from "react";
import { X, Check, Wallet, Calendar, Tag, AlertCircle } from "lucide-react";
import { formatRupiah, formatJakartaDateISO } from "@couple-ledger/shared";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CategoryIcon } from "./CategoryIcon";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CategoryItem {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

interface WalletItem {
  id: string;
  name: string;
  type: string;
}

export function QuickAddModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickAddModalProps) {
  const { activeWorkspace } = useAuth();
  const { showToast } = useToast();

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [occurredOn, setOccurredOn] = useState<string>(
    formatJakartaDateISO(new Date()),
  );
  const [note, setNote] = useState<string>("");

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick amount chips
  const quickChips = [
    { label: "+10rb", val: 10000 },
    { label: "+25rb", val: 25000 },
    { label: "+50rb", val: 50000 },
    { label: "+100rb", val: 100000 },
    { label: "+200rb", val: 200000 },
    { label: "+500rb", val: 500000 },
  ];

  useEffect(() => {
    if (!isOpen || !activeWorkspace) return;

    let isMounted = true;
    setIsLoadingData(true);
    setErrorMessage(null);

    Promise.all([
      api.categories.get({ query: { workspaceId: activeWorkspace.id } }),
      api.wallets.get({ query: { workspaceId: activeWorkspace.id } }),
    ])
      .then(([catRes, walRes]) => {
        if (!isMounted) return;

        if (catRes.data?.success && catRes.data.data) {
          const catList = catRes.data.data as CategoryItem[];
          setCategories(catList);
          const firstCat = catList.find((c) => c.type === type);
          if (firstCat) setSelectedCategoryId(firstCat.id);
        }

        if (walRes.data?.success && walRes.data.data) {
          const walList = walRes.data.data as WalletItem[];
          setWallets(walList);
          if (walList.length > 0 && walList[0]) {
            setSelectedWalletId(walList[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : "Gagal memuat kategori & dompet",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeWorkspace]);

  // When type changes, auto-select the first appropriate category
  const handleTypeChange = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) {
      setSelectedCategoryId(firstCat.id);
    }
  };

  const handleAddChip = (val: number) => {
    setAmount((prev) => prev + val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    if (amount <= 0) {
      setErrorMessage("Nominal transaksi harus lebih dari Rp 0");
      showToast({
        type: "warning",
        title: "Nominal Belum Diisi",
        message: "Masukkan nominal transaksi lebih dari Rp 0.",
      });
      return;
    }

    if (!selectedCategoryId) {
      setErrorMessage("Silakan pilih salah satu kategori");
      showToast({
        type: "warning",
        title: "Kategori Belum Dipilih",
        message: "Pilih salah satu kategori transaksi sebelum menyimpan.",
      });
      return;
    }

    if (!occurredOn) {
      setErrorMessage("Tanggal transaksi wajib diisi");
      showToast({
        type: "warning",
        title: "Tanggal Tidak Valid",
        message: "Silakan pilih tanggal transaksi yang valid.",
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.transactions.post({
        workspaceId: activeWorkspace.id,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId || undefined,
        type,
        amountIdr: Math.round(amount),
        note: note.trim() || undefined,
        occurredOn,
      });

      if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } };
        throw new Error(errVal?.error?.message || "Gagal menyimpan transaksi");
      }

      showToast({
        type: "success",
        title: "Transaksi Dicatat",
        message: `${type === "EXPENSE" ? "Pengeluaran" : "Pemasukan"} ${formatRupiah(amount)} berhasil disimpan ke pembukuan.`,
      });

      // Reset form
      setAmount(0);
      setNote("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
      setErrorMessage(msg);
      showToast({
        type: "error",
        title: "Gagal Menyimpan Transaksi",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-canvas rounded-t-[20px] sm:rounded-xl shadow-float border border-hairline overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        role="dialog"
      >
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-hairline rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <h2 className="text-sm font-bold text-ink">Catat Transaksi</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-surface-soft active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-error-soft border border-red-200 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Segmented Type Toggle (Pengeluaran / Pemasukan) */}
          <div className="grid grid-cols-2 p-1 bg-surface-strong rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === "EXPENSE"
                  ? "bg-canvas text-rausch shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              💸 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("INCOME")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === "INCOME"
                  ? "bg-canvas text-emerald-600 shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              💰 Pemasukan
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Nominal
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={amount === 0 ? "" : amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="0"
                autoFocus
                className="w-full text-2xl font-extrabold text-ink px-3 py-2.5 bg-surface-soft border border-hairline rounded-xl focus:outline-none focus:border-ink transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">
                {formatRupiah(amount)}
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleAddChip(chip.val)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-surface-soft hover:bg-surface-strong text-ink border border-hairline-soft rounded-full active:scale-95 transition-all"
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-surface-soft hover:bg-surface-strong text-ink-muted hover:text-error border border-hairline-soft rounded-full active:scale-95 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Category Grid: Clean Vertical 4-Column Layout */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Kategori</span>
              </label>
              {selectedCategoryId && (
                <span className="text-[11px] font-bold text-rausch">
                  {filteredCategories.find((c) => c.id === selectedCategoryId)?.name}
                </span>
              )}
            </div>

            {isLoadingData ? (
              <div className="text-xs text-ink-muted py-4 text-center">Memuat kategori...</div>
            ) : (
              <div className="grid grid-cols-4 gap-y-3 gap-x-2 max-h-56 overflow-y-auto no-scrollbar p-2.5 border border-hairline-soft rounded-xl bg-surface-soft/40">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="group flex flex-col items-center text-center focus:outline-none transition-transform active:scale-95 p-1 rounded-lg"
                    >
                      {/* Icon Circle with active ring & check badge */}
                      <div className="relative">
                        <CategoryIcon
                          icon={cat.icon}
                          color={cat.color}
                          name={cat.name}
                          size="lg"
                          className={`transition-all duration-150 ${
                            isSelected
                              ? "ring-2 ring-rausch ring-offset-2 scale-105 shadow-sm"
                              : "group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          }`}
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rausch text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Full Category Name (2 lines wrapped, no truncation) */}
                      <span
                        className={`text-[11px] mt-1.5 leading-snug px-0.5 line-clamp-2 transition-colors ${
                          isSelected
                            ? "font-bold text-ink"
                            : "font-medium text-ink-muted group-hover:text-ink"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wallet Selector & Date */}
          <div className="grid grid-cols-2 gap-2">
            {/* Wallet */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                Dompet
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full text-xs font-semibold text-ink p-2.5 bg-surface-soft border border-hairline rounded-xl focus:outline-none focus:border-ink transition-colors"
              >
                {wallets.length === 0 ? (
                  <option value="">Kas Utama</option>
                ) : (
                  wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Tanggal
                </label>
                {activeWorkspace?.datePolicy === "FLEXIBLE" ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    🗓️ Dinamis
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <span>🔒 Wajib Hari Ini</span>
                  </span>
                )}
              </div>

              {activeWorkspace?.datePolicy === "FLEXIBLE" ? (
                <input
                  type="date"
                  value={occurredOn}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  className="w-full text-xs font-semibold text-ink p-2.5 bg-surface-soft border border-hairline rounded-xl focus:outline-none focus:border-ink transition-colors"
                />
              ) : (
                <div className="flex items-center justify-between w-full text-xs font-bold text-ink p-2.5 bg-surface-strong/70 border border-hairline rounded-xl select-none">
                  <span>{occurredOn}</span>
                  <span className="text-[10px] text-ink-muted font-medium">
                    (Hari Ini)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kopi pagi berdua..."
              maxLength={200}
              className="w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border border-hairline rounded-xl focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="w-full min-h-[48px] bg-rausch hover:bg-rausch-active disabled:bg-rausch-disabled text-white font-bold text-sm rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Menyimpan...</span>
              ) : (
                `Simpan ${type === "EXPENSE" ? "Pengeluaran" : "Pemasukan"} (${formatRupiah(amount)})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

