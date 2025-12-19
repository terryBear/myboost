import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BackupDetails from "./pages/ClientReporting/BackupDetails";
import Dashboard from "./pages/ClientReporting/Dashboard";
import DeviceDetails from "./pages/ClientReporting/DeviceDetails";
import Index from "./pages/ClientReporting/Index";
import Login from "./pages/ClientReporting/Login";
import NetworkDetails from "./pages/ClientReporting/NetworkDetails";
import NotFound from "./pages/ClientReporting/NotFound";
import PatchingDetails from "./pages/ClientReporting/PatchingDetails";
import SecurityDetails from "./pages/ClientReporting/SecurityDetails";
import TicketingDetails from "./pages/ClientReporting/TicketingDetails";

const queryClient = new QueryClient();

const ClientApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/boostcoffee" element={<Index />} />
          <Route path="/boostcoffee/login" element={<Login />} />
          <Route path="/boostcoffee/dashboard" element={<Dashboard />} />
          <Route path="/boostcoffee/security" element={<SecurityDetails />} />
          <Route path="/boostcoffee/backup" element={<BackupDetails />} />
          <Route path="/boostcoffee/network" element={<NetworkDetails />} />
          <Route path="/boostcoffee/devices" element={<DeviceDetails />} />
          <Route path="/boostcoffee/tickets" element={<TicketingDetails />} />
          <Route path="/boostcoffee/patching" element={<PatchingDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/boostcoffee/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default ClientApp;
