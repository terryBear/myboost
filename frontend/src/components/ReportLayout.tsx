import { useState } from "react";
import { Outlet } from "react-router-dom";

import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ContactFaultSheet } from "@/components/ContactFaultSheet";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { CustomerFilterProvider } from "@/contexts/CustomerFilterContext";
import { ReportHeaderProvider } from "@/contexts/ReportHeaderContext";
import { ReportSidebarActionsProvider } from "@/contexts/ReportSidebarActionsContext";

export function ReportLayout({ basePath }: { basePath: string }) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <ReportHeaderProvider>
      <CustomerFilterProvider>
        <ReportSidebarActionsProvider>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <AppSidebar basePath={basePath} />
          </Sidebar>
        <SidebarInset>
          <AppHeader
            basePath={basePath}
            onContactClick={() => setContactOpen(true)}
          />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
        </SidebarProvider>
        </ReportSidebarActionsProvider>
      </CustomerFilterProvider>
      <ContactFaultSheet open={contactOpen} onOpenChange={setContactOpen} />
    </ReportHeaderProvider>
  );
}
