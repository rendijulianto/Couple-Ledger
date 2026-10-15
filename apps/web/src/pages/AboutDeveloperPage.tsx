import {
  Heart,
  ArrowLeft,
  Github,
  Linkedin,
  Instagram,
  Code2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Link } from "../lib/router";

export function AboutDeveloperPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col selection:bg-rausch selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-rausch flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base font-bold text-ink">Cash-book.my.id</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="space-y-8">
          {/* Section Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-strong border border-hairline text-[11px] font-semibold text-ink-muted mb-1">
              <Sparkles className="w-3.5 h-3.5 text-rausch" />
              <span>Di Balik Layar Cash-book.my.id</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Tentang Pengembang
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
              Halo! Terima kasih sudah menggunakan Couple Ledger untuk mengelola keuangan bersama pasangan tercinta.
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-canvas border border-hairline rounded-2xl p-6 sm:p-8 shadow-float text-center space-y-5">
            {/* GitHub Avatar (Auto fetched via GitHub avatar redirect) */}
            <div className="relative inline-block mx-auto">
              <img
                src="https://github.com/rendijulianto.png?size=240"
                alt="Foto Profil Rendi Julianto"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-hairline shadow-md mx-auto"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://ui-avatars.com/api/?name=Rendi+Julianto&background=ff385c&color=ffffff&size=240";
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rausch text-white flex items-center justify-center shadow-xs border-2 border-canvas">
                <Heart className="w-4 h-4 fill-white" />
              </div>
            </div>

            {/* Developer Details */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-ink">Rendi Julianto</h2>
              <p className="text-xs font-semibold text-rausch">
                Software Engineer • Creator of Couple Ledger
              </p>
              <p className="text-xs text-ink-muted leading-relaxed max-w-lg mx-auto pt-2">
                Saya membangun Couple Ledger berawal dari kebutuhan nyata: bagaimana pasangan dapat mencatat pengeluaran harian dan anggaran rumah tangga secara jujur, transparan, dan tidak kaku tanpa harus mengorbankan privasi data.
              </p>
            </div>

            {/* Social Links Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {/* GitHub */}
              <a
                href="https://github.com/rendijulianto"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-xs font-bold transition-all flex items-center gap-2 group shadow-xs active:scale-95"
              >
                <Github className="w-4 h-4 text-ink group-hover:text-rausch transition-colors" />
                <span>github.com/rendijulianto</span>
                <ExternalLink className="w-3 h-3 text-ink-muted" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/rendijulianto"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-xs font-bold transition-all flex items-center gap-2 group shadow-xs active:scale-95"
              >
                <Linkedin className="w-4 h-4 text-[#0077b5]" />
                <span>linkedin.com/in/rendijulianto</span>
                <ExternalLink className="w-3 h-3 text-ink-muted" />
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/rendy.jul"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-soft hover:bg-surface-strong border border-hairline text-ink text-xs font-bold transition-all flex items-center gap-2 group shadow-xs active:scale-95"
              >
                <Instagram className="w-4 h-4 text-[#e4405f]" />
                <span>@rendy.jul</span>
                <ExternalLink className="w-3 h-3 text-ink-muted" />
              </a>
            </div>
          </div>

          {/* OPEN FOR FREELANCE & CUSTOM APP DEVELOPMENT CARD */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-canvas to-emerald-50/40 border-2 border-emerald-200 rounded-2xl p-6 sm:p-8 shadow-float space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Open for Freelance &amp; Custom Project</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Tersedia untuk Pekerjaan Baru</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-2xl font-extrabold text-ink tracking-tight">
                Butuh Aplikasi Apapun? Kami Siap Bantu! 🚀
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Punya ide bisnis, butuh sistem operasional internal, atau ingin membuat aplikasi seperti Couple Ledger? Kami siap membantu mewujudkan aplikasi impian Anda mulai dari perancangan arsitektur, desain antarmuka (UI/UX), pengembangan fullstack, hingga siap pakai dan rilis ke produksi.
              </p>
            </div>

            {/* Services bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-ink font-medium">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-canvas border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplikasi Web &amp; SaaS Modern (React, Bun, Node)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-canvas border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplikasi Mobile &amp; Progressive Web App (PWA)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-canvas border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bot Otomatisasi (Telegram &amp; WhatsApp Bot)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-canvas border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sistem Kasir (POS), Keuangan &amp; Bisnis</span>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="https://wa.me/6282129632854?text=Halo%20Rendi,%20saya%20tertarik%20konsultasi%20pembuatan%20aplikasi."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp: 082129632854</span>
              </a>
              <a
                href="tel:082129632854"
                className="min-h-[48px] px-5 py-3 bg-canvas hover:bg-surface-soft border border-hairline text-ink font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <Phone className="w-4 h-4 text-ink-muted" />
                <span>082129632854</span>
              </a>
            </div>
            <p className="text-[11px] text-center text-ink-muted pt-1">
              Konsultasi awal gratis • Pengerjaan cepat, transparan, dan terstruktur.
            </p>
          </div>

          {/* Project Philosophy & Architecture Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-canvas border border-hairline rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-ink">
                <Code2 className="w-4 h-4 text-rausch" />
                <span>Teknologi Modern</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Dibangun menggunakan Bun, Elysia, PostgreSQL, React 18, TypeScript, dan Tailwind CSS dengan arsitektur Modular Monolith yang sangat cepat dan hemat sumber daya.
              </p>
            </div>

            <div className="p-5 bg-canvas border border-hairline rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-ink">
                <ShieldCheck className="w-4 h-4 text-rausch" />
                <span>Privasi Mandiri</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Tidak ada data yang dijual ke pihak ketiga atau pengiklan. Keuangan Anda dan pasangan adalah ranah privat yang wajib dijaga kerahasiaannya.
              </p>
            </div>
          </div>

          {/* Back to Home CTA */}
          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 min-h-[48px] px-7 py-3 bg-rausch hover:bg-rausch-active text-white font-bold text-sm rounded-lg shadow-sm transition-all"
            >
              <span>Mulai Catat Keuangan Berdua</span>
              <Heart className="w-4 h-4 fill-white" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-8 text-center text-xs text-ink-muted">
        <p>&copy; 2026 Cash-book.my.id • Couple Ledger. Dibuat dengan ♥ oleh Rendi Julianto.</p>
      </footer>
    </div>
  );
}
