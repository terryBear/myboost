import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Cpu,
  HardDrive,
  Thermometer,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Device {
  id: string;
  name: string;
  type: "workstation" | "server" | "laptop" | "mobile";
  status: "online" | "offline" | "warning" | "critical";
  os: string;
  lastSeen: string;
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
  temperature?: number;
  location: string;
  user?: string;
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: "performance" | "security" | "system" | "disk" | "network";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
}

interface Patch {
  id: string;
  deviceName: string;
  patchName: string;
  type: "security" | "feature" | "bugfix";
  status: "pending" | "installed" | "failed" | "scheduled";
  releaseDate: string;
  installDate?: string;
}

const DeviceDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const customer = searchParams.get("customerName") || "";
    setUserRole(role || "");
    setSelectedCustomer(customer);
    fetchDeviceData(customer);
  }, [searchParams]);

  const fetchDeviceData = async (customerName: string) => {
    try {
      setLoading(true);
      
      console.log(`[DeviceDetails] Fetching data for customer: "${customerName}"`);
      
      // Normalize customer key and resolve via v_customers_norm
      const normalizeKey = (name: string) =>
        String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
      let clientKey = normalizeKey(customerName);
      
      const { data: custRow } = await supabase
        .from('v_customers_norm')
        .select('client_key,name')
        .eq('name', customerName)
        .maybeSingle();
      
      if (custRow?.client_key) {
        clientKey = String(custRow.client_key).toLowerCase();
        console.log(`[DeviceDetails] Resolved "${customerName}" -> clientKey: "${clientKey}"`);
      } else {
        console.log(`[DeviceDetails] No match in v_customers_norm, using normalized: "${clientKey}"`);
      }

      // Fetch devices using normalized customer_key
      const { data: devicesData, error } = await supabase
        .from('devices_normalized')
        .select('*')
        .eq('customer_key', clientKey);

      if (error) {
        console.error('Error fetching devices:', error);
        setDevices([]);
        return;
      }

      // Map to Device interface
      const mappedDevices: Device[] = (devicesData || []).map((device: any, index: number) => ({
        id: device.id?.toString() || `device-${index}`,
        name: device.name || 'Unknown Device',
        type: device.type?.toLowerCase() === 'server' ? 'server' : 'workstation',
        status: device.connection_status?.toLowerCase() === 'online' ? 'online' : 'offline',
        os: 'Windows', // Not in normalized table, would need additional join
        lastSeen: device.last_seen || new Date().toISOString(),
        uptime: 95.0,
        cpu: 0,
        memory: 0,
        disk: 0,
        location: 'N/A',
        alerts: []
      }));

      setDevices(mappedDevices);
    } catch (error) {
      console.error('Error fetching device data:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeviceData(selectedCustomer);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const patches: Patch[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "offline":
        return "bg-gray-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-black";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "server":
        return <Monitor className="h-4 w-4" />;
      case "workstation":
        return <Monitor className="h-4 w-4" />;
      case "laptop":
        return <Monitor className="h-4 w-4" />;
      case "mobile":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const criticalDevices = devices.filter(d => d.status === "critical").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;
  const totalAlerts = devices.reduce((sum, d) => sum + d.alerts.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Monitor className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">N-able RMM Details</h1>
                <p className="text-sm text-muted-foreground">
                  Remote monitoring and management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole === "admin" && selectedCustomer && (
              <Badge variant="outline">{selectedCustomer}</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {loading ? "..." : onlineDevices}
              </div>
              <p className="text-xs text-muted-foreground">
                of {devices.length} managed devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{criticalDevices}</div>
              <p className="text-xs text-muted-foreground">
                Devices requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offlineDevices}</div>
              <p className="text-xs text-muted-foreground">
                Not responding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Across all devices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Device Status Overview</CardTitle>
            <CardDescription>
              Real-time performance and health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No devices found for this customer</div>
            ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <div>
                        <h4 className="font-medium">{device.name}</h4>
                        <p className="text-sm text-muted-foreground">{device.os} • {device.location}</p>
                        {device.user && (
                          <p className="text-sm text-muted-foreground">User: {device.user}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                      <Badge variant="outline">{device.type}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Remote Control</Button>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        <span className="text-xs">CPU</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{device.cpu}%</span>
                      </div>
                      <Progress value={device.cpu} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        <span className="text-xs">Memory</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{device.memory}%</span>
                      </div>
                      <Progress value={device.memory} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        <span className="text-xs">Disk</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{device.disk}%</span>
                      </div>
                      <Progress value={device.disk} className="h-1" />
                    </div>
                    
                    {device.temperature && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          <span className="text-xs">Temp</span>
                        </div>
                        <div className="text-sm">{device.temperature}°C</div>
                      </div>
                    )}
                  </div>

                  {/* Alerts */}
                  {device.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Active Alerts</h5>
                      {device.alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                              {alert.severity}
                            </Badge>
                            <span>{alert.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Patch Management */}
        <Card>
          <CardHeader>
            <CardTitle>Patch Management</CardTitle>
            <CardDescription>
              Windows updates and patch deployment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patches.map((patch) => (
                <div key={patch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{patch.deviceName}</h4>
                      <Badge className={getStatusColor(patch.status)}>
                        {patch.status}
                      </Badge>
                      <Badge variant="outline">{patch.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{patch.patchName}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Released: {patch.releaseDate}</span>
                      {patch.installDate && <span>Installed: {patch.installDate}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    {patch.status === "pending" && (
                      <Button size="sm">Install Now</Button>
                    )}
                    {patch.status === "failed" && (
                      <Button size="sm">Retry</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DeviceDetails;