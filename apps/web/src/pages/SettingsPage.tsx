import { useState, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  Send,
  ShieldCheck,
  LogOut,
  Wallet,
  Clock,
  ExternalLink,
  Palette,
  Sparkles,
  Heart,
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  Github,
  Linkedin,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { formatJakartaDateTime } from "@couple-ledger/shared";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { Link } from "../lib/router";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  createdAt: string | Date;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

interface PolicyApprovalItem {
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

interface WalletItem {
  id: string;
  name: string;
  type: string;
}

interface TelegramLinkItem {
  id: string;
  chatId: string;
  chatType: string;
  chatTitle?: string | null;
  isActive: boolean;
}

export function SettingsPage() {
  const { user, activeWorkspace, logout, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const { currentTheme, setThemeId, availableThemes, isSyncingTheme } =
    useTheme();

  const [activeTab, setActiveTab] = useState<
    "workspace" | "wallets" | "theme" | "telegram" | "audit"
  >("workspace");

  // Invite code copy status
  const [copied, setCopied] = useState(false);

  // Date policy state
  const [selectedDatePolicy, setSelectedDatePolicy] = useState<
    "STRICT_TODAY" | "FLEXIBLE"
  >("STRICT_TODAY");
  const [liveDatePolicy, setLiveDatePolicy] = useState<
    "STRICT_TODAY" | "FLEXIBLE" | null
  >(null);
  const [policyApprovals, setPolicyApprovals] = useState<PolicyApprovalItem[]>([]);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [processingPolicyId, setProcessingPolicyId] = useState<string | null>(null);

  // Telegram link token state
  const [isGeneratingTelegram, setIsGeneratingTelegram] = useState(false);
  const [telegramLinkInfo, setTelegramLinkInfo] = useState<{
    token: string;
    expiresAt: string;
    botUrl: string;
  } | null>(null);
  const [telegramLinks, setTelegramLinks] = useState<TelegramLinkItem[]>([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Wallets state
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"CASH" | "BANK" | "EWALLET">("CASH");
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  // Sync selectedDatePolicy when activeWorkspace updates
  useEffect(() => {
    if (activeWorkspace?.datePolicy) {
      setSelectedDatePolicy(activeWorkspace.datePolicy);
      setLiveDatePolicy(activeWorkspace.datePolicy);
    }
  }, [activeWorkspace?.datePolicy]);

  const fetchSettingsData = async () => {
    if (!activeWorkspace) return;

    try {
      const [walRes, tgRes, polRes, wsRes] = await Promise.all([
        api.wallets.get({ query: { workspaceId: activeWorkspace.id } }),
        api.telegram.links.get({ query: { workspaceId: activeWorkspace.id } }),
        api.workspaces({ id: activeWorkspace.id })["policy-approvals"].get(),
        api.workspaces({ id: activeWorkspace.id }).get(),
      ]);

      if (walRes.data?.success && walRes.data.data) {
        setWallets(walRes.data.data as WalletItem[]);
      }
      if (tgRes.data?.success && tgRes.data.data) {
        setTelegramLinks(tgRes.data.data as TelegramLinkItem[]);
      }
      if (polRes.data?.success && polRes.data.data) {
        setPolicyApprovals(polRes.data.data as unknown as PolicyApprovalItem[]);
      }
      if (wsRes.data?.success && wsRes.data.data) {
        const policy = wsRes.data.data.datePolicy as "STRICT_TODAY" | "FLEXIBLE";
        setLiveDatePolicy(policy);
        setSelectedDatePolicy(policy);
      }
    } catch {
      // Graceful error handling
    }
  };

  const handleSavePolicy = async () => {
    if (!activeWorkspace) return;
    setIsSavingPolicy(true);

    try {
      const res = await api.workspaces({ id: activeWorkspace.id })["date-policy"].patch({
        datePolicy: selectedDatePolicy,
      });

      if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        throw new Error(errVal?.error?.message || "Gagal mengubah kebijakan tanggal");
      }

      if (res.data && "requiresApproval" in res.data && res.data.requiresApproval) {
        showToast({
          type: "info",
          title: "Menunggu Konfirmasi Pasangan",
          message:
            "Permohonan perubahan aturan tanggal telah diajukan ke pasanganmu.",
        });
      } else {
        showToast({
          type: "success",
          title: "Kebijakan Berhasil Diubah",
          message: `Aturan tanggal sekarang: ${
            selectedDatePolicy === "STRICT_TODAY" ? "Wajib Hari Ini Saja" : "Bebas / Dinamis"
          }.`,
        });
      }

      await refreshAuth();
      void fetchSettingsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah kebijakan";
      showToast({
        type: "error",
        title: "Gagal Mengubah Kebijakan",
        message: msg,
      });
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleReviewPolicy = async (approvalId: string, action: "APPROVE" | "REJECT") => {
    setProcessingPolicyId(approvalId);

    try {
      const res = await api.workspaces["policy-approvals"]({ id: approvalId }).review.post({
        action,
      });

      if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        throw new Error(errVal?.error?.message || "Gagal memproses persetujuan");
      }

      showToast({
        type: action === "APPROVE" ? "success" : "info",
        title: action === "APPROVE" ? "Perubahan Disetujui" : "Pengajuan Ditolak",
        message:
          action === "APPROVE"
            ? "Kebijakan tanggal pencatatan bersama telah resmi diperbarui."
            : "Permohonan dibatalkan. Aturan lama tetap berlaku.",
      });

      await refreshAuth();
      void fetchSettingsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast({
        type: "error",
        title: "Gagal",
        message: msg,
      });
    } finally {
      setProcessingPolicyId(null);
    }
  };

  useEffect(() => {
    void fetchSettingsData();
  }, [activeWorkspace?.id]);

  const loadAuditLogs = async () => {
    if (!activeWorkspace) return;
    setIsLoadingAudit(true);
    try {
      const res = await api.workspaces({ id: activeWorkspace.id })["audit-logs"].get();
      if (res.data?.success && res.data.data) {
        setAuditLogs(res.data.data as AuditLogItem[]);
      }
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      void loadAuditLogs();
    }
  }, [activeTab]);

  const handleCopyInviteCode = () => {
    if (!activeWorkspace) return;
    void navigator.clipboard.writeText(activeWorkspace.inviteCode);
    setCopied(true);
    showToast({
      type: "success",
      title: "Kode Undangan Disalin",
      message: `Kode "${activeWorkspace.inviteCode}" siap dibagikan ke pasangan.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateTelegramToken = async () => {
    if (!activeWorkspace) return;
    setIsGeneratingTelegram(true);
    try {
      const res = await api.telegram["link-token"].post({
        workspaceId: activeWorkspace.id,
      });

      if (res.data?.success && res.data.data) {
        setTelegramLinkInfo({
          token: res.data.data.token,
          expiresAt: res.data.data.expiresAt,
          botUrl: `https://t.me/CoupleLedgerBot?start=${res.data.data.token}`,
        });
        showToast({
          type: "info",
          title: "Tautan Bot Siap",
          message: "Tautan otorisasi Telegram berhasil dibuat. Berlaku selama 15 menit.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat tautan bot";
      showToast({
        type: "error",
        title: "Gagal Membuat Tautan",
        message: msg,
      });
    } finally {
      setIsGeneratingTelegram(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    if (!newWalletName.trim() || newWalletName.trim().length < 2) {
      showToast({
        type: "warning",
        title: "Nama Dompet Tidak Valid",
        message: "Nama dompet minimal 2 karakter.",
      });
      return;
    }

    setIsAddingWallet(true);

    try {
      const res = await api.wallets.post({
        workspaceId: activeWorkspace.id,
        name: newWalletName.trim(),
        type: newWalletType,
      });

      if (res.data?.success) {
        setNewWalletName("");
        void fetchSettingsData();
        showToast({
          type: "success",
          title: "Dompet Ditambahkan",
          message: `Dompet "${newWalletName.trim()}" berhasil dibuat.`,
        });
      } else if (res.error) {
        const errVal = res.error.value as { error?: { message?: string } } | undefined;
        throw new Error(errVal?.error?.message || "Gagal menambahkan dompet");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan dompet";
      showToast({
        type: "error",
        title: "Gagal Menambahkan",
        message: msg,
      });
    } finally {
      setIsAddingWallet(false);
    }
  };

  const partner = activeWorkspace?.members.find((m) => m.userId !== user?.id);

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Sub-Nav Pill Tabs */}
      <div className="grid grid-cols-5 p-1 bg-surface-strong rounded-sm gap-1 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          className={`py-1.5 rounded-sm transition-all truncate px-1 text-center ${
            activeTab === "workspace"
              ? "bg-canvas text-rausch shadow-xs font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Ruang
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("wallets")}
          className={`py-1.5 rounded-sm transition-all truncate px-1 text-center ${
            activeTab === "wallets"
              ? "bg-canvas text-rausch shadow-xs font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Dompet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`py-1.5 rounded-sm transition-all truncate px-1 text-center ${
            activeTab === "theme"
              ? "bg-canvas text-rausch shadow-xs font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Tema
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("telegram")}
          className={`py-1.5 rounded-sm transition-all truncate px-1 text-center ${
            activeTab === "telegram"
              ? "bg-canvas text-rausch shadow-xs font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Telegram
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`py-1.5 rounded-sm transition-all truncate px-1 text-center ${
            activeTab === "audit"
              ? "bg-canvas text-rausch shadow-xs font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Audit
        </button>
      </div>

      {/* TAB 1: WORKSPACE / HOUSEHOLD INFO */}
      {activeTab === "workspace" && (
        <div className="space-y-4">
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Ruang Bersama
              </span>
              <span className="text-[11px] font-medium text-ink-muted">
                Maksimal 2 Anggota
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-ink">
                {activeWorkspace?.name || "Ruang Keuangan"}
              </h2>
              <p className="text-xs text-ink-muted">
                Ruang catatan berdua untuk transparansi pengeluaran bersama.
              </p>
            </div>

            {/* Invite Code or Connected Status Box */}
            {partner ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Ruang Terhubung Penuh (2/2)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                    Terkunci
                  </span>
                </div>
                <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                  Kamu dan <strong className="font-bold text-emerald-900">{partner.name}</strong> sudah saling terhubung di ruang catatan ini. Kode undangan tidak perlu dimasukkan atau dibagikan lagi.
                </div>
                <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-700">
                  <span>
                    Kode Ruang: <code className="font-mono font-bold">{activeWorkspace?.inviteCode}</code>
                  </span>
                  <span className="italic">Kapasitas tercapai</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-soft border border-hairline rounded-sm space-y-1.5">
                <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                  Kode Undangan Pasangan
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-bold tracking-widest text-ink">
                    {activeWorkspace?.inviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInviteCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rausch hover:bg-rausch-active text-white rounded-sm text-xs font-semibold active:scale-95 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Kode
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted">
                  Bagikan kode ini kepada pasangan untuk bergabung ke ruang catatan ini.
                </p>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2 pt-2 border-t border-hairline">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Anggota Ruang (2 Orang)
              </div>

              {/* You */}
              <div className="flex items-center justify-between p-2.5 bg-surface-soft rounded-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rausch/10 text-rausch font-bold text-xs flex items-center justify-center">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {user?.name} <span className="text-[10px] text-rausch">(Kamu)</span>
                    </div>
                    <div className="text-[10px] text-ink-muted">{user?.email}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-surface-strong rounded-full text-ink font-medium">
                  {activeWorkspace?.role}
                </span>
              </div>

              {/* Partner */}
              {partner ? (
                <div className="flex items-center justify-between p-2.5 bg-surface-soft rounded-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">
                        {partner.name} <span className="text-[10px] text-emerald-600">(Pasangan)</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">{partner.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                    {partner.role}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-surface-strong/60 border border-dashed border-hairline-strong rounded-sm text-center space-y-1">
                  <Users className="w-6 h-6 text-ink-muted mx-auto" />
                  <div className="text-xs font-semibold text-ink">
                    Menunggu Pasangan Bergabung
                  </div>
                  <div className="text-[10px] text-ink-muted">
                    Kirim kode <strong>{activeWorkspace?.inviteCode}</strong> ke pasanganmu agar bisa saling mencatat bersama.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section Kebijakan Tanggal Transaksi */}
          {(() => {
            const currentEffectivePolicy =
              liveDatePolicy || activeWorkspace?.datePolicy || "STRICT_TODAY";

            return (
              <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rausch" />
                    Kebijakan Tanggal Pencatatan
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentEffectivePolicy === "STRICT_TODAY"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {currentEffectivePolicy === "STRICT_TODAY"
                      ? "🔒 Wajib Hari Ini"
                      : "🗓️ Bebas / Dinamis"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-ink">
                    Aturan Pencatatan Transaksi Baru
                  </h3>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Tentukan apakah transaksi baru wajib dicatat pada hari kejadian (untuk membangun kedisiplinan berdua) atau bebas memilih tanggal lampau.
                  </p>
                </div>

                {/* Jika ada pending approval */}
                {policyApprovals.length > 0 && (() => {
                  const pending = policyApprovals[0];
                  if (!pending) return null;
                  const isRequester = user?.id === pending.requesterId;
                  const targetLabel =
                    pending.targetValue === "STRICT_TODAY"
                      ? "Wajib Hari Ini Saja (Disiplin)"
                      : "Bebas / Dinamis";

                  return (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-sm space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Konfirmasi Pasangan Diperlukan</span>
                      </div>

                      {isRequester ? (
                        <p className="text-xs text-amber-800">
                          Kamu telah mengajukan perubahan kebijakan menjadi <strong>{targetLabel}</strong>. Menunggu pasanganmu menyetujuinya.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          <p className="text-xs text-amber-900">
                            Pasanganmu (<strong>{pending.requesterName}</strong>) mengajukan perubahan kebijakan tanggal menjadi: <strong>{targetLabel}</strong>.
                          </p>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              disabled={processingPolicyId === pending.id}
                              onClick={() => handleReviewPolicy(pending.id, "REJECT")}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-hairline hover:bg-white text-ink active:scale-95 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              disabled={processingPolicyId === pending.id}
                              onClick={() => handleReviewPolicy(pending.id, "APPROVE")}
                              className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-xs disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingPolicyId === pending.id && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              <span>Setujui</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Pilihan Kebijakan */}
                <div className="space-y-2">
                  {/* Option 1: STRICT_TODAY */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                      selectedDatePolicy === "STRICT_TODAY"
                        ? "bg-rausch/5 border-rausch ring-1 ring-rausch"
                        : "bg-surface-soft border-hairline hover:border-hairline-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name="datePolicy"
                      value="STRICT_TODAY"
                      checked={selectedDatePolicy === "STRICT_TODAY"}
                      onChange={() => setSelectedDatePolicy("STRICT_TODAY")}
                      className="mt-1 accent-rausch"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rausch" />
                          Wajib Hari Ini Saja (Disiplin)
                        </span>
                        <span className="text-[10px] font-bold text-rausch bg-rausch/10 px-1.5 py-0.5 rounded">
                          Rekomendasi
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted leading-snug">
                        Pencatatan baru dikunci otomatis ke tanggal hari ini. Mencegah manipulasi tanggal mundur dan membangun kebiasaan jujur mencatat keuangan secara real-time berdua.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: FLEXIBLE */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                      selectedDatePolicy === "FLEXIBLE"
                        ? "bg-rausch/5 border-rausch ring-1 ring-rausch"
                        : "bg-surface-soft border-hairline hover:border-hairline-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name="datePolicy"
                      value="FLEXIBLE"
                      checked={selectedDatePolicy === "FLEXIBLE"}
                      onChange={() => setSelectedDatePolicy("FLEXIBLE")}
                      className="mt-1 accent-rausch"
                    />
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                        Bebas / Fleksibel (Dinamis)
                      </span>
                      <p className="text-[11px] text-ink-muted leading-snug">
                        Bebas memilih tanggal pencatatan baru (termasuk tanggal lampau / kemarin). Tanggal pada data lama yang sudah tercatat tetap tidak bisa diubah.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Note Pasangan & Action Button */}
                <div className="pt-2 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <span className="text-[10px] text-ink-muted">
                    {activeWorkspace && activeWorkspace.members.length >= 2
                      ? "🤝 Mengubah kebijakan akan meminta persetujuan pasangan."
                      : "Mode mandiri: perubahan kebijakan langsung aktif."}
                  </span>
                  <button
                    type="button"
                    disabled={
                      isSavingPolicy ||
                      selectedDatePolicy === currentEffectivePolicy ||
                      policyApprovals.length > 0
                    }
                    onClick={handleSavePolicy}
                    className="w-full sm:w-auto px-4 py-2 bg-rausch hover:bg-rausch-active disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSavingPolicy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : activeWorkspace && activeWorkspace.members.length >= 2 ? (
                      <>
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Ajukan ke Pasangan</span>
                      </>
                    ) : (
                      <span>Simpan Kebijakan</span>
                    )}
                  </button>
                </div>
              </section>
            );
          })()}
        </div>
      )}

      {/* TAB 2: TELEGRAM BOT INTEGRATION */}
      {activeTab === "telegram" && (
        <div className="space-y-4">
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500" />
                Bot Telegram Notifier
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  telegramLinks.length > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-surface-strong text-ink-muted"
                }`}
              >
                {telegramLinks.length > 0 ? "Tersambung" : "Belum Aktif"}
              </span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Dapatkan notifikasi real-time di Telegram setiap kali pasanganmu mencatat transaksi. Input tetap 100% dilakukan melalui web.
            </p>

            {/* Quiet hours banner */}
            <div className="p-2.5 bg-surface-soft border border-hairline rounded-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Clock className="w-3.5 h-3.5 text-ink-muted" />
                <span>Jam Tenang (Quiet Hours): 22:00 - 07:00 WIB</span>
              </div>
              <p className="text-[10px] text-ink-muted">
                Pesan tidak akan berdering saat jam istirahat malam. Catatan diri sendiri tidak akan menotifikasi akun sendiri.
              </p>
            </div>

            {/* Telegram Links List */}
            {telegramLinks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-hairline">
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  Koneksi Telegram Aktif
                </div>
                {telegramLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-2.5 bg-surface-soft rounded-sm flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-ink">
                        {link.chatTitle || `Chat ID: ${link.chatId}`}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        Tipe: {link.chatType} • Status: {link.isActive ? "Aktif 🔔" : "Nonaktif 🔕"}
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold">✓ Terhubung</span>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Token CTA */}
            <div className="pt-2">
              {telegramLinkInfo ? (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-sm space-y-2">
                  <div className="text-xs font-bold text-sky-900">
                    Token Sambungan Dibuat (Berlaku 10 Menit):
                  </div>
                  <div className="font-mono text-sm font-bold text-sky-800 bg-white p-2 rounded-sm border border-sky-200 text-center tracking-wider">
                    {telegramLinkInfo.token}
                  </div>
                  <p className="text-[11px] text-sky-800">
                    Ketik perintah di bot Telegram atau klik tautan di bawah:
                  </p>
                  <a
                    href={telegramLinkInfo.botUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-sm text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    Buka Bot Telegram Sekarang <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isGeneratingTelegram}
                  onClick={handleGenerateTelegramToken}
                  className="w-full min-h-[44px] bg-rausch hover:bg-rausch-active text-white text-xs font-semibold rounded-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isGeneratingTelegram
                    ? "Menghubungkan..."
                    : "Hubungkan Akun Telegram"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: WALLETS MANAGEMENT */}
      {activeTab === "wallets" && (
        <div className="space-y-4">
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Kelola Dompet Keuangan
            </span>

            {/* Add Wallet Form */}
            <form onSubmit={handleAddWallet} className="space-y-2 p-3 bg-surface-soft rounded-sm border border-hairline">
              <div className="text-xs font-bold text-ink">Tambah Dompet Baru</div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="Nama (BCA, Gopay, dll)"
                  className="col-span-2 text-xs px-2.5 py-1.5 bg-canvas border border-hairline rounded-sm focus:outline-none focus:border-ink"
                />
                <select
                  value={newWalletType}
                  onChange={(e) => setNewWalletType(e.target.value as "CASH" | "BANK" | "EWALLET")}
                  className="text-xs px-2 py-1.5 bg-canvas border border-hairline rounded-sm"
                >
                  <option value="CASH">Tunai</option>
                  <option value="BANK">Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isAddingWallet || !newWalletName.trim()}
                className="w-full py-1.5 bg-rausch hover:bg-rausch-active disabled:bg-rausch-disabled text-white text-xs font-semibold rounded-sm transition-all"
              >
                {isAddingWallet ? "Menambahkan..." : "+ Simpan Dompet"}
              </button>
            </form>

            {/* Active Wallets List */}
            <div className="space-y-1.5 pt-2">
              {wallets.length === 0 ? (
                <div className="text-xs text-ink-muted py-2 text-center">
                  Belum ada dompet terdaftar.
                </div>
              ) : (
                wallets.map((w) => (
                  <div
                    key={w.id}
                    className="p-2.5 bg-surface-soft rounded-sm flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-ink-muted" />
                      <span className="font-semibold text-ink">{w.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-ink-muted uppercase">
                      {w.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB: TEMA WARNA (PRIMARY ACCENT COLOR) */}
      {activeTab === "theme" && (
        <div className="space-y-4">
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Tema Warna Primer
              </span>
              <div className="flex items-center gap-2">
                {isSyncingTheme && (
                  <span className="text-[10px] text-ink-muted flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-rausch" />
                    Menyinkronkan...
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rausch/10 text-rausch border border-rausch/20">
                  {currentTheme.name}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-ink-muted leading-relaxed">
                Pilih warna aksen utama sesuai preferensi dan mood kalian berdua. Perubahan warna langsung diterapkan di seluruh tombol, ikon aktif, dan kartu ringkasan.
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-sm text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  {partner ? (
                    <>
                      <strong>Tersinkronisasi Otomatis:</strong> Tema ruang berlaku bersama. Mengubah warna di sini akan langsung mengubah tampilan di HP <strong>{partner.name}</strong>.
                    </>
                  ) : (
                    <>
                      <strong>Sinkronisasi Bersama:</strong> Begitu pasanganmu bergabung, kalian berdua akan otomatis menggunakan tema warna yang sama.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Theme Presets List */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {availableThemes.map((t) => {
                const isSelected = t.id === currentTheme.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={async () => {
                      await setThemeId(t.id);
                      showToast({
                        type: "success",
                        title: "Tema Warna Diperbarui",
                        message: partner
                          ? `Warna primer diubah ke ${t.name} dan disinkronkan ke HP ${partner.name}.`
                          : `Warna primer sekarang menggunakan ${t.name}.`,
                      });
                    }}
                    className={`p-3 rounded-md border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-rausch bg-rausch/5 shadow-xs"
                        : "border-hairline bg-surface-soft hover:bg-canvas hover:border-hairline-strong active:scale-[0.99]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full shadow-xs flex items-center justify-center flex-shrink-0 transition-transform"
                        style={{ backgroundColor: t.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isSelected && (
                            <span
                              style={{ backgroundColor: t.hex }}
                              className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-semibold shadow-xs"
                            >
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {t.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Live Preview Card */}
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pratinjau Langsung (Live Preview)
            </span>

            <div className="p-3 bg-surface-soft border border-hairline rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: currentTheme.hex }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xs"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">Catatan Keuangan Berdua</div>
                    <div className="text-[10px] text-ink-muted">Aksen utama: {currentTheme.name}</div>
                  </div>
                </div>
                <span
                  style={{ color: currentTheme.hex }}
                  className="text-xs font-bold"
                >
                  Rp 125.000
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  style={{ backgroundColor: currentTheme.hex }}
                  className="flex-1 min-h-[42px] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all hover:opacity-90"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Contoh Tombol Primary
                </button>
                <div
                  style={{
                    color: currentTheme.hex,
                    backgroundColor: `${currentTheme.hex}18`,
                    borderColor: `${currentTheme.hex}40`,
                  }}
                  className="px-3 min-h-[42px] font-semibold text-xs rounded-lg border flex items-center justify-center"
                >
                  Badge Aksen
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL (JEJAK PERUBAHAN) */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Jejak Perubahan (Append-Only)
              </span>
              <span className="text-[10px] text-ink-muted">Data Permanen</span>
            </div>

            <p className="text-xs text-ink-muted">
              Setiap penambahan, pengubahan, dan penghapusan transaksi selalu tercatat secara transparan di bawah ini.
            </p>

            {isLoadingAudit ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                Memuat riwayat audit...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted bg-surface-soft rounded-sm">
                Belum ada aktivitas tercatat di jejak audit.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-surface-soft border border-hairline-soft rounded-sm text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {formatJakartaDateTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      Tipe: {log.entityType} • ID: {log.entityId}
                    </div>
                    {log.after && (
                      <pre className="text-[9px] bg-canvas p-1.5 rounded-sm border border-hairline-soft overflow-x-auto text-ink-muted">
                        {JSON.stringify(log.after, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Developer Information Card */}
      <section className="bg-canvas border border-hairline rounded-md p-4 shadow-float space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://github.com/rendijulianto.png?size=96"
              alt="Foto Profil Rendi Julianto"
              className="w-10 h-10 rounded-full object-cover border border-hairline shadow-xs shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=Rendi+Julianto&background=ff385c&color=ffffff";
              }}
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-ink">Rendi Julianto</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-rausch/10 text-rausch rounded font-semibold">
                  Creator
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  Open Freelance
                </span>
              </div>
              <p className="text-[10px] text-ink-muted">
                Pengembang Couple Ledger (Cash-book.my.id)
              </p>
            </div>
          </div>

          <Link
            href="/tentang"
            className="text-[11px] font-semibold text-rausch hover:underline flex items-center gap-1"
          >
            <span>Profil</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Open Freelance Callout */}
        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900">
              Butuh Pembuatan Aplikasi Apapun? 🚀
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Open Project</span>
          </div>
          <p className="text-[10px] text-emerald-800 leading-relaxed">
            Siap bantu kembangkan aplikasi web, mobile, sistem kasir, atau bot otomatisasi.
          </p>
          <a
            href="https://wa.me/6282129632854?text=Halo%20Rendi,%20saya%20tertarik%20konsultasi%20pembuatan%20aplikasi."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>Hubungi WhatsApp: 082129632854</span>
          </a>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-hairline-soft">
          <a
            href="https://github.com/rendijulianto"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Rendi Julianto"
            className="flex-1 py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href="https://linkedin.com/in/rendijulianto"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Rendi Julianto"
            className="flex-1 py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://instagram.com/rendy.jul"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Rendi Julianto"
            className="flex-1 py-1.5 px-2 rounded-lg bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5 text-[#e4405f]" />
            <span>Instagram</span>
          </a>
        </div>
      </section>

      {/* Logout Action Card */}
      <section className="pt-1">
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full min-h-[48px] bg-canvas hover:bg-red-50 text-error border border-hairline hover:border-red-200 font-semibold text-xs rounded-sm shadow-2xs active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Akun ({user?.name})
        </button>
      </section>
    </div>
  );
}
