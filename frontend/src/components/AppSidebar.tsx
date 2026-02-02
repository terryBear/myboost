import {
  Download,
  HardDrive,
  Home,
  LayoutDashboard,
  LogOut,
  Monitor,
  Network,
  Shield,
  Ticket,
} from "lucide-react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useReportSidebarActions } from "@/contexts/ReportSidebarActionsContext";
import { clearTokens } from "@/services/api";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const COFFEE_NAV_ITEMS: NavItem[] = [
  { to: "/coffee", label: "Home", icon: Home },
  { to: "/coffee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coffee/security", label: "Security", icon: Shield },
  { to: "/coffee/patching", label: "Patching", icon: Download },
  { to: "/coffee/devices", label: "Devices", icon: Monitor },
  { to: "/coffee/backup", label: "Backup", icon: HardDrive },
  { to: "/coffee/network", label: "Network", icon: Network },
  { to: "/coffee/tickets", label: "Tickets", icon: Ticket },
];

const BOOSTCOFFEE_NAV_ITEMS: NavItem[] = [
  { to: "/boostcoffee", label: "Home", icon: Home },
  { to: "/boostcoffee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/boostcoffee/security", label: "Security", icon: Shield },
  { to: "/boostcoffee/patching", label: "Patching", icon: Download },
  { to: "/boostcoffee/devices", label: "Devices", icon: Monitor },
  { to: "/boostcoffee/backup", label: "Backup", icon: HardDrive },
  { to: "/boostcoffee/network", label: "Network", icon: Network },
  { to: "/boostcoffee/tickets", label: "Tickets", icon: Ticket },
];

function getNavItems(basePath: string): NavItem[] {
  return basePath === "/coffee" ? COFFEE_NAV_ITEMS : BOOSTCOFFEE_NAV_ITEMS;
}

export function AppSidebar({ basePath }: { basePath: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const items = getNavItems(basePath);
  const { sidebarActions } = useReportSidebarActions();
  const customerName = searchParams.get("customerName") || "";

  const toWithCustomer = (path: string) =>
    customerName ? `${path}?customerName=${encodeURIComponent(customerName)}` : path;

  const handleDefaultLogout = () => {
    clearTokens();
    navigate(`${basePath}/login`);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-2 border-b border-sidebar-border">
        <SidebarTrigger className="-ml-1" />
        <span className="text-xs text-muted-foreground truncate group-data-[collapsible=icon]:hidden">
          Menu
        </span>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const to = toWithCustomer(item.to);
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== basePath && location.pathname.startsWith(item.to));
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <NavLink to={to}>
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1 px-2">
              {sidebarActions ?? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDefaultLogout}
                >
                  <LogOut className="size-4 shrink-0" />
                  <span>Logout</span>
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
