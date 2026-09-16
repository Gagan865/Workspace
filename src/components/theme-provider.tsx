import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const ACCENTS = [
  { id: "cobalt", label: "Cobalt", swatch: "oklch(0.52 0.2 262)" },
  { id: "teal", label: "Teal", swatch: "oklch(0.55 0.12 190)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.68 0.16 68)" },
  { id: "coral", label: "Coral", swatch: "oklch(0.62 0.19 22)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.52 0.2 300)" },
  { id: "lime", label: "Lime", swatch: "oklch(0.6 0.16 140)" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type Mode = "light" | "dark";

type ThemeValue = {
  mode: Mode;
  accent: AccentId;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  setAccent: (accent: AccentId) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

const MODE_KEY = "workspace.mode";
const ACCENT_KEY = "workspace.accent";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [accent, setAccentState] = useState<AccentId>("cobalt");

  useEffect(() => {
    const storedMode = localStorage.getItem(MODE_KEY);
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    if (storedMode === "light" || storedMode === "dark") setModeState(storedMode);
    if (ACCENTS.some((a) => a.id === storedAccent)) setAccentState(storedAccent as AccentId);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.dataset["accent"] = accent;
  }, [mode, accent]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    localStorage.setItem(MODE_KEY, next);
  }, []);

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next);
    localStorage.setItem(ACCENT_KEY, next);
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      accent,
      setMode,
      setAccent,
      toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode, accent, setMode, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
