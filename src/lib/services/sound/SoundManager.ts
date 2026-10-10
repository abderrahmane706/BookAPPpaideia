/**
 * SoundManager — centralised interface-sound controller for PAIDEIA.
 *
 * Design principles:
 *  - No component ever touches <audio> or AudioContext directly.
 *  - Optional local assets (public/audio/ui/*.mp3) are preferred when present;
 *    a Web Audio API synthesis fallback plays if the asset is missing or fails.
 *  - Autoplay policy is respected: nothing plays before the first user gesture.
 *  - Interface sound is OFF by default and only plays once the user enables it.
 *  - The user's preference persists in localStorage.
 *  - Methods are fire-and-forget; errors never propagate to callers.
 */

export type SoundName =
  | "click"
  | "navigation"
  | "chapter-transition"
  | "toggle"
  | "save";

interface SoundConfig {
  /** Relative path under /public. Optional — falls back to synthesis. */
  asset: string;
  /** Web-Audio synthesis parameters (used when asset unavailable). */
  synth: SynthParams;
}

interface SynthParams {
  /** Carrier frequency in Hz. */
  freq: number;
  /** Optional second frequency for a two-tone effect. */
  freq2?: number;
  /** Duration in seconds. */
  duration: number;
  /** Peak gain 0–1 (kept low — UI sounds must be quiet). */
  gain: number;
  /** Waveform shape. */
  type?: OscillatorType;
  /** Optional bandpass center for filtered noise (paper sounds). */
  filterFreq?: number;
}

const SOUNDS: Record<SoundName, SoundConfig> = {
  click: {
    asset: "/audio/ui/click-soft.mp3",
    synth: { freq: 1200, duration: 0.045, gain: 0.06, type: "sine" },
  },
  navigation: {
    asset: "/audio/ui/navigation-soft.mp3",
    synth: { freq: 800, freq2: 1100, duration: 0.09, gain: 0.05, type: "sine" },
  },
  "chapter-transition": {
    asset: "/audio/ui/paper-flip.mp3",
    synth: {
      freq: 440,
      duration: 0.22,
      gain: 0.07,
      type: "triangle",
      filterFreq: 2400,
    },
  },
  toggle: {
    asset: "/audio/ui/toggle-soft.mp3",
    synth: { freq: 700, freq2: 950, duration: 0.07, gain: 0.05, type: "sine" },
  },
  save: {
    asset: "/audio/ui/save-soft.mp3",
    synth: { freq: 620, freq2: 880, duration: 0.12, gain: 0.055, type: "sine" },
  },
};

const STORAGE_KEY = "paideia-sound-enabled";

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = false;
  private unlocked = false;
  private assetCache = new Map<string, HTMLAudioElement | null>();
  private assetChecked = new Map<string, boolean>();
  private listeners = new Set<() => void>();

  constructor() {
    // Restore persisted preference (browser-safe). Default OFF: interface
    // sound only plays once the user explicitly enables it.
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        this.enabled = stored === "true";
      } catch {
        /* private browsing — keep default */
      }
      // Unlock AudioContext on first user gesture (autoplay policy).
      const unlock = () => {
        this.unlocked = true;
        this.ensureContext();
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }

  /** Whether sound is currently enabled. */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Subscribe to enabled-state changes (for useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /** Remove a previously registered listener. */
  unsubscribe(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /** Toggle sound on/off and persist the choice. */
  setEnabled(value: boolean): void {
    this.enabled = value;
    this.notify();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(value));
      } catch {
        /* ignore */
      }
    }
    // Fade master gain rather than hard-cutting.
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(value ? 1 : 0, now + 0.08);
    }
  }

  // ---- Public play methods -------------------------------------------

  playClick(): void {
    this.play("click");
  }

  playNavigation(): void {
    this.play("navigation");
  }

  playChapterTransition(): void {
    this.play("chapter-transition");
  }

  playToggle(): void {
    this.play("toggle");
  }

  // ---- Semantic feedback (reuse the centralised sounds above) ---------

  /** Opening a book / entering a workspace. */
  playOpen(): void {
    this.play("navigation");
  }

  /** A save succeeded (summary, note, review, progress). */
  playSave(): void {
    this.play("save");
  }

  /** A create action (new note, new quotation, new session). */
  playCreate(): void {
    this.play("click");
  }

  /** A destructive action was confirmed (delete). */
  playDelete(): void {
    this.play("toggle");
  }

  // ---- Internals -----------------------------------------------------

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.ctx = new Ctx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.enabled ? 1 : 0;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    // Resume if suspended (autoplay policy).
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private play(name: SoundName): void {
    if (!this.enabled || !this.unlocked) return;

    const config = SOUNDS[name];
    if (!config) return;

    // Prefer the real asset when available and already confirmed present.
    const cached = this.assetCache.get(config.asset);
    if (cached === null) {
      // Asset confirmed missing — synthesize.
      this.synthesize(config.synth);
      return;
    }
    if (cached) {
      this.playElement(cached);
      return;
    }

    // First encounter: probe the asset.
    this.probeAsset(config.asset)
      .then((el) => {
        this.assetCache.set(config.asset, el);
        if (el) {
          this.playElement(el);
        } else {
          this.synthesize(config.synth);
        }
      })
      .catch(() => {
        this.assetCache.set(config.asset, null);
        this.synthesize(config.synth);
      });
  }

  /** Probe an audio asset; resolve with an element or null if unavailable. */
  private probeAsset(src: string): Promise<HTMLAudioElement | null> {
    if (this.assetChecked.has(src)) {
      return Promise.resolve(this.assetCache.get(src) ?? null);
    }
    this.assetChecked.set(src, true);

    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "auto";
      const done = (ok: boolean) => {
        audio.removeEventListener("canplaythrough", onOk);
        audio.removeEventListener("error", onErr);
        resolve(ok ? audio : null);
      };
      const onOk = () => done(true);
      const onErr = () => done(false);
      audio.addEventListener("canplaythrough", onOk, { once: true });
      audio.addEventListener("error", onErr, { once: true });
      audio.src = src;
      // Timeout — don't hang forever.
      setTimeout(() => done(audio.readyState >= 3), 2500);
    });
  }

  private playElement(el: HTMLAudioElement): void {
    try {
      el.currentTime = 0;
      const p = el.play();
      if (p) p.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  /** Web Audio fallback — a quiet, short synthesized tone. */
  private synthesize(params: SynthParams): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const { freq, freq2, duration, gain, type = "sine", filterFreq } = params;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freq2) {
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq2, now + duration * 0.6);
    }

    // Envelope: quick attack, gentle decay — no click artifact.
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    let tail: AudioNode = osc;
    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.8;
      osc.connect(filter);
      tail = filter;
    }

    tail.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

/** Singleton — one SoundManager per app. */
export const SoundManager = new SoundManagerImpl();
