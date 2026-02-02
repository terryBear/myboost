import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { get } from "@/services/api";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Computer,
    Eye,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface AntivirusData {
  id: number;
  device_name: string;
  av_product_name: string;
  av_status: string;
  threat_count: number;
  last_update: string;
  last_scan: string;
}

interface SentinelOneData {
  id: number;
  endpoints: string;
  site: string;
  status: string;
  classification: string;
  confidence_level: string;
  threat_details: string;
  analyst_verdict: string;
  incident_status: string;
}

interface SecuritySummary {
  totalDevices: number;
  antivirusInstalled: number;
  sentinelOneInstalled: number;
  protectedDevices: number;
  unprotectedDevices: number;
  activeThreats: number;
}

const SecurityDetails = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [antivirusData, setAntivirusData] = useState<AntivirusData[]>([]);
  const [sentinelOneData, setSentinelOneData] = useState<SentinelOneData[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer derived from URL param
  const [searchParams] = useSearchParams();
  const customerName = searchParams.get("customerName") || "";

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role || "");
    fetchSecurityData();
  }, [customerName]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const params = customerName ? { customerName } : {};
      const [devicesData, agentsData] = await Promise.all([
        get<any[]>("reporting/devices/", { params }),
        get<any[]>("reporting/agents/", { params }),
      ]);

      const devicesList = Array.isArray(devicesData) ? devicesData : [];
      const agentsList = Array.isArray(agentsData) ? agentsData : [];

      // Build device view: key by computername/name/hostname; merge N-able devices with S1 agents
      const byKey = new Map<string, any>();
      const getKey = (d: any) =>
        String(
          d.computername ?? d.name ?? d.hostname ?? d.deviceName ?? d.endpointName ?? ""
        )
        .trim()
        .toLowerCase();
      for (const d of devicesList) {
        const k = getKey(d);
        if (!k) continue;
        byKey.set(k, {
          hostname: d.computername ?? d.name ?? d.hostname ?? "Unknown",
          site_name: d.siteName ?? d.site ?? "Unknown",
          av_installed: true,
          av_product: "N-able",
          nable_last_seen: d.last_seen ?? d.lastSeen,
          s1_present: false,
        });
      }
      for (const a of agentsList) {
        const k = getKey(a);
        if (!k) continue;
        const existing = byKey.get(k);
        if (existing) {
          existing.s1_present = true;
          existing.agent_version = a.agentVersion ?? a.version;
        } else {
          byKey.set(k, {
            hostname: a.computerName ?? a.networkInterfaces?.[0]?.name ?? "Unknown",
            site_name: a.siteName ?? a.site ?? "Unknown",
            av_installed: false,
            av_product: "",
            nable_last_seen: undefined,
            s1_present: true,
            agent_version: a.agentVersion ?? a.version,
          });
        }
      }

      const deviceView = Array.from(byKey.values());
      const avInstalledCount = deviceView.filter((d) => d.av_installed).length;
      const s1Count = deviceView.filter((d) => d.s1_present).length;

      setSecuritySummary({
        totalDevices: deviceView.length,
        antivirusInstalled: avInstalledCount,
        sentinelOneInstalled: s1Count,
        protectedDevices: Math.max(avInstalledCount, s1Count),
        unprotectedDevices: Math.max(0, deviceView.length - Math.max(avInstalledCount, s1Count)),
        activeThreats: 0,
      });

      const antivirusFormatted = deviceView.map((device: any, i: number) => ({
        id: i,
        device_name: device.hostname ?? "Unknown Device",
        av_product_name: device.av_product ?? "Unknown",
        av_status: device.av_installed ? "Enabled" : "Disabled",
        threat_count: 0,
        last_update: device.nable_last_seen ?? new Date().toISOString(),
        last_scan: device.nable_last_seen ?? new Date().toISOString(),
      }));

      const s1Formatted = deviceView
        .filter((d: any) => d.s1_present)
        .map((d: any, i: number) => ({
          id: i,
          endpoints: d.hostname ?? "Unknown Device",
          site: d.site_name ?? "Unknown Site",
          status: "Protected",
          classification: "Clean",
          confidence_level: "High",
          threat_details: "SentinelOne Agent Installed",
          analyst_verdict: "Clean",
          incident_status: "Resolved",
        }));

      setAntivirusData(antivirusFormatted);
      setSentinelOneData(s1Formatted);
    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSecurityData();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleSyncSecurity = async () => {
    setIsRefreshing(true);
    try {
      await get("reporting/sync/");
      await fetchSecurityData();
    } catch (error) {
      console.error("Error syncing security data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get threat breakdown by risk level
  const getThreatBreakdown = () => {
    const breakdown = sentinelOneData.reduce((acc, threat) => {
      const classification = threat.classification || 'Unknown';
      const confidenceLevel = threat.confidence_level || 'Unknown';
      const status = threat.incident_status || threat.status || 'Unknown';
      
      let riskLevel = 'Low';
      if (classification.toLowerCase().includes('malware') || classification.toLowerCase().includes('trojan')) {
        riskLevel = 'Critical';
      } else if (classification.toLowerCase().includes('suspicious')) {
        riskLevel = 'High';
      } else if (confidenceLevel.toLowerCase().includes('high')) {
        riskLevel = 'Medium';
      }

      if (!acc[riskLevel]) {
        acc[riskLevel] = { count: 0, active: 0 };
      }
      acc[riskLevel].count++;
      if (status !== 'Resolved') {
        acc[riskLevel].active++;
      }
      return acc;
    }, {} as Record<string, { count: number; active: number }>);

    return breakdown;
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

  const getAntivirusProducts = () => {
    const products = antivirusData.reduce((acc, av) => {
      const product = av.av_product_name || 'Unknown';
      if (!acc[product]) {
        acc[product] = { count: 0, active: 0 };
      }
      acc[product].count++;
      if (av.av_status?.toLowerCase().includes('enabled') || av.av_status?.toLowerCase().includes('active')) {
        acc[product].active++;
      }
      return acc;
    }, {} as Record<string, { count: number; active: number }>);

    return products;
  };

  const threatBreakdown = getThreatBreakdown();
  const antivirusProducts = getAntivirusProducts();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/coffee/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Security Overview</h1>
                <p className="text-sm text-muted-foreground">
                  Antivirus, SentinelOne and threat management dashboard
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole === "admin" && customerName && (
              <Badge variant="outline">{customerName}</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="default" size="sm" onClick={handleSyncSecurity} disabled={isRefreshing}>
              <Shield className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync Security Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Computer className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {loading ? "..." : securitySummary?.totalDevices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Monitored endpoints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protected Devices</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {loading ? "..." : securitySummary?.protectedDevices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                With security software
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unprotected Devices</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {loading ? "..." : securitySummary?.unprotectedDevices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Missing protection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {loading ? "..." : securitySummary?.activeThreats || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Product Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Antivirus Products</CardTitle>
              <CardDescription>
                Traditional antivirus software installed on devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(antivirusProducts).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No antivirus data available
                  </div>
                ) : (
                  Object.entries(antivirusProducts).map(([product, stats]) => (
                    <div key={product} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-medium">{product}</div>
                          <div className="text-sm text-muted-foreground">
                            {stats.active} active of {stats.count} installed
                          </div>
                        </div>
                      </div>
                      <Badge variant={stats.active === stats.count ? "default" : "destructive"}>
                        {Math.round((stats.active / stats.count) * 100)}% Active
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SentinelOne Coverage</CardTitle>
              <CardDescription>
                Advanced endpoint detection and response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">SentinelOne Agents</div>
                      <div className="text-sm text-muted-foreground">
                        Devices with SentinelOne installed
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {securitySummary?.sentinelOneInstalled || 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-warning" />
                    <div>
                      <div className="font-medium">Total Threats Detected</div>
                      <div className="text-sm text-muted-foreground">
                        All time threat detections
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-warning">
                    {sentinelOneData.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Threat Risk Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Threat Risk Breakdown</CardTitle>
            <CardDescription>
              SentinelOne threat classifications by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Risk Level</th>
                    <th className="text-left p-4">Total Threats</th>
                    <th className="text-left p-4">Active Threats</th>
                    <th className="text-left p-4">Resolved</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(threatBreakdown).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No threat data available
                      </td>
                    </tr>
                  ) : (
                    Object.entries(threatBreakdown).map(([risk, stats]) => (
                      <tr key={risk} className="border-b">
                        <td className="p-4">
                          <Badge className={getRiskColor(risk)} variant="secondary">
                            {risk}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">{stats.count}</td>
                        <td className="p-4">
                          <span className="text-destructive font-medium">{stats.active}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-success font-medium">{stats.count - stats.active}</span>
                        </td>
                        <td className="p-4">
                          {stats.active === 0 ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              All Resolved
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4" />
                              {stats.active} Active
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent SentinelOne Threats */}
        <Card>
          <CardHeader>
            <CardTitle>Recent SentinelOne Threats</CardTitle>
            <CardDescription>
              Latest threat detections and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentinelOneData.slice(0, 10).map((threat) => (
                <div key={threat.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(
                        threat.classification?.toLowerCase().includes('malware') ? 'Critical' :
                        threat.classification?.toLowerCase().includes('suspicious') ? 'High' :
                        threat.confidence_level?.toLowerCase().includes('high') ? 'Medium' : 'Low'
                      )} variant="secondary">
                        {threat.classification || 'Unknown'}
                      </Badge>
                      <Badge variant={threat.incident_status === 'Resolved' ? 'default' : 'destructive'}>
                        {threat.incident_status || threat.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {threat.endpoints}
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-2">
                    {threat.threat_details || 'No details available'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span><strong>Site:</strong> {threat.site}</span>
                    <span><strong>Confidence:</strong> {threat.confidence_level}</span>
                    <span><strong>Verdict:</strong> {threat.analyst_verdict}</span>
                  </div>
                </div>
              ))}
              {sentinelOneData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No SentinelOne threat data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SecurityDetails;