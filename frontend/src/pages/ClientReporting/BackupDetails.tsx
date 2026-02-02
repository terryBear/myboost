import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/services/api";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Download,
    HardDrive,
    Monitor,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Server,
    Settings,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface BackupDevice {
  id: string;
  deviceName: string;
  computerName: string;
  customer: string;
  deviceType: "Workstation" | "Server" | "Documents" | "Not Installed";
  selectedSize: number;
  usedStorage: number;
  backupStatus: "Completed" | "CompletedWithErrors" | "Failed" | "InProcess" | "No backups";
  errors: number;
  lastBackup: string;
  progressBars: { color: string; width: number }[];
}

const BackupDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<BackupDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const nameFromQuery = searchParams.get("customerName") || "";
    setUserRole(role || "");
    setSelectedCustomer(nameFromQuery);
    fetchBackupData(nameFromQuery);
  }, [searchParams]);

  const fetchBackupData = async (customerName: string) => {
    try {
      setLoading(true);
      const raw = await get<any[]>("reporting/backups/", {
        params: customerName ? { customerName } : {},
      });
      const list = Array.isArray(raw) ? raw : [];
      const transformedDevices: BackupDevice[] = list.map((item: any, i: number) => ({
        id: item.id?.toString() || `backup-${i}`,
        deviceName: item.device_name || item.deviceName || "",
        computerName: item.computer_name || item.computerName || "",
        customer: item.partner_name || item.customer || customerName || "",
        deviceType: (item.device_type || item.deviceType) === "Workstation" ? "Workstation" : (item.device_type || item.deviceType) || "Workstation",
        selectedSize: Number(item.total_selected_size_gb ?? item.selectedSize) || 0,
        usedStorage: Number(item.used_storage_gb ?? item.usedStorage) || 0,
        backupStatus: (item.total_status || item.backupStatus || "No backups") as BackupDevice["backupStatus"],
        errors: Number(item.number_of_errors ?? item.errors) || 0,
        lastBackup: formatLastBackup(item.last_successful_session ?? item.lastBackup),
        progressBars: generateProgressBars(item.color_bar_last_28_days ?? item.progressBars),
      }));
      setDevices(transformedDevices);
    } catch (error) {
      console.error("Error fetching backup data:", error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatLastBackup = (lastSession: string | null) => {
    if (!lastSession) return 'Never';
    const date = new Date(lastSession);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return diffDays.toString().padStart(2, '0');
    return 'Never';
  };

  const generateProgressBars = (colorBar: string | null) => {
    if (!colorBar) return [];
    
    const bars: { color: string; width: number }[] = [];
    const colors = colorBar.split(' ')[0] || '';
    
    let currentColor = '';
    let currentWidth = 0;
    
    for (let i = 0; i < Math.min(colors.length, 28); i++) {
      const char = colors[i];
      let color = 'bg-gray-400';
      
      switch (char) {
        case '5':
          color = 'bg-green-500';
          break;
        case '8':
          color = 'bg-orange-500';
          break;
        case 'c':
        case 'C':
          color = 'bg-red-500';
          break;
        case '0':
        default:
          color = 'bg-gray-400';
          break;
      }
      
      if (color === currentColor) {
        currentWidth += 2;
      } else {
        if (currentColor) {
          bars.push({ color: currentColor, width: Math.min(currentWidth, 40) });
        }
        currentColor = color;
        currentWidth = 2;
      }
    }
    
    if (currentColor) {
      bars.push({ color: currentColor, width: Math.min(currentWidth, 40) });
    }
    
    return bars.slice(0, 3); // Limit to 3 bars for display
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBackupData(selectedCustomer).finally(() => setIsRefreshing(false));
  };

  const handleSyncBackupAPI = async () => {
    setIsRefreshing(true);
    try {
      await get("reporting/sync/", {});
      await fetchBackupData(selectedCustomer);
    } catch (error) {
      console.error("Error syncing backup API:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ['Device Name', 'Computer Name', 'Customer', 'Device Type', 'Selected Size (GB)', 'Used Storage (GB)', 'Backup Status', 'Errors', 'Last Backup'],
      ...filteredDevices.map(device => [
        device.deviceName,
        device.computerName,
        device.customer,
        device.deviceType,
        device.selectedSize.toString(),
        device.usedStorage.toString(),
        device.backupStatus,
        device.errors.toString(),
        device.lastBackup
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-devices-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };


  // Summary stats for the top cards
  const totalDevices = devices.length;
  const office365Tenants = 1;
  const completedBackups = devices.filter(d => d.backupStatus === "Completed").length;
  const backupsLast24h = devices.filter(d => d.lastBackup === "today").length;
  const completedPercentage = Math.round((completedBackups / totalDevices) * 100);
  const last24hPercentage = Math.round((backupsLast24h / totalDevices) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500 text-white";
      case "CompletedWithErrors":
        return "bg-orange-500 text-white";
      case "Failed":
        return "bg-red-500 text-white";
      case "InProcess":
        return "bg-blue-500 text-white";
      case "No backups":
        return "bg-gray-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case "Server":
        return <Server className="h-4 w-4" />;
      case "Workstation":
        return <Monitor className="h-4 w-4" />;
      case "Documents":
        return <Database className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  // Filter devices based on search query
  const filteredDevices = devices.filter(device =>
    device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.computerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart data for dashboard cards - calculated from real data
  const deviceTypeCounts = devices.reduce((acc, device) => {
    const type = device.deviceType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceTypeData = [
    { name: "Server", value: deviceTypeCounts["Server"] || 0, fill: "hsl(210, 100%, 45%)" },
    { name: "Workstation", value: deviceTypeCounts["Workstation"] || 0, fill: "hsl(210, 100%, 55%)" },
    { name: "Documents", value: deviceTypeCounts["Documents"] || 0, fill: "hsl(180, 100%, 50%)" },
    { name: "Not Installed", value: deviceTypeCounts["Not Installed"] || 0, fill: "hsl(0, 0%, 60%)" }
  ];

  const office365Data = [
    { name: "Microsoft 365 domain", value: 1, fill: "hsl(300, 70%, 40%)" },
  ];

  const statusCounts = devices.reduce((acc, device) => {
    const status = device.backupStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const backupCompletionData = [
    { name: "Completed", value: statusCounts["Completed"] || 0, fill: "hsl(120, 70%, 45%)" },
    { name: "Completed with errors", value: statusCounts["CompletedWithErrors"] || 0, fill: "hsl(35, 100%, 55%)" },
    { name: "In process", value: statusCounts["InProcess"] || 0, fill: "hsl(35, 100%, 45%)" },
    { name: "Failed", value: statusCounts["Failed"] || 0, fill: "hsl(0, 80%, 50%)" },
    { name: "No backups", value: statusCounts["No backups"] || 0, fill: "hsl(0, 0%, 60%)" }
  ];

  const backup24hCounts = devices.reduce((acc, device) => {
    if (device.lastBackup === 'today' || device.lastBackup === 'yesterday') {
      acc['< 24 hours ago']++;
    } else if (device.lastBackup !== 'Never' && parseInt(device.lastBackup) <= 2) {
      acc['24 - 48 hours ago']++;
    } else if (device.lastBackup !== 'Never') {
      acc['> 48 hours ago']++;
    } else {
      acc['No backups']++;
    }
    return acc;
  }, { '< 24 hours ago': 0, '24 - 48 hours ago': 0, '> 48 hours ago': 0, 'No backups': 0 });

  const backup24hData = [
    { name: "< 24 hours ago", value: backup24hCounts['< 24 hours ago'], fill: "hsl(120, 70%, 45%)" },
    { name: "24 - 48 hours ago", value: backup24hCounts['24 - 48 hours ago'], fill: "hsl(35, 100%, 55%)" },
    { name: "> 48 hours ago", value: backup24hCounts['> 48 hours ago'], fill: "hsl(15, 100%, 50%)" },
    { name: "No backups", value: backup24hCounts['No backups'], fill: "hsl(0, 0%, 60%)" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-blue-400 font-bold text-lg">Dashboard:</div>
            <Select defaultValue="all-devices">
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all-devices">All devices</SelectItem>
                <SelectItem value="servers">Servers</SelectItem>
                <SelectItem value="workstations">Workstations</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-blue-400">|</div>
            <div className="text-blue-400 font-medium">Customer:</div>
            <Select defaultValue="all">
              <SelectTrigger className="w-64 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="myboost">Myboost (michael@myboost.co.za)</SelectItem>
                <SelectItem value="ambl">Ambl.co</SelectItem>
                <SelectItem value="mica">Mica Petit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
           <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="bg-gray-800 border-gray-700 hover:bg-gray-700">
               <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
               Refresh
             </Button>
             <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
               <Download className="h-4 w-4 mr-1" />
               Save view
             </Button>
             <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </div>
        </div>
      </header>

          {/* Main Content */}
          <main className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading backup data...</div>
              </div>
            ) : (
              <>
            {/* Top Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Devices Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{totalDevices} Devices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{totalDevices}</div>
                </div>
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {deviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Server
                  </span>
                   <span className="text-white">{deviceTypeCounts["Server"] || 0}</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                     Workstation
                   </span>
                   <span className="text-white">{deviceTypeCounts["Workstation"] || 0}</span>
                 </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    Documents
                  </span>
                  <span className="text-white">{deviceTypeCounts["Documents"] || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    Not Installed
                  </span>
                   <span className="text-white">{deviceTypeCounts["Not Installed"] || 0}</span>
                </div>
              </div>
               <div className="mt-4 space-y-1 text-xs text-gray-400">
                 <div>{(devices.reduce((acc, device) => acc + device.selectedSize, 0) / 1000).toFixed(1)} TB Selected size</div>
                 <div>{(devices.reduce((acc, device) => acc + device.usedStorage, 0) / 1000).toFixed(1)} TB Used storage</div>
               </div>
            </CardContent>
          </Card>

          {/* Office 365 Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{office365Tenants} Microsoft 365 tenants</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{office365Tenants}</div>
                </div>
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={office365Data}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {office365Data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    Microsoft 365 domain
                  </span>
                  <span className="text-white">1</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>M365 billable users</span>
                  <span>2</span>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-400">
                <div>488 GB Selected size</div>
                <div>203 GB Used storage</div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Completion Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{completedPercentage}% Backups completed</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{completedPercentage}%</div>
                </div>
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={backupCompletionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {backupCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Completed
                  </span>
                   <span className="text-white">{statusCounts["Completed"] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Completed with errors
                  </span>
                  <span className="text-white">{statusCounts["CompletedWithErrors"] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    In process
                  </span>
                   <span className="text-white">{statusCounts["InProcess"] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Failed
                  </span>
                  <span className="text-white">{statusCounts["Failed"] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    No backups
                  </span>
                   <span className="text-white">{statusCounts["No backups"] || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 24h Backup Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{last24hPercentage}% Backed up &lt; 24 hours ago</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{last24hPercentage}%</div>
                </div>
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={backup24hData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {backup24hData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    &lt; 24 hours ago
                  </span>
                  <span className="text-white">{backup24hCounts['< 24 hours ago']}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    24 - 48 hours ago
                  </span>
                   <span className="text-white">{backup24hCounts['24 - 48 hours ago']}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    &gt; 48 hours ago
                  </span>
                   <span className="text-white">{backup24hCounts['> 48 hours ago']}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    No backups
                  </span>
                  <span className="text-white">{backup24hCounts['No backups']}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add device
            </Button>
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white">
              <Settings className="h-4 w-4 mr-1" />
              Columns
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Device Table */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded border-gray-600" />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-white">Device name</TableHead>
                  <TableHead className="text-white">Computer name</TableHead>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">Device type</TableHead>
                  <TableHead className="text-white">Selected size</TableHead>
                  <TableHead className="text-white">Used storage</TableHead>
                  <TableHead className="text-white">Last 28 days</TableHead>
                  <TableHead className="text-white">Backup status</TableHead>
                  <TableHead className="text-white">Errors</TableHead>
                  <TableHead className="text-white">Last</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-600" />
                    </TableCell>
                     <TableCell>
                       {device.backupStatus === "CompletedWithErrors" && (
                         <AlertTriangle className="h-4 w-4 text-orange-500" />
                       )}
                       {device.backupStatus === "Failed" && (
                         <XCircle className="h-4 w-4 text-red-500" />
                       )}
                       {device.backupStatus === "Completed" && (
                         <CheckCircle className="h-4 w-4 text-green-500" />
                       )}
                       {device.backupStatus === "InProcess" && (
                         <Clock className="h-4 w-4 text-blue-500" />
                       )}
                     </TableCell>
                    <TableCell className="text-blue-400 underline cursor-pointer">
                      {device.deviceName}
                    </TableCell>
                    <TableCell className="text-white">{device.computerName}</TableCell>
                    <TableCell className="text-white">{device.customer}</TableCell>
                    <TableCell className="text-white flex items-center gap-2">
                      {getDeviceTypeIcon(device.deviceType)}
                      {device.deviceType}
                    </TableCell>
                     <TableCell className="text-white">{device.selectedSize.toFixed(1)} GB</TableCell>
                     <TableCell className="text-white">{device.usedStorage.toFixed(1)} GB</TableCell>
                    <TableCell>
                      <div className="flex gap-1 w-32">
                        {device.progressBars.map((bar, index) => (
                          <div
                            key={index}
                            className={`h-4 ${bar.color} rounded-sm`}
                            style={{ width: `${bar.width}%` }}
                          />
                        ))}
                      </div>
                    </TableCell>
                     <TableCell>
                       <Badge className={getStatusColor(device.backupStatus)}>
                         {device.backupStatus === 'CompletedWithErrors' ? 'Completed with errors' : 
                          device.backupStatus === 'InProcess' ? 'In process' : device.backupStatus}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-red-400">{device.errors}</TableCell>
                    <TableCell className="text-white">{device.lastBackup}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            1-{filteredDevices.length} of {filteredDevices.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white">
              50
            </Button>
          </div>
        </div>
              </>
            )}
          </main>
        </div>
      );
    };

export default BackupDetails;