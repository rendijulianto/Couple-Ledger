import { treaty } from "@elysiajs/eden";
import type { App } from "api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = treaty<App>(API_URL, {
  parseDate: false,
  fetch: {
    credentials: "include",
  },
  headers: () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("couple_ledger_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
