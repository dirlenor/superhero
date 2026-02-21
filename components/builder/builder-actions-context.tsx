"use client";

import { createContext, useContext } from "react";

interface BuilderActionsContextValue {
  runNode: (nodeId: string) => void;
}

const BuilderActionsContext = createContext<BuilderActionsContextValue | null>(null);

export function BuilderActionsProvider({
  value,
  children,
}: {
  value: BuilderActionsContextValue;
  children: React.ReactNode;
}) {
  return (
    <BuilderActionsContext.Provider value={value}>
      {children}
    </BuilderActionsContext.Provider>
  );
}

export function useBuilderActions() {
  const context = useContext(BuilderActionsContext);

  if (!context) {
    throw new Error("useBuilderActions must be used inside BuilderActionsProvider");
  }

  return context;
}
