"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import type { SaveStatus } from "@/hooks/use-autosave";

interface SaveContextType {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
  onSave: (() => void) | null;
  registerSaveHandler: (fn: () => void) => void;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveFnRef = useRef<(() => void) | null>(null);

  const registerSaveHandler = useCallback((fn: () => void) => {
    saveFnRef.current = fn;
  }, []);

  const onSave = useCallback(() => {
    saveFnRef.current?.();
  }, []);

  return (
    <SaveContext.Provider value={{ status, setStatus, onSave, registerSaveHandler }}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSaveStatus() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error("useSaveStatus must be used within a SaveProvider");
  }
  return context;
}
