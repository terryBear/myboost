import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BackupDetails from "./pages/BackupDetails";
import Dashboard from "./pages/Dashboard";
import DeviceDetails from "./pages/DeviceDetails";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NetworkDetails from "./pages/NetworkDetails";
import NotFound from "./pages/NotFound";
import PatchingDetails from "./pages/PatchingDetails";
import SecurityDetails from "./pages/SecurityDetails";
import TicketingDetails from "./pages/TicketingDetails";

const queryClient = new QueryClient();

const CoffeeApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/coffee" element={<Index />} />
          <Route path="/coffee/login" element={<Login />} />
          <Route path="/coffee/dashboard" element={<Dashboard />} />
          <Route path="/coffee/security" element={<SecurityDetails />} />
          <Route path="/coffee/backup" element={<BackupDetails />} />
          <Route path="/coffee/network" element={<NetworkDetails />} />
          <Route path="/coffee/devices" element={<DeviceDetails />} />
          <Route path="/coffee/tickets" element={<TicketingDetails />} />
          <Route path="/coffee/patching" element={<PatchingDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="coffee/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default CoffeeApp;
