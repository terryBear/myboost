import { ReportLayout } from "@/components/ReportLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BackupDetails from "./pages/ClientReporting/BackupDetails";
import Dashboard from "./pages/ClientReporting/Dashboard";
import DeviceDetails from "./pages/ClientReporting/DeviceDetails";
import Login from "./pages/ClientReporting/Login";
import NetworkDetails from "./pages/ClientReporting/NetworkDetails";
import NotFound from "./pages/ClientReporting/NotFound";
import PatchingDetails from "./pages/ClientReporting/PatchingDetails";
import SecurityDetails from "./pages/ClientReporting/SecurityDetails";
import TicketingDetails from "./pages/ClientReporting/TicketingDetails";

const queryClient = new QueryClient();
const BOOSTCOFFEE_LOGIN = "/boostcoffee/login";

const ClientApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path={BOOSTCOFFEE_LOGIN} element={<Login />} />
          <Route path="/boostcoffee" element={<ReportLayout basePath="/boostcoffee" />}>
            <Route index element={<Navigate to="/boostcoffee/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="security"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <SecurityDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="backup"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <BackupDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="network"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <NetworkDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="devices"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <DeviceDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
                  <TicketingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="patching"
              element={
                <ProtectedRoute loginPath={BOOSTCOFFEE_LOGIN}>
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

export default ClientApp;
