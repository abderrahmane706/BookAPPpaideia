/**
 * ThemeManager — the single source of truth for PAIDEIA's light/night theme.
 *
 * Design principles:
 *  - Exactly one centralised place mutates the theme attribute on <html>
 *    (`data-theme="dark"`), so no component scatters hardcoded dark styles.
 *  - The initial value is resolved *before first paint* by an inline script in
 *    the root layout; this manager only reads that resolved value and updates
 *    it. That keeps persistence, reload and no-flash/no-hydration-mismatch
 *    behaviour consistent.
 *  - The listener API mirrors SoundManager so the UI can consume it with
 *    `useSyncExternalStore` and avoid hydration mismatches.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "paideia-theme";

class ThemeManagerImpl {
  private theme: Theme = "light";
  private listeners = new Set<() => void>();

  constructor() {
    // Adopt whatever the pre-paint script resolved (browser only).
    if (typeof document !== "undefined") {
      this.theme =
        document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }
  }

  /** The currently active theme. */
  get value(): Theme {
    return this.theme;
  }

  /** Subscribe to theme changes (for useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /** Apply and persist a theme. */
  set(theme: Theme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.apply();
    this.persist(theme);
    this.notify();
  }

  /** Flip between light and night. */
  toggle(): void {
    this.set(this.theme === "dark" ? "light" : "dark");
  }

  private apply(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = this.theme;
    root.style.colorScheme = this.theme;
  }

  private persist(theme: Theme): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* private browsing — keep the in-memory value */
    }
  }
}

/** Singleton — one ThemeManager per app. */
export const ThemeManager = new ThemeManagerImpl();
