"use client";

import { deleteAvatarBlob, getAvatarBlob, saveAvatarBlob } from "./avatar";

interface AvatarState {
  url: string | null;
  ready: boolean;
}

/**
 * A tiny external store for the current avatar's object URL.
 *
 * Keeps a single live `blob:` URL shared by the header and the profile page,
 * and guarantees the previous URL is revoked whenever it changes so we never
 * leak object URLs. It degrades to a `null` URL when IndexedDB is unavailable.
 */
class AvatarStore {
  private state: AvatarState = { url: null, ready: false };
  private listeners = new Set<() => void>();
  private started = false;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    this.ensureStarted();
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): AvatarState => this.state;

  getServerSnapshot = (): AvatarState => ({ url: null, ready: false });

  isReady = (): boolean => this.state.ready;

  private ensureStarted(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    void this.refresh();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private setUrl(url: string | null): void {
    const previous = this.state.url;
    if (previous && previous !== url) URL.revokeObjectURL(previous);
    this.state = { url, ready: true };
    this.emit();
  }

  /** Re-read the stored blob and publish a fresh object URL. */
  async refresh(): Promise<void> {
    const blob = await getAvatarBlob();
    if (!blob) {
      this.setUrl(null);
      return;
    }
    this.setUrl(URL.createObjectURL(blob));
  }

  /** Persist a new avatar blob, then surface it. Returns success. */
  async save(blob: Blob): Promise<boolean> {
    const stored = await saveAvatarBlob(blob);
    await this.refresh();
    return stored;
  }

  /** Remove the stored avatar blob. */
  async clear(): Promise<void> {
    await deleteAvatarBlob();
    this.setUrl(null);
  }
}

/** Singleton avatar store. */
export const avatar = new AvatarStore();
