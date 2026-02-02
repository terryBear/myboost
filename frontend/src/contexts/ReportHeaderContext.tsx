import React, { createContext, useCallback, useContext, useState } from "react";

type SetHeaderRight = (node: React.ReactNode) => void;

const ReportHeaderContext = createContext<{
  headerRight: React.ReactNode;
  setHeaderRight: SetHeaderRight;
} | null>(null);

export function ReportHeaderProvider({ children }: { children: React.ReactNode }) {
  const [headerRight, setHeaderRightState] = useState<React.ReactNode>(null);
  const setHeaderRight = useCallback<SetHeaderRight>((node) => {
    setHeaderRightState(() => node);
  }, []);
  return (
    <ReportHeaderContext.Provider value={{ headerRight, setHeaderRight }}>
      {children}
    </ReportHeaderContext.Provider>
  );
}

export function useReportHeader() {
  const ctx = useContext(ReportHeaderContext);
  return ctx ?? { headerRight: null, setHeaderRight: () => {} };
}
