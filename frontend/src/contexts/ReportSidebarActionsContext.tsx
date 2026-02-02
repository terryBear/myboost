import React, { createContext, useCallback, useContext, useState } from "react";

type SetSidebarActions = (node: React.ReactNode) => void;

const ReportSidebarActionsContext = createContext<{
  sidebarActions: React.ReactNode;
  setSidebarActions: SetSidebarActions;
} | null>(null);

export function ReportSidebarActionsProvider({ children }: { children: React.ReactNode }) {
  const [sidebarActions, setSidebarActionsState] = useState<React.ReactNode>(null);
  const setSidebarActions = useCallback<SetSidebarActions>((node) => {
    setSidebarActionsState(() => node);
  }, []);
  return (
    <ReportSidebarActionsContext.Provider value={{ sidebarActions, setSidebarActions }}>
      {children}
    </ReportSidebarActionsContext.Provider>
  );
}

export function useReportSidebarActions() {
  const ctx = useContext(ReportSidebarActionsContext);
  return ctx ?? { sidebarActions: null, setSidebarActions: () => {} };
}
