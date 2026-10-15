import { Heart, ArrowLeft, ShieldCheck, Lock, Eye, Database } from "lucide-react";
import { Link } from "../lib/router";

export function PrivacyPolicyPage() {
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
              Transparansi &amp; Keamanan
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-ink-muted">
              Terakhir diperbarui: 15 Oktober 2026 • Berlaku efektif untuk seluruh pengguna Cash-book.my.id
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rausch" />
              1. Komitmen Privasi Kami
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Di <strong>Cash-book.my.id (Couple Ledger)</strong>, kami sangat menghargai privasi dan kepercayaan Anda dan pasangan Anda. Aplikasi ini didesain dari awal dengan prinsip <em>privacy-by-design</em> untuk memastikan data catatan keuangan Anda berdua tetap aman, rahasia, dan hanya dapat diakses oleh pihak yang berwenang (Anda dan pasangan sah Anda).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Database className="w-5 h-5 text-rausch" />
              2. Data yang Kami Kumpulkan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Kami hanya mengumpulkan informasi minimal yang diperlukan untuk menjalankan layanan pencatatan keuangan berdua:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-ink-muted space-y-1.5 pl-2">
              <li>
                <strong>Informasi Akun:</strong> Nama panggilan dan alamat email untuk keperluan autentikasi dan komunikasi sistem.
              </li>
              <li>
                <strong>Kata Sandi Terenkripsi:</strong> Kata sandi Anda langsung di-hash menggunakan algoritma <code>Argon2id</code>. Kami tidak pernah menyimpan kata sandi Anda dalam bentuk teks polos (plain text).
              </li>
              <li>
                <strong>Data Transaksi:</strong> Nominal (dalam Rupiah), kategori transaksi, subkategori, dompet/rekening sumber, catatan keterangan, dan tanggal transaksi yang Anda masukkan secara sadar.
              </li>
              <li>
                <strong>Tautan Telegram (Opsional):</strong> ID obrolan Telegram bagi pengguna yang secara sukarela mengaktifkan notifikasi bot Telegram.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Lock className="w-5 h-5 text-rausch" />
              3. Bagaimana Data Dilindungi
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Layanan kami menerapkan langkah-langkah keamanan teknis yang ketat:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-ink-muted space-y-1.5 pl-2">
              <li>
                <strong>Isolasi Multi-Tenant:</strong> Setiap ruang keuangan (workspace) memiliki batas isolasi data di tingkat query database. Pengguna lain tidak memiliki izin untuk melihat, mengubah, atau menduplikasi catatan Anda.
              </li>
              <li>
                <strong>Koneksi Terenkripsi (HTTPS / TLS):</strong> Seluruh pertukaran data antara browser Anda dan server kami dienkripsi menggunakan protokol HTTPS modern.
              </li>
              <li>
                <strong>Sesi Aman (httpOnly Cookies):</strong> Token autentikasi disimpan dalam cookie dengan atribut <code>httpOnly</code>, <code>SameSite</code>, dan <code>Secure</code> untuk melindungi Anda dari serangan XSS (Cross-Site Scripting).
              </li>
              <li>
                <strong>Prinsip Soft Delete &amp; Audit Log:</strong> Transaksi yang dihapus diberi tanda <code>deleted_at</code> dan setiap perubahan tercatat pada audit trail permanen untuk menjamin transparansi internal berdua.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Eye className="w-5 h-5 text-rausch" />
              4. Larangan Penjualan Data &amp; Bebas Iklan Pelacak
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Kami <strong>tidak pernah menjual, menyewakan, atau membagikan</strong> data keuangan pribadi maupun catatan pengeluaran Anda kepada perusahaan periklanan, broker data, atau pihak ketiga mana pun untuk tujuan pemasaran. Kami tidak memasang pelacak iklan invasif pihak ketiga di dalam aplikasi.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">5. Hak Pengguna atas Data</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Anda berhak mengakses, memperbaiki, dan memperbarui informasi akun Anda kapan saja melalui antarmuka aplikasi. Jika Anda memutuskan untuk berhenti menggunakan layanan, Anda dapat meminta penghapusan akun beserta riwayat ruang keuangan Anda melalui tim pengembang kami.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">6. Hubungi Kami</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Jika Anda memiliki pertanyaan seputar Kebijakan Privasi ini atau pengelolaan data di Cash-book.my.id, silakan hubungi kami melalui surel resmi pengembang di:{" "}
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

