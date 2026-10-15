import React, { useState } from "react";
import { Heart, Lock, Mail, User, AlertCircle, ArrowRight, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { Link } from "../lib/router";

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const { user, workspaces, login, register, refreshAuth } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    workspaceName?: string;
    inviteCode?: string;
  }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // For Workspace Onboarding when user is logged in but has no workspace
  const [onboardingType, setOnboardingType] = useState<"create" | "join">("create");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isOnboarding, setIsOnboarding] = useState(false);

  const validateAuthForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email validation
    if (!email.trim()) {
      errors.email = "Alamat email wajib diisi.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Format email tidak valid (contoh: nama@email.com).";
    }

    // Password validation
    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 8) {
      errors.password = "Kata sandi minimal 8 karakter.";
    }

    if (mode === "register") {
      // Name validation
      if (!name.trim()) {
        errors.name = "Nama panggilan wajib diisi.";
      } else if (name.trim().length < 2) {
        errors.name = "Nama panggilan minimal 2 karakter.";
      }

      // Confirm Password
      if (!confirmPassword) {
        errors.confirmPassword = "Ulangi kata sandi Anda.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateAuthForm()) {
      showToast({
        type: "error",
        title: "Periksa Formulir",
        message: "Mohon lengkapi dan periksa data yang Anda masukkan.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
        showToast({
          type: "success",
          title: "Berhasil Masuk",
          message: "Selamat datang kembali di Couple Ledger!",
        });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
        showToast({
          type: "success",
          title: "Pendaftaran Berhasil",
          message: "Akun Anda siap digunakan! Silakan siapkan ruang keuangan berdua.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan autentikasi";
      setGlobalError(msg);
      showToast({
        type: "error",
        title: mode === "login" ? "Gagal Masuk" : "Gagal Mendaftar",
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const errors: typeof fieldErrors = {};
    if (onboardingType === "create") {
      if (!workspaceName.trim()) {
        errors.workspaceName = "Nama ruang keuangan tidak boleh kosong.";
      } else if (workspaceName.trim().length < 3) {
        errors.workspaceName = "Nama ruang minimal 3 karakter.";
      }
    } else {
      const cleanCode = inviteCode.trim();
      if (!cleanCode) {
        errors.inviteCode = "Kode undangan wajib diisi.";
      } else if (cleanCode.length < 6) {
        errors.inviteCode = "Kode undangan tidak lengkap.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast({
        type: "error",
        title: "Input Belum Sesuai",
        message: "Periksa kembali data ruang keuangan Anda.",
      });
      return;
    }

    setIsOnboarding(true);

    try {
      if (onboardingType === "create") {
        const res = await api.workspaces.post({
          name: workspaceName.trim() || "Dompet Berdua",
        });
        if (res.error) {
          const errVal = res.error.value as { error?: { message?: string } };
          throw new Error(errVal?.error?.message || "Gagal membuat ruang");
        }
        showToast({
          type: "success",
          title: "Ruang Berhasil Dibuat",
          message: `Ruang "${workspaceName.trim()}" siap digunakan bersama pasangan!`,
        });
      } else {
        const res = await api.workspaces.join.post({
          inviteCode: inviteCode.trim().toUpperCase(),
        });
        if (res.error) {
          const errVal = res.error.value as { error?: { message?: string } };
          throw new Error(errVal?.error?.message || "Gagal bergabung ke ruang pasangan");
        }
        showToast({
          type: "success",
          title: "Berhasil Bergabung",
          message: "Kamu telah terhubung ke ruang keuangan pasanganmu!",
        });
      }
      await refreshAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses ruang keuangan";
      setGlobalError(msg);
      showToast({
        type: "error",
        title: "Gagal Memproses",
        message: msg,
      });
    } finally {
      setIsOnboarding(false);
    }
  };

  // If user is authenticated but has no workspaces yet, show workspace onboarding
  if (user && workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
        <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-float space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-rausch/10 text-rausch flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-ink">
              Halo, {user.name}! 👋
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Kamu belum tergabung dalam ruang keuangan bersama pasangan. Mulai dengan membuat ruang baru atau masukkan kode undangan dari pasanganmu.
            </p>
          </div>

          {globalError && (
            <div className="p-2.5 rounded-lg bg-error-soft border border-red-200 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Toggle Create / Join */}
          <div className="grid grid-cols-2 p-1 bg-surface-strong rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setOnboardingType("create");
                setGlobalError(null);
                setFieldErrors({});
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                onboardingType === "create"
                  ? "bg-canvas text-rausch shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Buat Ruang Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboardingType("join");
                setGlobalError(null);
                setFieldErrors({});
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                onboardingType === "join"
                  ? "bg-canvas text-rausch shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Gabung Kode Pasangan
            </button>
          </div>

          <form onSubmit={handleWorkspaceAction} className="space-y-4">
            {onboardingType === "create" ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  Nama Ruang Keuangan
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    if (fieldErrors.workspaceName) setFieldErrors((p) => ({ ...p, workspaceName: undefined }));
                  }}
                  placeholder="Contoh: Dompet Rendi & Syifa"
                  className={`w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                    fieldErrors.workspaceName ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
                  }`}
                />
                {fieldErrors.workspaceName && (
                  <p className="text-[11px] text-error font-medium">{fieldErrors.workspaceName}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  Kode Undangan Pasangan
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    if (fieldErrors.inviteCode) setFieldErrors((p) => ({ ...p, inviteCode: undefined }));
                  }}
                  placeholder="Contoh: A1B2C3D4"
                  className={`w-full text-xs font-mono uppercase tracking-widest text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                    fieldErrors.inviteCode ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
                  }`}
                />
                {fieldErrors.inviteCode ? (
                  <p className="text-[11px] text-error font-medium">{fieldErrors.inviteCode}</p>
                ) : (
                  <p className="text-[10px] text-ink-muted pt-0.5">
                    Minta kode undangan dari pasanganmu yang sudah membuat ruang.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isOnboarding}
              className="w-full min-h-[48px] bg-rausch hover:bg-rausch-active text-white font-bold text-sm rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isOnboarding ? (
                <span className="animate-pulse">Memproses...</span>
              ) : onboardingType === "create" ? (
                "Buat Ruang Sekarang"
              ) : (
                "Gabung ke Ruang Pasangan"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Back to Home Link */}
      <div className="mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-full bg-rausch flex items-center justify-center text-white shadow-sm mx-auto">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Couple Ledger</h1>
        <p className="text-xs text-ink-muted">
          Catatan Harian Berdua • Transparan, Cepat & Terhubung
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-float space-y-5">
        {/* Toggle Login / Register */}
        <div className="grid grid-cols-2 p-1 bg-surface-strong rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setGlobalError(null);
              setFieldErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-canvas text-rausch shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setGlobalError(null);
              setFieldErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-canvas text-rausch shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {globalError && (
          <div className="p-2.5 rounded-lg bg-error-soft border border-red-200 text-error text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitAuth} className="space-y-3.5" noValidate>
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" />
                Nama Panggilan
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="Misal: Rendi atau Syifa"
                className={`w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                  fieldErrors.name ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-error font-medium">{fieldErrors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="nama@email.com"
              className={`w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                fieldErrors.email ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-error font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Minimal 8 karakter"
              className={`w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                fieldErrors.password ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
              }`}
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-error font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ulangi Kata Sandi
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                placeholder="Ketik ulang kata sandi Anda"
                className={`w-full text-xs text-ink px-3 py-2.5 bg-surface-soft border rounded-xl focus:outline-none transition-colors ${
                  fieldErrors.confirmPassword ? "border-error bg-error-soft/30 focus:border-error" : "border-hairline focus:border-ink"
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-error font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-rausch hover:bg-rausch-active disabled:bg-rausch-disabled text-white font-bold text-sm rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <span>{mode === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer info */}
      <footer className="mt-8 text-center text-[11px] text-ink-muted space-y-2">
        <div>Couple Ledger • Catatan Harian Berdua dengan Telegram Bot</div>
        <div className="flex justify-center gap-4 text-[11px]">
          <Link href="/" className="hover:text-ink transition-colors">
            Beranda
          </Link>
          <span>•</span>
          <Link href="/kebijakan-privasi" className="hover:text-ink transition-colors">
            Kebijakan Privasi
          </Link>
          <span>•</span>
          <Link href="/syarat-ketentuan" className="hover:text-ink transition-colors">
            Syarat &amp; Ketentuan
          </Link>
        </div>
      </footer>
    </div>
  );
}
