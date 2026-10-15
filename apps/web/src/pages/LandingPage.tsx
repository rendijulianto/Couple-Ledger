import { useState } from "react";
import {
  Heart,
  ShieldCheck,
  Send,
  Users,
  CheckCircle2,
  Clock,
  TrendingDown,
  Lock,
  ArrowRight,
  ChevronDown,
  Sparkles,
  PieChart as PieIcon,
  Check,
  AlertTriangle,
  Github,
  Linkedin,
  Instagram,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Link } from "../lib/router";
import { useAuth } from "../context/AuthContext";

export function LandingPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Apa keunggulan Cash-book.my.id dibandingkan aplikasi catatan biasa?",
      a: "Aplikasi ini dirancang khusus untuk pasangan dengan sistem transparansi aktif. Setiap perubahan nominal atau penghapusan transaksi memerlukan persetujuan pasangan (Partner Confirmation), memiliki opsi Kebijakan Tanggal Ketat agar catatan tetap disiplin di hari H, serta terintegrasi langsung dengan bot notifikasi Telegram.",
    },
    {
      q: "Apakah pasangan saya harus membuat akun terpisah?",
      a: "Ya. Masing-masing pihak mendaftar dengan akun pribadinya sendiri. Setelah itu, salah satu pihak membuat 'Ruang Keuangan' dan membagikan kode undangan unik (misalnya: AB12CD) kepada pasangannya untuk bergabung dalam satu ruang catatan bersama yang aman.",
    },
    {
      q: "Bagaimana jika saya atau pasangan salah memasukkan nominal pengeluaran?",
      a: "Tidak perlu panik. Anda dapat mengedit atau meminta penghapusan transaksi tersebut kapan saja. Demi menjaga rasa saling percaya, perubahan atau penghapusan tersebut akan berstatus 'Menunggu Persetujuan Pasangan' hingga disetujui oleh pihak pasangan Anda.",
    },
    {
      q: "Bagaimana cara kerja notifikasi bot Telegram?",
      a: "Di dalam menu Pengaturan, Anda dapat menghasilkan token tautan sekali pakai untuk menghubungkan bot Telegram Couple Ledger ke chat pribadi atau grup Telegram berdua. Setiap kali pasangan Anda mencatat pengeluaran, Telegram akan mengirimkan rincian transaksi seketika.",
    },
    {
      q: "Apakah aplikasi ini memiliki batasan anggota dalam satu ruang?",
      a: "Ya, demi menjaga privasi dan fokus hubungan berdua, setiap ruang keuangan dibatasi ketat maksimal 2 anggota (Anda dan Pasangan). Pihak ketiga tidak akan dapat bergabung ke dalam ruang Anda.",
    },
    {
      q: "Apakah data keuangan kami aman dan terjamin kerahasiaannya?",
      a: "Sangat aman. Kata sandi dienkripsi menggunakan algoritma Argon2id modern, sesi login dilindungi token httpOnly, dan setiap modifikasi dicatat dalam log audit permanen (append-only). Data transaksi menggunakan sistem soft delete sehingga riwayat pembukuan Anda tidak pernah hilang secara sepihak.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans selection:bg-rausch selection:text-white flex flex-col">
      {/* Top Header / Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-rausch flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-ink">
                Cash-book<span className="text-rausch">.my.id</span>
              </span>
              <span className="text-[10px] text-ink-muted -mt-1 font-medium hidden sm:inline">
                Couple Ledger • Catatan Berdua
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
            <a href="#fitur" className="hover:text-ink transition-colors">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-ink transition-colors">
              Cara Kerja
            </a>
            <a href="#keamanan" className="hover:text-ink transition-colors">
              Keamanan
            </a>
            <a href="#faq" className="hover:text-ink transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                href="/app"
                className="min-h-[40px] px-4 py-2 bg-rausch hover:bg-rausch-active text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Buka Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="min-h-[40px] px-3.5 py-2 text-ink hover:text-rausch text-xs sm:text-sm font-semibold transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="min-h-[40px] px-4 py-2 bg-rausch hover:bg-rausch-active text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Mulai Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-hairline-soft bg-gradient-to-b from-canvas via-surface-soft/40 to-canvas">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-strong border border-hairline text-ink text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-rausch" />
              <span>Aplikasi Pencatatan Keuangan Khusus Pasangan</span>
            </div>

            {/* Main Headline H1 */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight leading-[1.18] sm:leading-[1.15] mb-5">
              Catat Keuangan Bersama Pasangan{" "}
              <span className="text-rausch block sm:inline">
                dengan Lebih Transparan
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed mb-8">
              Kelola pengeluaran harian dan anggaran rumah tangga berdua tanpa
              salah paham. Dilengkapi sistem persetujuan koreksi pasangan,
              kebijakan tanggal ketat, dan notifikasi instan bot Telegram.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
              <Link
                href="/daftar"
                className="w-full sm:w-auto min-h-[48px] px-7 py-3 bg-rausch hover:bg-rausch-active active:scale-[0.99] text-white font-bold text-sm rounded-lg shadow-float transition-all flex items-center justify-center gap-2"
              >
                <span>Mulai Catat Berdua — Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#cara-kerja"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-canvas hover:bg-surface-soft border border-hairline text-ink font-semibold text-sm rounded-lg transition-colors flex items-center justify-center"
              >
                Lihat Cara Kerja
              </a>
            </div>

            {/* Trust Indicator Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-ink-muted pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rausch" />
                <span>100% Bebas Iklan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rausch" />
                <span>Khusus 2 Anggota (Privat)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Send className="w-4 h-4 text-rausch" />
                <span>Bot Telegram Terhubung</span>
              </div>
            </div>

            {/* Interactive Real UI Mockup Preview */}
            <div className="mt-12 sm:mt-16 max-w-md mx-auto bg-canvas border border-hairline rounded-2xl p-5 shadow-float text-left">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-hairline-soft mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rausch/10 text-rausch flex items-center justify-center font-bold text-xs">
                    💑
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">Dompet Rendi & Syifa</h3>
                    <p className="text-[10px] text-ink-muted">Ruang Keuangan Berdua • Aktif</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Sinkron Live
                </span>
              </div>

              {/* Budget Progress Card */}
              <div className="p-3 bg-surface-soft rounded-xl mb-3.5">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-ink-muted">Anggaran Bulanan</span>
                  <span className="font-bold text-ink">Rp 3.500.000 / Rp 5.000.000</span>
                </div>
                <div className="w-full bg-hairline rounded-full h-2 overflow-hidden">
                  <div className="bg-rausch h-full rounded-full w-[70%]" />
                </div>
                <p className="text-[10px] text-ink-muted mt-1 text-right">
                  70% terpakai • Sisa Rp 1.500.000
                </p>
              </div>

              {/* Mock Transaction Items */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl border border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-strong flex items-center justify-center text-sm">
                      ☕
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Kopi & Sarapan</p>
                      <p className="text-[10px] text-ink-muted">Oleh Rendi • BCA</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ink">-Rp 45.000</span>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm">
                        🛒
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">Belanja Mingguan</p>
                        <p className="text-[10px] text-ink-muted">Koreksi: Rp 350.000 → Rp 290.000</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-ink">-Rp 290.000</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-amber-200/60 text-[10px] font-semibold text-amber-800">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Menunggu persetujuan koreksi dari Syifa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PAIN POINTS SOLVED */}
        <section className="py-14 sm:py-20 bg-surface-soft/60 border-b border-hairline">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
                Masalah Finansial Pasangan yang Kami Selesaikan
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Mengatur uang bersama sering kali memicu perdebatan karena rasa
                sungkan atau catatan yang tidak rapi. Cash-book.my.id hadir untuk
                menghilangkan beban tersebut.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-error flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-ink">
                  Sering Lupa Mencatat Pengeluaran Kecil
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Jajan harian, parkir, dan belanja mendadak sering luput. Dengan
                  fitur Quick Add 5 detik dan notifikasi Telegram, setiap rupiah
                  terekam tanpa repot.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-rausch/10 text-rausch flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-ink">
                  Rasa Curiga & Kesalahpahaman Sepele
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Menghilangkan rasa curiga lewat sistem persetujuan bersama. Jika
                  ada koreksi nominal transaksi, pasangan akan diminta
                  konfirmasi terlebih dahulu.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-ink">
                  Bocor Halus & Boncos di Akhir Bulan
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Pantau pagu anggaran bulanan berdua. Dapatkan peringatan
                  otomatis saat pengeluaran menyentuh 80% dan 100% dari batas yang
                  disepakati.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: VERIFIED FEATURES GRID */}
        <section id="fitur" className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-rausch mb-2 block">
              Fitur Nyata &amp; Teruji
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight mb-4">
              Dirancang Khusus untuk Transparansi Berdua
            </h2>
            <p className="text-xs sm:text-base text-ink-muted leading-relaxed">
              Bukan sekadar pencatat uang pribadi yang dipaksakan. Seluruh fitur
              dibangun berdasarkan kebutuhan nyata pasangan yang ingin saling
              percaya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <Users className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Ruang Eksklusif 2 Anggota
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Setiap ruang keuangan dibatasi maksimal 2 anggota (Anda dan
                pasangan) via kode undangan privat. Tidak ada data yang bocor ke
                pihak luar.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <Check className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Persetujuan Koreksi Pasangan
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Setiap kali Anda atau pasangan mengedit nominal atau menghapus
                transaksi, data masuk ke antrean persetujuan. Tidak ada pengubahan
                diam-diam.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <Clock className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Kebijakan Tanggal Ketat
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Mode Strict Today mengunci transaksi pada hari ini agar pencatatan
                tetap disiplin. Mengubah ke tanggal lampau memerlukan persetujuan
                kedua belah pihak.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <Send className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Notifikasi Bot Telegram Instan
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Tautkan bot Telegram pribadi atau grup berdua. Dapatkan
                notifikasi otomatis seketika saat pasangan mencatat pengeluaran
                atau saat anggaran menipis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <PieIcon className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Laporan &amp; Pembagian Pengeluaran
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Lihat grafik proporsi pengeluaran per kategori. Filter laporan
                berdasarkan "Semua", "Saya", atau "Pasangan" untuk melihat
                kontribusi masing-masing secara objektif.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-canvas border border-hairline rounded-xl shadow-xs hover:border-rausch/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-strong text-ink flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-rausch" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Audit Trail Permanen &amp; Soft Delete
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Data transaksi tidak pernah dihapus permanen (soft delete).
                Setiap aksi tercatat rapi pada log audit append-only demi menjaga
                integritas pembukuan keluarga.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW IT WORKS */}
        <section id="cara-kerja" className="py-16 sm:py-20 bg-surface-soft/60 border-y border-hairline">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-2">
                Mulai Hanya dalam 3 Langkah
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted">
                Tidak perlu setup rumit atau menghubungkan rekening bank. Cepat dan
                privat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rausch text-white flex items-center justify-center font-bold text-base shadow-xs">
                  1
                </div>
                <h3 className="text-sm font-bold text-ink">Daftar Akun &amp; Buat Ruang</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Daftarkan diri Anda dalam 1 menit. Buat ruang keuangan baru
                  seperti "Dompet Bersama".
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rausch text-white flex items-center justify-center font-bold text-base shadow-xs">
                  2
                </div>
                <h3 className="text-sm font-bold text-ink">Bagikan Kode ke Pasangan</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Kirimkan kode undangan 8-karakter unik ke pasangan Anda agar dia
                  bisa langsung terhubung.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rausch text-white flex items-center justify-center font-bold text-base shadow-xs">
                  3
                </div>
                <h3 className="text-sm font-bold text-ink">Catat Bersama &amp; Pantau</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Mulai catat transaksi harian, atur anggaran bulanan, dan nikmati
                  keuangan yang transparan tanpa beban.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 min-h-[48px] px-8 py-3 bg-rausch hover:bg-rausch-active text-white font-bold text-sm rounded-lg shadow-sm transition-all"
              >
                <span>Daftar Sekarang Juga</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 5: SECURITY & PRIVACY */}
        <section id="keamanan" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-canvas border border-hairline rounded-2xl p-6 sm:p-10 shadow-float">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rausch/10 text-rausch flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Privasi &amp; Perlindungan Data Keuangan Anda
                </h2>
                <p className="text-xs text-ink-muted">
                  Kami memperlakukan data keuangan pribadi dengan standar privasi
                  paling ketat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-ink-muted pt-2 border-t border-hairline-soft">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rausch shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Enkripsi Kata Sandi Argon2id:</strong>{" "}
                  Standar keamanan hash modern yang melindungi akun Anda dari
                  serangan brute force.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rausch shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Isolasi Multi-Tenant:</strong>{" "}
                  Data transaksi Anda diisolasi ketat di tingkat basis data dan
                  hanya bisa dibaca oleh Anda dan pasangan Anda.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rausch shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Tanpa Penjualan Data:</strong>{" "}
                  Data Anda adalah milik Anda berdua. Kami tidak menjual data
                  transaksi kepada pihak ketiga atau pengiklan.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rausch shrink-0 mt-0.5" />
                <p>
                  <strong className="text-ink">Audit Log Permanen:</strong>{" "}
                  Setiap aksi dicatat dalam log append-only untuk memastikan tidak
                  ada perubahan rahasia di belakang pasangan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: FAQ ACCORDION */}
        <section id="faq" className="py-16 sm:py-20 bg-surface-soft/60 border-t border-hairline">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-rausch mb-1 block">
                Tanya Jawab
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                Pertanyaan yang Sering Diajukan
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-ink hover:text-rausch transition-colors min-h-[48px]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        openFaq === idx ? "rotate-180 text-rausch" : "text-ink-muted"
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-ink-muted leading-relaxed border-t border-hairline-soft pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: FINAL CTA BANNER */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-rausch to-rausch-active text-white text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Siap Membangun Keuangan Berdua yang Lebih Harmonis?
            </h2>
            <p className="text-xs sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
              Mulai sekarang. Tidak ada lagi salah paham nominal atau catatan
              yang terlewat. Rasakan kemudahan mencatat keuangan bersama pasangan.
            </p>
            <div className="pt-2">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 min-h-[48px] px-8 py-3 bg-white text-rausch hover:bg-surface-soft font-bold text-sm rounded-lg shadow-float transition-all"
              >
                <span>Daftar Akun Berdua Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-[11px] text-white/80 pt-2">
              Gratis • Tanpa Kartu Kredit • Setup Kurang dari 2 Menit
            </p>
          </div>
        </section>
      </main>

      {/* DEVELOPER SPOTLIGHT / TENTANG PENGEMBANG */}
      <section className="border-t border-hairline bg-surface-soft/40 py-8 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://github.com/rendijulianto.png?size=96"
              alt="Foto Profil Rendi Julianto"
              className="w-12 h-12 rounded-full object-cover border border-hairline shadow-xs shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://ui-avatars.com/api/?name=Rendi+Julianto&background=ff385c&color=ffffff";
              }}
            />
            <div className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-ink">Rendi Julianto</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-rausch/10 text-rausch rounded font-semibold">Creator</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open Freelance
                </span>
              </div>
              <p className="text-[11px] text-ink-muted pt-0.5">
                Butuh bantuan pembuatan aplikasi web, mobile, atau bot? Hubungi WhatsApp: <strong>082129632854</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://wa.me/6282129632854?text=Halo%20Rendi,%20saya%20tertarik%20konsultasi%20pembuatan%20aplikasi."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp: 082129632854</span>
            </a>
            <a
              href="https://github.com/rendijulianto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Rendi Julianto"
              className="w-8 h-8 rounded-full bg-canvas border border-hairline hover:border-ink text-ink hover:text-rausch flex items-center justify-center transition-colors shadow-xs"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/in/rendijulianto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Rendi Julianto"
              className="w-8 h-8 rounded-full bg-canvas border border-hairline hover:border-ink text-ink hover:text-[#0077b5] flex items-center justify-center transition-colors shadow-xs"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/rendy.jul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Rendi Julianto"
              className="w-8 h-8 rounded-full bg-canvas border border-hairline hover:border-ink text-ink hover:text-[#e4405f] flex items-center justify-center transition-colors shadow-xs"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <Link
              href="/tentang"
              className="px-3 py-1.5 bg-canvas hover:bg-surface-strong border border-hairline rounded-lg text-ink text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Profil</span>
              <ExternalLink className="w-3 h-3 text-ink-muted" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hairline bg-canvas py-10 text-xs text-ink-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rausch flex items-center justify-center text-white">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-ink">Cash-book.my.id</span>
            <span className="text-hairline-strong">|</span>
            <span>Couple Ledger</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/" className="hover:text-ink transition-colors">
              Beranda
            </Link>
            <Link href="/masuk" className="hover:text-ink transition-colors">
              Masuk
            </Link>
            <Link href="/daftar" className="hover:text-ink transition-colors">
              Daftar
            </Link>
            <Link href="/tentang" className="hover:text-ink transition-colors">
              Pengembang
            </Link>
            <Link
              href="/kebijakan-privasi"
              className="hover:text-ink transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/syarat-ketentuan"
              className="hover:text-ink transition-colors"
            >
              Syarat &amp; Ketentuan
            </Link>
          </div>

          <p className="text-[11px]">
            &copy; 2026 Cash-book.my.id. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

