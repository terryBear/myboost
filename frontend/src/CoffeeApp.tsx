import { ReportLayout } from "@/components/ReportLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
const COFFEE_LOGIN = "/coffee/login";

const CoffeeApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path={COFFEE_LOGIN} element={<Login />} />
          <Route path="/coffee/s/:token" element={<Dashboard />} />
          <Route path="/coffee/s/:token/" element={<Dashboard />} />
          <Route path="/coffee" element={<ReportLayout basePath="/coffee" />}>
            <Route index element={<Navigate to="/coffee/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="security"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <SecurityDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="backup"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <BackupDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="network"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <NetworkDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="devices"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <DeviceDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <TicketingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="patching"
              element={
                <ProtectedRoute loginPath={COFFEE_LOGIN}>
                  <PatchingDetails />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default CoffeeApp;
