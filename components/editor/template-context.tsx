"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface TemplateContextValue {
  isTemplatesOpen: boolean;
  openTemplates: () => void;
  closeTemplates: () => void;
}

const TemplateContext = createContext<TemplateContextValue>({
  isTemplatesOpen: false,
  openTemplates: () => {},
  closeTemplates: () => {},
});

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  return (
    <TemplateContext.Provider
      value={{
        isTemplatesOpen,
        openTemplates: () => setIsTemplatesOpen(true),
        closeTemplates: () => setIsTemplatesOpen(false),
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplateModal() {
  return useContext(TemplateContext);
}
