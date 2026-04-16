"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  createContext,
  useContext,
} from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** Seconds between polls */
  interval: number;
  setInterval: (v: number) => void;
}

const AutoRefreshContext = createContext<AutoRefreshContextValue>({
  enabled: false,
  setEnabled: () => {},
  interval: 5,
  setInterval: () => {},
});

export function useAutoRefresh() {
  return useContext(AutoRefreshContext);
}

const STORAGE_KEY = "cc-dash-auto-refresh";
const INTERVAL_KEY = "cc-dash-auto-refresh-interval";

/**
 * Provider that polls /api/watch for file changes and triggers
 * router.refresh() when the fingerprint changes.
 *
 * State is persisted to localStorage so it survives page navigations.
 */
export function AutoRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [enabled, setEnabledState] = useState(false);
  const [intervalSec, setIntervalState] = useState(5);
  const lastFingerprint = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null,
  );

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setEnabledState(true);
      const storedInterval = localStorage.getItem(INTERVAL_KEY);
      if (storedInterval) {
        const parsed = parseInt(storedInterval, 10);
        if (parsed >= 2 && parsed <= 60) setIntervalState(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // ignore
    }
  }, []);

  const setInterval = useCallback((v: number) => {
    const clamped = Math.max(2, Math.min(60, v));
    setIntervalState(clamped);
    try {
      localStorage.setItem(INTERVAL_KEY, String(clamped));
    } catch {
      // ignore
    }
  }, []);

  // Polling loop
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/watch", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const fp = data.fingerprint as string;
          if (
            lastFingerprint.current !== null &&
            lastFingerprint.current !== fp
          ) {
            router.refresh();
          }
          lastFingerprint.current = fp;
        }
      } catch {
        // network error — skip this tick
      }
      if (!cancelled) {
        timerRef.current = globalThis.setTimeout(poll, intervalSec * 1000);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, intervalSec, router]);

  return (
    <AutoRefreshContext.Provider
      value={{ enabled, setEnabled, interval: intervalSec, setInterval }}
    >
      {children}
    </AutoRefreshContext.Provider>
  );
}
