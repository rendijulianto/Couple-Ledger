/**
 * Format integer amount in Rupiah (IDR) without decimal cents.
 * e.g., 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

