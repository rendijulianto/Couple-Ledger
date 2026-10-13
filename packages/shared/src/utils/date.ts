/**
 * Format a Date object to Indonesian date format in Asia/Jakarta timezone.
 * e.g., "12 Oktober 2026, 14:30 WIB"
 */
export function formatJakartaDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Format a Date object to YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function formatJakartaDateISO(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Intl format to parts to ensure Asia/Jakarta timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

/**
 * Given a YYYY-MM string, returns the start date (YYYY-MM-01) and end date (YYYY-MM-LD)
 * for high-performance B-Tree index range queries.
 */
export function getMonthDateRange(yearMonth: string): {
  startDate: string;
  endDate: string;
} {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}


