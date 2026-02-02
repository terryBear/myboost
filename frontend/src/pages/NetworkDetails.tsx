import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getRoleFromToken } from "@/services/api";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    RefreshCw,
    Router,
    Signal,
    Wifi
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface NetworkDevice {
  id: string;
  name: string;
  type: "gateway" | "switch" | "access_point" | "camera" | "phone";
  status: "online" | "offline" | "warning";
  uptime: number;
  location: string;
  ip: string;
  model: string;
  firmware: string;
  clients: number;
  bandwidth: {
    upload: number;
    download: number;
  };
}

interface NetworkEvent {
  id: string;
  deviceName: string;
  eventType: "connection_lost" | "high_usage" | "firmware_update" | "client_connected" | "client_disconnected";
  severity: "info" | "warning" | "critical";
  timestamp: string;
  description: string;
  duration?: string;
}

const NetworkDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setUserRole(getRoleFromToken() ?? "");
    setSelectedCustomer(
      searchParams.get("customerName") || searchParams.get("customer") || ""
    );
  }, [searchParams]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Mock data
  const devices: NetworkDevice[] = [
    {
      id: "1",
      name: "Main Gateway",
      type: "gateway",
      status: "online",
      uptime: 99.8,
      location: "Server Room",
      ip: "192.168.1.1",
      model: "UDM Pro",
      firmware: "2.4.27",
      clients: 45,
      bandwidth: { upload: 85, download: 120 }
    },
    {
      id: "2",
      name: "Core Switch",
      type: "switch",
      status: "online",
      uptime: 99.9,
      location: "Server Room",
      ip: "192.168.1.10",
      model: "USW-Pro-48",
      firmware: "6.2.26",
      clients: 0,
      bandwidth: { upload: 0, download: 0 }
    },
    {
      id: "3",
      name: "Office AP Main",
      type: "access_point",
      status: "warning",
      uptime: 97.2,
      location: "Main Office",
      ip: "192.168.1.20",
      model: "U6-Pro",
      firmware: "6.2.25",
      clients: 28,
      bandwidth: { upload: 45, download: 67 }
    },
    {
      id: "4",
      name: "Conference Room AP",
      type: "access_point",
      status: "online",
      uptime: 99.5,
      location: "Conference Room A",
      ip: "192.168.1.21",
      model: "U6-Lite",
      firmware: "6.2.26",
      clients: 8,
      bandwidth: { upload: 12, download: 18 }
    },
    {
      id: "5",
      name: "Entrance Camera",
      type: "camera",
      status: "offline",
      uptime: 94.1,
      location: "Main Entrance",
      ip: "192.168.1.100",
      model: "G4-Pro",
      firmware: "4.69.55",
      clients: 0,
      bandwidth: { upload: 0, download: 0 }
    }
  ];

  const events: NetworkEvent[] = [
    {
      id: "1",
      deviceName: "Entrance Camera",
      eventType: "connection_lost",
      severity: "critical",
      timestamp: "2024-01-27 14:30:00",
      description: "Device went offline unexpectedly",
      duration: "30 minutes"
    },
    {
      id: "2",
      deviceName: "Office AP Main",
      eventType: "high_usage",
      severity: "warning", 
      timestamp: "2024-01-27 13:45:00",
      description: "High bandwidth usage detected - 95% capacity",
      duration: "45 minutes"
    },
    {
      id: "3",
      deviceName: "Conference Room AP",
      eventType: "client_connected",
      severity: "info",
      timestamp: "2024-01-27 13:15:00",
      description: "New client connected: iPhone-John"
    },
    {
      id: "4",
      deviceName: "Core Switch",
      eventType: "firmware_update",
      severity: "info",
      timestamp: "2024-01-27 02:00:00",
      description: "Firmware updated to version 6.2.26"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "offline":
        return "bg-destructive text-destructive-foreground";
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
      case "gateway":
        return <Router className="h-4 w-4" />;
      case "switch":
        return <Activity className="h-4 w-4" />;
      case "access_point":
        return <Wifi className="h-4 w-4" />;
      case "camera":
        return <Signal className="h-4 w-4" />;
      case "phone":
        return <Signal className="h-4 w-4" />;
      default:
        return <Router className="h-4 w-4" />;
    }
  };

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const warningDevices = devices.filter(d => d.status === "warning").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;
  const totalClients = devices.reduce((sum, d) => sum + d.clients, 0);
  const avgUptime = Math.round((devices.reduce((sum, d) => sum + d.uptime, 0) / devices.length) * 10) / 10;

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
              <Wifi className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Ubiquiti Network Details</h1>
                <p className="text-sm text-muted-foreground">
                  Network infrastructure monitoring and management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <Badge variant="outline">{selectedCustomer === "all" ? "All Customers" : "Selected Customer"}</Badge>
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
              <div className="text-2xl font-bold text-success">{onlineDevices}</div>
              <p className="text-xs text-muted-foreground">
                of {devices.length} total devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices with Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{warningDevices + offlineDevices}</div>
              <p className="text-xs text-muted-foreground">
                {warningDevices} warnings, {offlineDevices} offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Clients</CardTitle>
              <Signal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUptime}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Network Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Network Events</CardTitle>
            <CardDescription>
              Latest network activities and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{event.deviceName}</h4>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline">{event.eventType.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Time: {event.timestamp}</span>
                      {event.duration && <span>Duration: {event.duration}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    {event.severity === "critical" && (
                      <Button size="sm">Investigate</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle>Network Device Status</CardTitle>
            <CardDescription>
              Real-time status and performance of all network devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <h4 className="font-medium">{device.name}</h4>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                      <Badge variant="outline">{device.type.replace("_", " ")}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>Location</p>
                        <p className="font-medium text-foreground">{device.location}</p>
                      </div>
                      <div>
                        <p>IP Address</p>
                        <p className="font-medium text-foreground">{device.ip}</p>
                      </div>
                      <div>
                        <p>Model</p>
                        <p className="font-medium text-foreground">{device.model}</p>
                      </div>
                      <div>
                        <p>Firmware</p>
                        <p className="font-medium text-foreground">{device.firmware}</p>
                      </div>
                    </div>
                    {device.clients > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{device.clients}</span> connected clients
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">{device.uptime}%</span>
                      </div>
                      <Progress value={device.uptime} className="h-2" />
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">Configure</Button>
                    <Button size="sm" variant="outline">Restart</Button>
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

export default NetworkDetails;