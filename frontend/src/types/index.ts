export interface Customer {
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

export interface BackupDevice {
  id: string;
  deviceName: string;
  computerName: string;
  customer: string;
  deviceType: "Workstation" | "Server" | "Documents" | "Not Installed";
  selectedSize: number;
  usedStorage: number;
  backupStatus:
    | "Completed"
    | "CompletedWithErrors"
    | "Failed"
    | "InProcess"
    | "No backups";
  errors: number;
  lastBackup: string;
  progressBars: { color: string; width: number }[];
}

export interface Device {
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

export interface Alert {
  id: string;
  type: "performance" | "security" | "system" | "disk" | "network";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
}

export interface Patch {
  id: string;
  deviceName: string;
  patchName: string;
  type: "security" | "feature" | "bugfix";
  status: "pending" | "installed" | "failed" | "scheduled";
  releaseDate: string;
  installDate?: string;
}

export interface NetworkDevice {
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

export interface NetworkEvent {
  id: string;
  deviceName: string;
  eventType:
    | "connection_lost"
    | "high_usage"
    | "firmware_update"
    | "client_connected"
    | "client_disconnected";
  severity: "info" | "warning" | "critical";
  timestamp: string;
  description: string;
  duration?: string;
}

export interface PatchData {
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

export interface DevicePatchStatus {
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

export interface AntivirusData {
  id: number;
  device_name: string;
  av_product_name: string;
  av_status: string;
  threat_count: number;
  last_update: string;
  last_scan: string;
}

export interface SentinelOneData {
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

export interface SecuritySummary {
  totalDevices: number;
  antivirusInstalled: number;
  sentinelOneInstalled: number;
  protectedDevices: number;
  unprotectedDevices: number;
  activeThreats: number;
}

export interface TicketData {
  id: string;
  subject: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  customer: string;
  branch: string;
  user: string;
  created: string;
  updated: string;
  category: string;
  description: string;
}

export interface BranchTicketStats {
  branch: string;
  total: number;
  open: number;
  resolved: number;
}
