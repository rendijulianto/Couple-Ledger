import { treaty } from "@elysiajs/eden";
import type { App } from "api";

export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD && typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

export const api = treaty<App>(getBaseUrl(), {
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
