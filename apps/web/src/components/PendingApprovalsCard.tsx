import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Clock, AlertCircle, ArrowRight, Loader2, Calendar } from "lucide-react";
import { formatRupiah } from "@couple-ledger/shared";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";

export interface TransactionApprovalItem {
  id: string;
  workspaceId: string;
  transactionId: string;
  requesterId: string;
  actionType: "UPDATE" | "DELETE";
  payload: {
    amountIdr?: number;
    note?: string;
    occurredOn?: string;
    categoryId?: string;
    walletId?: string;
  } | null;
  previousSnapshot: {
    id: string;
    amountIdr: number;
    type: "EXPENSE" | "INCOME";
    categoryId: string;
    categoryName: string;
    walletId: string | null;
    walletName: string | null;
    note: string | null;
    occurredOn: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerId: string | null;
  reviewedAt: string | Date | null;
  createdAt: string | Date;
  requester: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PolicyApprovalItem {
  id: string;
  workspaceId: string;
  requesterId: string;
  requesterName: string;
  policyType: string;
  targetValue: "STRICT_TODAY" | "FLEXIBLE";
  currentValue: "STRICT_TODAY" | "FLEXIBLE";
  status: string;
  createdAt: string;
}

interface PendingApprovalsCardProps {
  onRefreshNeeded?: () => void;
}

export function PendingApprovalsCard({ onRefreshNeeded }: PendingApprovalsCardProps) {
  const { user, activeWorkspace, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState<TransactionApprovalItem[]>([]);
  const [policyApprovals, setPolicyApprovals] = useState<PolicyApprovalItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const isReviewingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const [txRes, polRes] = await Promise.all([
        api.transactions.approvals.get({
          query: { workspaceId: activeWorkspace.id },
        }),
        api.workspaces({ id: activeWorkspace.id })["policy-approvals"].get(),
      ]);

      if (txRes.data?.success && txRes.data.data) {
        setApprovals(txRes.data.data as unknown as TransactionApprovalItem[]);
      }
      if (polRes.data?.success && polRes.data.data) {
        setPolicyApprovals(polRes.data.data as unknown as PolicyApprovalItem[]);
      }
    } catch {
      // Non-intrusive failure
    } finally {
      setIsFetching(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void fetchApprovals();
  }, [fetchApprovals]);

  const handleReviewTransaction = async (approvalId: string, action: "APPROVE" | "REJECT") => {
    // 🛡️ Synchronous debounce guard against double clicks
    if (isReviewingRef.current || processingId) return;
    isReviewingRef.current = true;
    setProcessingId(approvalId);
    setErrorMessage(null);

    try {
      const res = await api.transactions
        .approvals({ id: approvalId })
        .review.post({ action });

      if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        setErrorMessage(
          errVal?.error?.message ||
            (action === "APPROVE" ? "Gagal menyetujui" : "Gagal menolak"),
        );
        return;
      }

      showToast({
        type: action === "APPROVE" ? "success" : "info",
        title: action === "APPROVE" ? "Permohonan Disetujui" : "Permohonan Ditolak",
        message:
          action === "APPROVE"
            ? "Perubahan transaksi telah diterapkan pada pembukuan bersama."
            : "Permohonan dibatalkan. Transaksi tetap pada posisi semula.",
      });

      // Remove item from state
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMessage(msg);
    } finally {
      isReviewingRef.current = false;
      setProcessingId(null);
    }
  };

  const handleReviewPolicy = async (approvalId: string, action: "APPROVE" | "REJECT") => {
    // 🛡️ Synchronous debounce guard against double clicks
    if (isReviewingRef.current || processingId) return;
    isReviewingRef.current = true;
    setProcessingId(approvalId);
    setErrorMessage(null);

    try {
      const res = await api.workspaces["policy-approvals"]({ id: approvalId }).review.post({
        action,
      });

      if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        setErrorMessage(
          errVal?.error?.message ||
            (action === "APPROVE" ? "Gagal menyetujui" : "Gagal menolak"),
        );
        return;
      }

      showToast({
        type: action === "APPROVE" ? "success" : "info",
        title: action === "APPROVE" ? "Aturan Tanggal Disetujui" : "Pengajuan Ditolak",
        message:
          action === "APPROVE"
            ? "Kebijakan tanggal pencatatan telah diperbarui."
            : "Permohonan dibatalkan. Aturan lama tetap berlaku.",
      });

      setPolicyApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      await refreshAuth();
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMessage(msg);
    } finally {
      isReviewingRef.current = false;
      setProcessingId(null);
    }
  };

  const totalCount = approvals.length + policyApprovals.length;
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-md p-3.5 space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFetching ? (
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          ) : (
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          )}
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Persetujuan Tertunda ({totalCount})
          </h3>
        </div>
        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
          Konfirmasi Pasangan
        </span>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rausch bg-rausch/10 border border-rausch/20 p-2 rounded-sm">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {/* Policy Approvals */}
        {policyApprovals.map((item) => {
          const isRequester = user?.id === item.requesterId;
          const isProcessing = processingId === item.id;
          const targetText =
            item.targetValue === "STRICT_TODAY"
              ? "Wajib Hari Ini Saja (Disiplin)"
              : "Bebas / Dinamis";
          const currentText =
            item.currentValue === "STRICT_TODAY"
              ? "Wajib Hari Ini"
              : "Bebas / Dinamis";

          return (
            <div
              key={item.id}
              className="bg-white border border-amber-200 rounded-sm p-3 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Aturan Tanggal
                  </span>
                  <span>oleh {item.requesterName}</span>
                </div>
                <span className="text-ink-muted text-[10px]">Kebijakan Ruang</span>
              </div>

              <div className="text-xs space-y-1 bg-surface-soft p-2 rounded border border-hairline-soft">
                <div className="text-[11px] text-ink-muted">
                  Perubahan Aturan Pencatatan Transaksi Baru:
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-ink-muted line-through text-[11px]">
                    {currentText}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
                  <span className="font-bold text-ink text-xs">
                    {targetText}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                {isRequester ? (
                  <p className="text-[11px] text-amber-700 font-medium italic">
                    Menunggu persetujuan pasangan kamu...
                  </p>
                ) : (
                  <div className="flex items-center justify-end gap-2 w-full">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReviewPolicy(item.id, "REJECT")}
                      className="px-2.5 py-1.5 rounded-md border border-hairline hover:bg-surface-soft active:scale-95 text-ink text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <X className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Tolak</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReviewPolicy(item.id, "APPROVE")}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Setujui</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Transaction Approvals */}
        {approvals.map((item) => {
          const isRequester = user?.id === item.requesterId;
          const isProcessing = processingId === item.id;
          const isUpdate = item.actionType === "UPDATE";

          return (
            <div
              key={item.id}
              className="bg-white border border-amber-200 rounded-sm p-3 shadow-xs space-y-2"
            >
              {/* Header Baris Permohonan */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isUpdate
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {isUpdate ? "Ubah" : "Hapus"}
                  </span>
                  <span>oleh {item.requester.name}</span>
                </div>
                <span className="text-ink-muted text-[10px]">
                  {item.previousSnapshot.occurredOn}
                </span>
              </div>

              {/* Rincian Komparasi Perubahan */}
              {isUpdate ? (
                <div className="text-xs space-y-1 bg-surface-soft p-2 rounded border border-hairline-soft">
                  <div className="flex items-center justify-between text-ink-muted text-[11px]">
                    <span>Kategori: {item.previousSnapshot.categoryName}</span>
                    <span>{item.previousSnapshot.note || "Tanpa catatan"}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-ink-muted line-through">
                      {formatRupiah(item.previousSnapshot.amountIdr)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="font-bold text-ink">
                      {item.payload?.amountIdr
                        ? formatRupiah(item.payload.amountIdr)
                        : formatRupiah(item.previousSnapshot.amountIdr)}
                    </span>
                  </div>
                  {item.payload?.note !== undefined &&
                    item.payload.note !== item.previousSnapshot.note && (
                      <div className="text-[11px] text-ink-muted border-t border-hairline-soft pt-1">
                        Catatan baru:{" "}
                        <span className="text-ink font-medium">
                          {item.payload.note || "(dikosongkan)"}
                        </span>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-xs space-y-1 bg-surface-soft p-2 rounded border border-hairline-soft">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">
                      {item.previousSnapshot.categoryName}
                    </span>
                    <span className="font-bold text-rose-600">
                      {formatRupiah(item.previousSnapshot.amountIdr)}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Catatan: {item.previousSnapshot.note || "Tanpa catatan"}
                  </div>
                </div>
              )}

              {/* Action Buttons / Status Indicator */}
              <div className="pt-1 flex items-center justify-between">
                {isRequester ? (
                  <p className="text-[11px] text-amber-700 font-medium italic">
                    Menunggu persetujuan pasangan kamu...
                  </p>
                ) : (
                  <div className="flex items-center justify-end gap-2 w-full">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReviewTransaction(item.id, "REJECT")}
                      className="px-2.5 py-1.5 rounded-md border border-hairline hover:bg-surface-soft active:scale-95 text-ink text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <X className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Tolak</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReviewTransaction(item.id, "APPROVE")}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Setujui</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
