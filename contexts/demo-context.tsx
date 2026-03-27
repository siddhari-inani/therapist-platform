"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "revora_demo_mode";

interface DemoContextValue {
  isDemo: boolean;
  setDemoMode: (on: boolean) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function getStoredDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemoState] = useState(getStoredDemoMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setDemoMode = useCallback((on: boolean) => {
    setIsDemoState(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "true" : "false");
      if (on) {
        window.dispatchEvent(new CustomEvent("revora-demo-on"));
      } else {
        window.dispatchEvent(new CustomEvent("revora-demo-off"));
      }
    } catch {
      // ignore
    }
  }, []);

  const value: DemoContextValue = {
    isDemo: mounted ? isDemo : false,
    setDemoMode,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoMode(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    return {
      isDemo: false,
      setDemoMode: () => {},
    };
  }
  return ctx;
}
