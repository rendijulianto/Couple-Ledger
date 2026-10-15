import { Heart, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { Link } from "../lib/router";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-rausch flex items-center justify-center text-white shadow-xs">
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
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-hairline pb-6 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rausch">
              Pedoman Layanan
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Syarat &amp; Ketentuan Layanan
            </h1>
            <p className="text-xs text-ink-muted">
              Terakhir diperbarui: 15 Oktober 2026 • Cash-book.my.id (Couple Ledger)
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-rausch" />
              1. Penerimaan Syarat
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Dengan mengakses atau mendaftar di <strong>Cash-book.my.id</strong>, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui salah satu ketentuan, Anda dipersilakan untuk tidak menggunakan layanan ini.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-rausch" />
              2. Deskripsi Layanan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Cash-book.my.id menyediakan platform berbasis web untuk mencatat pemasukan dan pengeluaran harian, mengelola anggaran bulanan, serta memfasilitasi transparansi pembukuan antara pasangan. Layanan ini adalah alat bantu pencatatan (*record-keeping utility*) dan <strong>bukan lembaga keuangan, perbankan, penyedia pinjaman, atau penasihat investasi berlisensi</strong>.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">3. Ruang Keuangan Berdua &amp; Tanggung Jawab</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Setiap ruang keuangan bersama (workspace) dibatasi maksimal 2 pengguna terhubung. Anda bertanggung jawab penuh atas:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-ink-muted space-y-1.5 pl-2">
              <li>Kerahasiaan akun, kata sandi, dan kode undangan ruang Anda.</li>
              <li>Memberikan kode undangan hanya kepada pasangan sah atau orang yang Anda percaya.</li>
              <li>Akurasi nominal pengeluaran dan catatan transaksi yang Anda masukkan.</li>
              <li>Keputusan persetujuan koreksi atau penghapusan transaksi yang diajukan oleh pasangan Anda.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">4. Penggunaan yang Dilarang</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Pengguna dilarang memanfaatkan platform ini untuk aktivitas yang melanggar hukum di Republik Indonesia, termasuk namun tidak terbatas pada pencucian uang (*money laundering*), pendanaan aktivitas ilegal, memasukkan data berbahaya (skrip injeksi/malware), atau mencoba merusak integritas sistem multi-tenant.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">5. Batasan Tanggung Jawab</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Layanan disediakan secara "apa adanya" (*as is*) tanpa jaminan tanpa gangguan. Cash-book.my.id tidak bertanggung jawab atas kerugian finansial, perselisihan pribadi atau rumah tangga yang timbul dari perbedaan pencatatan, atau kesalahan penginputan data oleh pengguna.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">6. Hubungi Kami</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Untuk pertanyaan terkait Syarat &amp; Ketentuan ini, silakan hubungi kami di:{" "}
              <a
                href="mailto:support@cash-book.my.id"
                className="text-rausch font-semibold underline"
              >
                support@cash-book.my.id
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-8 text-center text-xs text-ink-muted">
        <p>&copy; 2026 Cash-book.my.id • Couple Ledger. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

