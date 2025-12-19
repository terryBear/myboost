import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  Monitor,
  RefreshCw,
  Server,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface PatchData {
  id: number;
  device: string;
  client: string;
  site: string;
  patch: string;
  status:
    | "Installed"
    | "Pending"
    | "Failed"
    | "Not Applicable"
    | "Installing"
    | "Reboot Required";
  discovered_install_date: string;
  created_at: string;
}

interface DevicePatchStatus {
  deviceId: string;
  deviceName: string;
  os: string;
  totalPatches: number;
  installedPatches: number;
  pendingPatches: number;
  failedPatches: number;
  compliancePercentage: number;
  lastScan: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
}

const PatchingDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patchData, setPatchData] = useState<PatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [coffeeReportCompliance, setCoffeeReportCompliance] = useState<
    number | null
  >(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const nameFromQuery = searchParams.get("customerName") || "";
    if (!role) {
      navigate("/coffee/login");
      return;
    }
    setUserRole(role);
    setSelectedCustomer(nameFromQuery);
    fetchPatchData(nameFromQuery);
  }, [navigate, searchParams]);

  const fetchPatchData = async (customerName: string) => {
    try {
      setLoading(true);

      console.log(
        `[PatchingDetails] Fetching data for customer: "${customerName}"`
      );

      // Normalize customer key and resolve via v_customers_norm
      const normalizeKey = (name: string) =>
        String(name || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
      let clientKey = normalizeKey(customerName);

      const { data: custRow } = await supabase
        .from("v_customers_norm")
        .select("client_key,name")
        .eq("name", customerName)
        .maybeSingle();

      if (custRow?.client_key) {
        clientKey = String(custRow.client_key).toLowerCase();
        console.log(
          `[PatchingDetails] Resolved "${customerName}" -> clientKey: "${clientKey}"`
        );
      } else {
        console.log(
          `[PatchingDetails] No match in v_customers_norm, using normalized: "${clientKey}"`
        );
      }

      // Use Coffee Report data for consistency
      const { data: coffeeReportData, error: coffeeError } = await supabase
        .from("v_coffee_report_customer_summary")
        .select("*")
        .eq("customer", customerName)
        .maybeSingle();

      if (coffeeError) {
        console.error("Error fetching coffee report data:", coffeeError);
      }

      // Fetch patch data using normalized client_key from rmm_patches table
      const { data: patchDataFromDB, error: patchError } = await supabase
        .from("patch_overview")
        .select("*")
        .order("created_at", { ascending: false });

      if (patchError) {
        console.error("Error fetching patch data:", patchError);
      }

      // Filter patches by normalized client name
      const filteredPatches = (patchDataFromDB || []).filter((patch: any) => {
        const patchClientKey = normalizeKey(patch.client || "");
        return patchClientKey === clientKey;
      }) as PatchData[];

      setPatchData(filteredPatches);

      // Store Coffee Report compliance for consistency
      if (coffeeReportData) {
        const compliance = coffeeReportData.patch_compliance_pct || 0;
        setCoffeeReportCompliance(compliance);
        localStorage.setItem("coffeeReportCompliance", compliance.toString());
      }
    } catch (error) {
      console.error("Error fetching patch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock device compliance data
  const deviceStatuses: DevicePatchStatus[] = [
    {
      deviceId: "DEV001",
      deviceName: "WS-ACME-001",
      os: "Windows 11",
      totalPatches: 25,
      installedPatches: 23,
      pendingPatches: 2,
      failedPatches: 0,
      compliancePercentage: 92,
      lastScan: "2024-01-15 08:30",
      riskLevel: "Low",
    },
    {
      deviceId: "DEV002",
      deviceName: "SRV-TECH-001",
      os: "Windows Server 2022",
      totalPatches: 18,
      installedPatches: 15,
      pendingPatches: 1,
      failedPatches: 2,
      compliancePercentage: 83,
      lastScan: "2024-01-15 09:15",
      riskLevel: "Medium",
    },
    {
      deviceId: "DEV003",
      deviceName: "WS-RETAIL-045",
      os: "Windows 10",
      totalPatches: 32,
      installedPatches: 28,
      pendingPatches: 3,
      failedPatches: 1,
      compliancePercentage: 88,
      lastScan: "2024-01-15 07:45",
      riskLevel: "Medium",
    },
    {
      deviceId: "DEV004",
      deviceName: "SRV-RETAIL-001",
      os: "Windows Server 2019",
      totalPatches: 29,
      installedPatches: 24,
      pendingPatches: 2,
      failedPatches: 3,
      compliancePercentage: 83,
      lastScan: "2024-01-15 10:20",
      riskLevel: "High",
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPatchData(selectedCustomer);
    setIsRefreshing(false);
  };

  const handleSyncPatchAPI = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        "https://xkfijttdhgkdzruygylq.supabase.co/functions/v1/sync-patch-data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        // Refresh data after sync
        await fetchPatchData(selectedCustomer);
        console.log("Patch API synced successfully");
      } else {
        console.error("Failed to sync patch API");
      }
    } catch (error) {
      console.error("Error syncing patch API:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSeverityColor = (patch: string) => {
    // Determine severity based on patch name keywords
    if (!patch) return "bg-muted text-muted-foreground";
    const patchLower = patch.toLowerCase();
    if (patchLower.includes("security") || patchLower.includes("critical")) {
      return "bg-destructive text-destructive-foreground";
    } else if (
      patchLower.includes("cumulative") ||
      patchLower.includes("update")
    ) {
      return "bg-warning text-warning-foreground";
    } else {
      return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Installed":
        return "bg-success text-success-foreground";
      case "Installing":
        return "bg-primary text-primary-foreground";
      case "Pending":
        return "bg-warning text-warning-foreground";
      case "Failed":
        return "bg-destructive text-destructive-foreground";
      case "Not Applicable":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "High":
        return "bg-destructive/80 text-destructive-foreground";
      case "Medium":
        return "bg-warning text-warning-foreground";
      case "Low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Installed":
        return <CheckCircle className="h-4 w-4" />;
      case "Installing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "Pending":
        return <Download className="h-4 w-4" />;
      case "Failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Chart data preparation
  const patchStatusData = [
    {
      name: "Installed",
      value: patchData.filter(
        (p) => p.status === "Installed" || p.status === "Installing"
      ).length,
      fill: "hsl(var(--success))",
    },
    {
      name: "Pending",
      value: patchData.filter((p) => p.status === "Pending").length,
      fill: "hsl(var(--warning))",
    },
    {
      name: "Failed",
      value: patchData.filter((p) => p.status === "Failed").length,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "Installing",
      value: patchData.filter((p) => p.status === "Installing").length,
      fill: "hsl(var(--primary))",
    },
  ];

  const severityData = [
    {
      name: "Security",
      value: patchData.filter((p) =>
        p.patch?.toLowerCase().includes("security")
      ).length,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "Critical",
      value: patchData.filter((p) =>
        p.patch?.toLowerCase().includes("critical")
      ).length,
      fill: "hsl(var(--destructive) / 0.8)",
    },
    {
      name: "Updates",
      value: patchData.filter((p) => p.patch?.toLowerCase().includes("update"))
        .length,
      fill: "hsl(var(--warning))",
    },
    {
      name: "Other",
      value: patchData.filter(
        (p) =>
          p.patch &&
          !p.patch.toLowerCase().includes("security") &&
          !p.patch.toLowerCase().includes("critical") &&
          !p.patch.toLowerCase().includes("update")
      ).length,
      fill: "hsl(var(--muted))",
    },
  ];

  const complianceData = deviceStatuses.map((device) => ({
    name: device.deviceName,
    compliance: device.compliancePercentage,
  }));

  const handleSeverityClick = (category: string) => {
    setSelectedSeverity(category);
    setShowSeverityModal(true);
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const getFilteredPatches = (category: string) => {
    const filterByCategory = (patches: PatchData[]) => {
      switch (category) {
        case "Security":
          return patches.filter((p) =>
            p.patch?.toLowerCase().includes("security")
          );
        case "Critical":
          return patches.filter((p) =>
            p.patch?.toLowerCase().includes("critical")
          );
        case "Updates":
          return patches.filter((p) =>
            p.patch?.toLowerCase().includes("update")
          );
        case "Other":
          return patches.filter(
            (p) =>
              p.patch &&
              !p.patch.toLowerCase().includes("security") &&
              !p.patch.toLowerCase().includes("critical") &&
              !p.patch.toLowerCase().includes("update")
          );
        default:
          return [];
      }
    };

    // First filter by category, then only show non-installed patches
    const categoryPatches = filterByCategory(patchData);
    return categoryPatches.filter((p) => p.status !== "Installed");
  };

  const getFilteredPatchesByStatus = (status: string) => {
    if (status === "Installed") {
      // Include Installing and Reboot Required as "Installed" for consistency
      return patchData.filter((p) => {
        const pStatus = (p.status || "").toLowerCase();
        return (
          pStatus === "installed" ||
          pStatus === "installing" ||
          pStatus === "reboot required"
        );
      });
    }
    return patchData.filter((p) => p.status === status);
  };

  // Calculate top 10 devices with most outstanding patches
  const getTopDevicesWithOutstandingPatches = () => {
    const devicePatchCount = patchData.reduce((acc, patch) => {
      if (patch.status !== "Installed") {
        if (!acc[patch.device]) {
          acc[patch.device] = {
            deviceName: patch.device,
            site: patch.site,
            pendingCount: 0,
            failedCount: 0,
            installingCount: 0,
            rebootRequiredCount: 0,
            totalOutstanding: 0,
          };
        }

        switch (patch.status) {
          case "Pending":
            acc[patch.device].pendingCount++;
            break;
          case "Failed":
            acc[patch.device].failedCount++;
            break;
          case "Installing":
            acc[patch.device].installingCount++;
            break;
          case "Reboot Required":
            acc[patch.device].rebootRequiredCount++;
            break;
        }
        acc[patch.device].totalOutstanding++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(devicePatchCount)
      .sort((a: any, b: any) => b.totalOutstanding - a.totalOutstanding)
      .slice(0, 10);
  };

  const topDevices = getTopDevicesWithOutstandingPatches();

  const installedPatches = patchData.filter((p) => {
    const status = (p.status || "").toLowerCase();
    return (
      status === "installed" ||
      status === "installing" ||
      status === "reboot required"
    );
  }).length;
  const pendingPatches = patchData.filter((p) => p.status === "Pending").length;
  const totalPatches = patchData.length;

  // Compliance = (Installed + Installing + Reboot Required) / Total patches
  const overallCompliance =
    totalPatches > 0 ? Math.round((installedPatches / totalPatches) * 100) : 0;

  const chartConfig = {
    installed: { label: "Installed", color: "hsl(var(--success))" },
    installing: { label: "Installing", color: "hsl(var(--primary))" },
    pending: { label: "Pending", color: "hsl(var(--warning))" },
    failed: { label: "Failed", color: "hsl(var(--destructive))" },
    compliance: { label: "Compliance %", color: "hsl(var(--primary))" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">N-able RMM Patching Status</h1>
              <p className="text-sm text-muted-foreground">
                Patch compliance and security update management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Critical Alerts */}
        {pendingPatches > 0 && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Pending Patches Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-warning">
                {pendingPatches} patch{pendingPatches > 1 ? "es" : ""} pending
                installation across your devices.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overall Compliance
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallCompliance}%</div>
              <Progress value={overallCompliance} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patches
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatches}</div>
              <p className="text-xs text-muted-foreground">
                Across all devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Patches
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {pendingPatches}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting installation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Installed Patches
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {installedPatches}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully applied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Patch Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={patchStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      onClick={(data) => handleStatusClick(data.name)}
                      className="cursor-pointer hover:opacity-80"
                    >
                      {patchStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Severity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <BarChart data={severityData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                      onClick={(data) => handleSeverityClick(data.name)}
                      className="cursor-pointer hover:opacity-80"
                      label={{
                        position: "top",
                        fontSize: 12,
                        fill: "hsl(var(--foreground))",
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Device Compliance Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <BarChart data={complianceData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis domain={[0, 100]} fontSize={10} />
                    <Bar
                      dataKey="compliance"
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Devices with Outstanding Patches - Full Width */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Devices with Outstanding Patches</CardTitle>
              <CardDescription>
                Devices requiring the most patch attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading device data...
                  </div>
                ) : topDevices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No devices with outstanding patches
                  </div>
                ) : (
                  topDevices.map((device: any, index: number) => (
                    <div
                      key={device.deviceName}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              <span className="font-medium">
                                {device.deviceName}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Site: {device.site}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-destructive">
                            {device.totalOutstanding}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Outstanding
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {device.pendingCount > 0 && (
                          <div className="text-center p-2 bg-warning/10 rounded">
                            <div className="font-medium text-warning">
                              {device.pendingCount}
                            </div>
                            <div className="text-muted-foreground">Pending</div>
                          </div>
                        )}
                        {device.failedCount > 0 && (
                          <div className="text-center p-2 bg-destructive/10 rounded">
                            <div className="font-medium text-destructive">
                              {device.failedCount}
                            </div>
                            <div className="text-muted-foreground">Failed</div>
                          </div>
                        )}
                        {device.installingCount > 0 && (
                          <div className="text-center p-2 bg-primary/10 rounded">
                            <div className="font-medium text-primary">
                              {device.installingCount}
                            </div>
                            <div className="text-muted-foreground">
                              Installing
                            </div>
                          </div>
                        )}
                        {device.rebootRequiredCount > 0 && (
                          <div className="text-center p-2 bg-warning/10 rounded">
                            <div className="font-medium text-warning">
                              {device.rebootRequiredCount}
                            </div>
                            <div className="text-muted-foreground">
                              Reboot Req.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Severity Details Modal */}
        <Dialog open={showSeverityModal} onOpenChange={setShowSeverityModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedSeverity} Patches
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSeverityModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Patches requiring attention ({selectedSeverity?.toLowerCase()})
                for {selectedCustomer} - showing only non-installed patches
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedSeverity &&
              getFilteredPatches(selectedSeverity).length > 0 ? (
                getFilteredPatches(selectedSeverity).map((patch) => (
                  <div key={patch.id} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getSeverityColor(patch.patch)}
                          variant="secondary"
                        >
                          {selectedSeverity}
                        </Badge>
                        <Badge
                          className={getStatusColor(patch.status)}
                          variant="secondary"
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(patch.status)}
                            {patch.status}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{patch.patch}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <strong>Device:</strong> {patch.device}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Site:</strong> {patch.site}
                        </span>
                        {patch.discovered_install_date && (
                          <>
                            <span>•</span>
                            <span>
                              <strong>Discovered:</strong>{" "}
                              {patch.discovered_install_date}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No {selectedSeverity?.toLowerCase()} patches found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Details Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedStatus} Patches
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                All {selectedStatus?.toLowerCase()} patches for{" "}
                {selectedCustomer}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedStatus &&
              getFilteredPatchesByStatus(selectedStatus).length > 0 ? (
                getFilteredPatchesByStatus(selectedStatus).map((patch) => (
                  <div key={patch.id} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getSeverityColor(patch.patch)}
                          variant="secondary"
                        >
                          {patch.patch?.toLowerCase().includes("security")
                            ? "Security"
                            : patch.patch?.toLowerCase().includes("critical")
                            ? "Critical"
                            : "Standard"}
                        </Badge>
                        <Badge
                          className={getStatusColor(patch.status)}
                          variant="secondary"
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(patch.status)}
                            {patch.status}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{patch.patch}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <strong>Device:</strong> {patch.device}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Site:</strong> {patch.site}
                        </span>
                        {patch.discovered_install_date && (
                          <>
                            <span>•</span>
                            <span>
                              <strong>Discovered:</strong>{" "}
                              {patch.discovered_install_date}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No {selectedStatus?.toLowerCase()} patches found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PatchingDetails;
