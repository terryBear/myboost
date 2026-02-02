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
import { useReportHeader } from "@/contexts/ReportHeaderContext";
import { useReportSidebarActions } from "@/contexts/ReportSidebarActionsContext";
import { useToast } from "@/hooks/use-toast";
import { get, isAdminFromToken, post } from "@/services/api";
import {
  Download,
  HardDrive,
  Link2,
  LogOut,
  Monitor,
  RefreshCw,
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

interface Customer {
  id: string;
  name: string;
  healthScore: number;
  devices: number;
  patchCompliance: number;
  securityScore: number;
  backupStatus: string;
  securityStatus: string;
  networkUptime: number;
  lastUpdated: string;
  criticalThreats: number;
  patchingIssues: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [searchParams] = useSearchParams();
  const selectedCustomer = searchParams.get("customerName") || "all";
  const [customerName, setCustomerName] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminFromToken();
  const { setHeaderRight } = useReportHeader();
  const { setSidebarActions } = useReportSidebarActions();

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get<Customer[]>("reporting/dashboard/customers/");
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/boostcoffee/login");
      return;
    }
    setUserRole(isAdminFromToken() ? "admin" : "user");
    fetchCustomerData();
  }, [navigate, fetchCustomerData]);

  useEffect(() => {
    setHeaderRight(
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium text-foreground">
          {selectedCustomer === "all" ? "All Customers" : customers.find((c) => c.id === selectedCustomer)?.name ?? "Customer"}
        </span>
      </div>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, selectedCustomer, customers]);

  useEffect(() => {
    setSidebarActions(
      <>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleGenerateShareLink}
            disabled={
              isGeneratingLink ||
              selectedCustomer === "all" ||
              customers.length === 0
            }
            title="Generate a shareable link for the selected customer"
          >
            <Link2 className={`size-4 shrink-0 ${isGeneratingLink ? "animate-pulse" : ""}`} />
            <span>{isGeneratingLink ? "Generating…" : "Share link"}</span>
          </Button>
        )}
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`size-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
        {isAdmin && (
          <Button variant="default" size="sm" className="w-full justify-start" onClick={handleSyncAPIs} disabled={isRefreshing}>
            <Download className={`size-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </Button>
        )}
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="size-4 shrink-0" />
          <span>Logout</span>
        </Button>
      </>
    );
    return () => setSidebarActions(null);
  }, [setSidebarActions, isAdmin, selectedCustomer, customers, isRefreshing, isGeneratingLink]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/boostcoffee/login");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomerData();
    setIsRefreshing(false);
  };

  const handleSyncAPIs = async () => {
    setIsRefreshing(true);
    try {
      await get("reporting/sync/", {});
      await fetchCustomerData();
    } catch (error) {
      console.error("Error syncing APIs:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Only admins can run sync.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateShareLink = async () => {
    const customerId =
      selectedCustomer === "all" ? customers[0]?.id : selectedCustomer;
    if (!customerId) {
      toast({
        title: "Select a customer",
        description: "Choose a customer from the dropdown to generate a share link.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingLink(true);
    try {
      const res = await post<{ url: string; expires_in_days: number }>(
        "share/generate-link/",
        { customer_id: customerId, expires_in_days: 7 }
      );
      if (res?.url) {
        await navigator.clipboard.writeText(res.url);
        toast({
          title: "Share link copied",
          description: `Link valid for ${res.expires_in_days} days. Recipients can view this customer's report at /coffee/dashboard (no login required).`,
        });
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      toast({
        title: "Could not generate link",
        description:
          error instanceof Error ? error.message : "Admin access required.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "protected":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "needs attention":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Dropdown drives the view: "all" = all customers, else the selected customer only
  const filteredCustomers =
    selectedCustomer === "all"
      ? customers
      : customers.filter((c) => c.id === selectedCustomer);

  const totalDevices = filteredCustomers.reduce((sum, c) => sum + c.devices, 0);
  const avgPatchCompliance =
    filteredCustomers.length > 0
      ? Math.round(
          filteredCustomers.reduce((sum, c) => sum + c.patchCompliance, 0) /
            filteredCustomers.length
        )
      : 0;
  const avgSecurityScore =
    filteredCustomers.length > 0
      ? Math.round(
          filteredCustomers.reduce((sum, c) => sum + c.securityScore, 0) /
            filteredCustomers.length
        )
      : 0;
  const avgUptime =
    filteredCustomers.length > 0
      ? Math.round(
          (filteredCustomers.reduce((sum, c) => sum + c.networkUptime, 0) /
            filteredCustomers.length) *
            10
        ) / 10
      : 0;

  // Industry standard compliance calculation (Patching only since no SentinelOne data)
  const overallCompliance = avgPatchCompliance; // Use patch compliance as overall compliance
  const totalCriticalThreats = filteredCustomers.reduce(
    (sum, c) => sum + c.criticalThreats,
    0
  );
  const totalPatchingIssues = filteredCustomers.reduce(
    (sum, c) => sum + c.patchingIssues,
    0
  );

  // Chart data for compliance overview - show compliant vs non-compliant
  const complianceData = [
    {
      name: "Compliant",
      value: avgPatchCompliance,
      fill: "hsl(var(--cyber-green))",
      label: "Compliant",
    },
    {
      name: "Non-Compliant",
      value: 100 - avgPatchCompliance,
      fill: "hsl(var(--cyber-red))",
      label: "Non-Compliant",
    },
  ];

  const deviceComplianceData = filteredCustomers.map((customer) => ({
    name: customer.name.split(" ")[0],
    devices: customer.devices,
    patchCompliance: customer.patchCompliance,
    securityScore: customer.securityScore,
  }));

  const threatData = [
    {
      name: "Protected",
      value: filteredCustomers.filter(
        (c) => (c.securityStatus || "").toLowerCase() === "protected"
      ).length,
      fill: "hsl(var(--cyber-green))",
    },
    {
      name: "Needs Attention",
      value: filteredCustomers.filter(
        (c) =>
          (c.securityStatus || "").toLowerCase() === "at risk" ||
          (c.securityStatus || "").toLowerCase() === "needs attention"
      ).length,
      fill: "hsl(var(--cyber-red))",
    },
  ];

  const patchStatusData = filteredCustomers.map((customer) => ({
    name: customer.name.split(" ")[0],
    compliance: customer.patchCompliance,
    issues: customer.patchingIssues,
  }));

  const chartConfig = {
    securityScore: {
      label: "Security Score",
      color: "hsl(var(--cyber-blue))",
    },
    patchCompliance: {
      label: "Patch Compliance",
      color: "hsl(var(--cyber-green))",
    },
    overallCompliance: {
      label: "Overall Compliance",
      color: "hsl(var(--cyber-purple))",
    },
    threats: {
      label: "Threat Status",
      color: "hsl(var(--cyber-red))",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle corporate accent background */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="p-6 relative z-10 bg-background min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
            Loading dashboard...
          </div>
        ) : (
          <>
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Industry Compliance Score
              </CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="compliance-score">
                {overallCompliance > 0 ? `${overallCompliance}%` : "N/A"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="status-indicator status-success">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {overallCompliance === 0
                    ? "No data available"
                    : overallCompliance >= 90
                    ? "Excellent"
                    : overallCompliance >= 80
                    ? "Good"
                    : "Needs Improvement"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Managed Devices
              </CardTitle>
              <Monitor className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDevices > 0 ? totalDevices : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                N-able RMM endpoints
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Patch Compliance
              </CardTitle>
              <Download className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPatchCompliance}%</div>
              <div className="flex items-center gap-1 mt-1">
                {totalPatchingIssues > 0 && (
                  <span className="text-xs text-destructive">
                    {totalPatchingIssues} issues
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Security Score
              </CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgSecurityScore > 0 ? `${avgSecurityScore}%` : "N/A"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {totalCriticalThreats > 0 && (
                  <span className="text-xs text-destructive">
                    {totalCriticalThreats} threats
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Compliance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Device Patch Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <BarChart data={patchStatusData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Bar
                      dataKey="compliance"
                      fill="hsl(var(--cyber-green))"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: "top",
                        fontSize: 12,
                        fill: "hsl(var(--foreground))",
                        formatter: (value: number) => `${value}%`,
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Security Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={threatData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {threatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Customer Environment Overview */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle>Environment Compliance Status</CardTitle>
            <CardDescription>
              Real-time compliance metrics and device management overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-6 border rounded-lg bg-card/50 hover:bg-card/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{customer.name}</h4>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {customer.devices} devices
                      </Badge>
                      <div className="compliance-score text-lg">
                        {Math.round(
                          customer.securityScore * 0.6 +
                            customer.patchCompliance * 0.4
                        )}
                        %
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-primary/5 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20"
                      onClick={() =>
                        navigate(
                          `/boostcoffee/security?customerName=${encodeURIComponent(
                            customer.name
                          )}`
                        )
                      }
                    >
                      <div className="status-indicator status-success">
                        <Shield className="h-5 w-5 relative z-10" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          SentinelOne
                        </p>
                        <div className="font-medium">
                          {customer.securityScore}% secure
                        </div>
                        {customer.criticalThreats > 0 && (
                          <Badge className="bg-destructive/20 text-destructive text-xs mt-1">
                            {customer.criticalThreats} threats
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-primary/5 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20"
                      onClick={() =>
                        navigate(
                          `/boostcoffee/patching?customerName=${encodeURIComponent(
                            customer.name
                          )}`
                        )
                      }
                    >
                      <div className="status-indicator status-warning">
                        <Download className="h-5 w-5 relative z-10" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          N-able Patching
                        </p>
                        <div className="font-medium">
                          {customer.patchCompliance}% compliant
                        </div>
                        {customer.patchingIssues > 0 && (
                          <Badge className="bg-warning/20 text-warning text-xs mt-1">
                            {customer.patchingIssues} pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-primary/5 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20"
                      onClick={() =>
                        navigate(
                          `/boostcoffee/backup?customerName=${encodeURIComponent(
                            customer.name
                          )}`
                        )
                      }
                    >
                      <div className="status-indicator status-success">
                        <HardDrive className="h-5 w-5 relative z-10" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Cove Backup
                        </p>
                        <Badge
                          className={getStatusColor(customer.backupStatus)}
                          variant="secondary"
                        >
                          {customer.backupStatus}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-primary/5 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20"
                      onClick={() =>
                        navigate(
                          `/boostcoffee/tickets?customerName=${encodeURIComponent(
                            customer.name
                          )}`
                        )
                      }
                    >
                      <div className="status-indicator status-warning">
                        <Ticket className="h-5 w-5 relative z-10" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Support Status
                        </p>
                        <Badge className="bg-primary/20 text-primary text-xs">
                          View tickets
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="font-medium">
                        {customer.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
