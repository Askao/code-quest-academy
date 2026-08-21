const STORAGE_KEY = "hcode-theme";

export type Theme = "dark" | "light";

/** Dark is the brand default - :root's own values are already dark, so no
 * class is needed for that case, only .light needs applying/removing. */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private browsing etc.) - theme just won't persist
  }
}
