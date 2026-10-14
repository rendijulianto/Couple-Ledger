import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  hex: string;
  rgb: string;
  activeHex: string;
  activeRgb: string;
  disabledHex: string;
  disabledRgb: string;
}

export const THEME_PRESETS: ThemeOption[] = [
  {
    id: "rausch",
    name: "Rausch Koral",
    description: "Merah koral khas Airbnb, energik & ikonik",
    hex: "#ff385c",
    rgb: "255 56 92",
    activeHex: "#e00b41",
    activeRgb: "224 11 65",
    disabledHex: "#ffd1da",
    disabledRgb: "255 209 218",
  },
  {
    id: "rose",
    name: "Rose Pink",
    description: "Merah muda manis, lembut & romantis",
    hex: "#ec4899",
    rgb: "236 72 153",
    activeHex: "#db2777",
    activeRgb: "219 39 119",
    disabledHex: "#fbcfe8",
    disabledRgb: "251 207 232",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    description: "Hijau zamrud, sejuk & finansial sejahtera",
    hex: "#10b981",
    rgb: "16 185 129",
    activeHex: "#059669",
    activeRgb: "5 150 105",
    disabledHex: "#a7f3d0",
    disabledRgb: "167 243 208",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Biru samudra jernih, tenang & terpercaya",
    hex: "#0284c7",
    rgb: "2 132 199",
    activeHex: "#0369a1",
    activeRgb: "3 105 161",
    disabledHex: "#bae6fd",
    disabledRgb: "186 230 253",
  },
  {
    id: "violet",
    name: "Royal Violet",
    description: "Ungu anggun sub-brand Luxe, elegan & mewah",
    hex: "#8b5cf6",
    rgb: "139 92 246",
    activeHex: "#7c3aed",
    activeRgb: "124 58 237",
    disabledHex: "#ddd6fe",
    disabledRgb: "221 214 254",
  },
  {
    id: "amber",
    name: "Sunset Amber",
    description: "Jingga matahari terbit, hangat & optimis",
    hex: "#f59e0b",
    rgb: "245 158 11",
    activeHex: "#d97706",
    activeRgb: "217 119 6",
    disabledHex: "#fde68a",
    disabledRgb: "253 230 138",
  },
  {
    id: "slate",
    name: "Midnight Slate",
    description: "Abu monokrom modern, tegas & minimalis",
    hex: "#334155",
    rgb: "51 65 85",
    activeHex: "#1e293b",
    activeRgb: "30 41 59",
    disabledHex: "#cbd5e1",
    disabledRgb: "203 213 225",
  },
];

const STORAGE_KEY = "couple_ledger_theme";

interface ThemeContextType {
  currentTheme: ThemeOption;
  setThemeId: (id: string) => Promise<void>;
  availableThemes: ThemeOption[];
  isSyncingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeToDom = (theme: ThemeOption) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.rgb);
  root.style.setProperty("--color-primary-active", theme.activeRgb);
  root.style.setProperty("--color-primary-disabled", theme.disabledRgb);
  root.style.setProperty("--color-primary-hex", theme.hex);

  if (document.body) {
    document.body.style.setProperty("--color-primary", theme.rgb);
    document.body.style.setProperty("--color-primary-active", theme.activeRgb);
    document.body.style.setProperty("--color-primary-disabled", theme.disabledRgb);
    document.body.style.setProperty("--color-primary-hex", theme.hex);
  }
};

// Segera terapkan tema tersimpan saat script di-parse agar tidak ada delay / blank color
try {
  if (typeof localStorage !== "undefined" && typeof document !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = THEME_PRESETS.find((t) => t.id === saved) || THEME_PRESETS[0]!;
    applyThemeToDom(initial);
  }
} catch {
  // ignore
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  let activeWorkspace: { id: string; theme?: string } | null = null;
  let refreshAuth: () => Promise<void> = async () => {};

  try {
    const auth = useAuth();
    activeWorkspace = auth.activeWorkspace;
    refreshAuth = auth.refreshAuth;
  } catch {
    // ThemeProvider used outside AuthProvider fallback
  }

  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEME_PRESETS.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // localStorage error fallback
    }
    return "rausch";
  });

  const [isSyncingTheme, setIsSyncingTheme] = useState(false);

  // Sinkronkan tema otomatis ketika data ruang aktif diperbarui (misal pasangan baru saja mengubah tema)
  useEffect(() => {
    if (
      activeWorkspace?.theme &&
      THEME_PRESETS.some((t) => t.id === activeWorkspace.theme) &&
      activeWorkspace.theme !== themeId
    ) {
      setThemeIdState(activeWorkspace.theme);
    }
  }, [activeWorkspace?.theme]);

  const currentTheme =
    THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[0]!;

  useEffect(() => {
    applyThemeToDom(currentTheme);
    try {
      localStorage.setItem(STORAGE_KEY, currentTheme.id);
    } catch {
      // ignore storage error
    }
  }, [currentTheme]);

  const setThemeId = async (newId: string) => {
    if (!THEME_PRESETS.some((t) => t.id === newId)) return;

    // Terapkan langsung ke UI agar pengguna merasakan respons instan
    setThemeIdState(newId);

    // Sinkronkan ke database ruang bersama agar pasangan ikut berubah
    if (activeWorkspace?.id) {
      setIsSyncingTheme(true);
      try {
        await api.workspaces({ id: activeWorkspace.id }).theme.patch({
          theme: newId,
        });
        await refreshAuth();
      } catch {
        // Fallback anggun jika server offline/error
      } finally {
        setIsSyncingTheme(false);
      }
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setThemeId,
        availableThemes: THEME_PRESETS,
        isSyncingTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

