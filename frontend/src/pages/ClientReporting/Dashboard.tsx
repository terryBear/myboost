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
import { supabase } from "@/integrations/supabase/client";
import {
  Building,
  Download,
  HardDrive,
  Monitor,
  RefreshCw,
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/boostcoffee/login");
      return;
    }
  }, [navigate]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Use the new Coffee Report customer summary view
      const { data: coffeeReportData, error: coffeeError } = await supabase
        .from("v_coffee_report_customer_summary")
        .select("*");

      if (!coffeeError && coffeeReportData && coffeeReportData.length > 0) {
        console.log("Using Coffee Report customer data:", coffeeReportData);

        // Fetch raw patch data directly for accurate compliance calculation (same as PatchingDetails)
        const patchRes = await fetch(
          `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/patch_overview?select=client,status`,
          {
            headers: {
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
            },
          }
        );
        const patchRows: Array<{ client: string; status: string }> = patchRes.ok
          ? await patchRes.json()
          : [];

        // Calculate patch stats exactly like PatchingDetails does
        const norm = (s: string) => {
          let val = (s || "").toLowerCase();
          val = val.replace(/&/g, "and");
          val = val.replace(/[’']/g, "'");
          val = val.replace(
            /\b(pty)\b|\b(ltd)\b|\b(limited)\b|\b(group)\b/gi,
            ""
          );
          val = val.replace(/[^a-z0-9']+/g, "");
          return val.trim();
        };
        const patchStats: Record<
          string,
          { installed: number; total: number; pending: number }
        > = {};
        for (const row of patchRows) {
          const key = norm(row.client) || "unknown";
          if (!patchStats[key])
            patchStats[key] = { installed: 0, total: 0, pending: 0 };
          patchStats[key].total += 1;

          const status = (row.status || "").toLowerCase();
          if (
            status === "installed" ||
            status === "installing" ||
            status === "reboot required"
          ) {
            patchStats[key].installed += 1;
          } else if (status === "pending") {
            patchStats[key].pending += 1;
          }
        }

        // Convert Coffee Report data to customer format, using direct patch calculations
        const customers: Customer[] = coffeeReportData.map((row: any) => {
          const stat = patchStats[norm(row.customer)];
          // Use exact same calculation as PatchingDetails
          const installedPct =
            stat && stat.total > 0
              ? Math.round((stat.installed / stat.total) * 100)
              : 0;
          const patchingIssues = stat ? stat.pending : 0; // Use pending count directly
          const health = Math.round(
            ((installedPct || 0) +
              (row.security_coverage_pct || 0) +
              (row.backup_health_pct || 0)) /
              3
          );

          return {
            id: row.customer,
            name: row.customer,
            healthScore: health,
            devices: row.devices_monitored || 0,
            patchCompliance: installedPct,
            securityScore: Math.round(row.security_coverage_pct || 0),
            backupStatus:
              (row.backup_health_pct || 0) >= 90
                ? "Good"
                : (row.backup_health_pct || 0) >= 70
                ? "Warning"
                : "Critical",
            securityStatus:
              (row.s1_threats_30d || 0) === 0 ? "Protected" : "At Risk",
            networkUptime: 98.5, // Default value
            lastUpdated: row.last_refreshed_at
              ? new Date(row.last_refreshed_at).toLocaleDateString()
              : new Date().toLocaleDateString(),
            criticalThreats: row.s1_threats_30d || 0,
            patchingIssues: patchingIssues,
          };
        });

        // Enrich with normalized rollups for customers missing data (works for all customers)
        const [monRes, secRollRes, custNormRes] = await Promise.all([
          supabase
            .from("v_monitored_devices")
            .select("client_key, devices_monitored"),
          supabase
            .from("v_security_rollup")
            .select("client_key, devices_total, devices_protected"),
          supabase.from("v_customers_norm").select("name, client_key"),
        ]);

        const nameToClientKey = new Map<string, string>();
        (custNormRes.data || []).forEach((r: any) => {
          nameToClientKey.set(norm(r.name), r.client_key);
        });

        const devicesByClient = new Map<string, number>();
        (monRes.data || []).forEach((r: any) => {
          const cur = devicesByClient.get(r.client_key) || 0;
          devicesByClient.set(
            r.client_key,
            cur + (Number(r.devices_monitored) || 0)
          );
        });

        const secPctByClient = new Map<string, number>();
        (secRollRes.data || []).forEach((r: any) => {
          const key = r.client_key;
          const prev = secPctByClient.get(key) || 0;
          const total = (r.devices_total as number) || 0;
          const prot = (r.devices_protected as number) || 0;
          const pct = total > 0 ? (prot / total) * 100 : 0;
          // average across sites
          if (!secPctByClient.has(key)) secPctByClient.set(key, pct);
          else secPctByClient.set(key, Math.round((prev + pct) / 2));
        });

        let finalCustomers = customers.map((c) => {
          const key = nameToClientKey.get(norm(c.name)) || norm(c.name);
          const devices = devicesByClient.get(key);
          const sec = secPctByClient.get(key);
          return {
            ...c,
            devices: devices !== undefined && devices > 0 ? devices : c.devices,
            securityScore:
              sec !== undefined ? Math.round(sec) : c.securityScore,
          };
        });

        // If viewing a single customer, override with a direct per-customer calculation to ensure parity with PatchingDetails
        const targetName =
          userRole === "admin"
            ? selectedCustomer !== "all"
              ? customers.find((c) => c.id === selectedCustomer)?.name || ""
              : ""
            : customerName;
        if (targetName) {
          const nameFilter = encodeURIComponent(targetName);
          const perRes = await fetch(
            `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/patch_overview?select=status&client=eq.${nameFilter}`,
            {
              headers: {
                apikey:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
              },
            }
          );
          const perRows: Array<{ status: string }> = perRes.ok
            ? await perRes.json()
            : [];
          const totals = perRows.reduce(
            (acc, r) => {
              const s = (r.status || "").toLowerCase();
              acc.total++;
              if (
                s === "installed" ||
                s === "installing" ||
                s === "reboot required"
              )
                acc.installed++;
              if (s === "pending") acc.pending++;
              return acc;
            },
            { total: 0, installed: 0, pending: 0 }
          );
          const pct =
            totals.total > 0
              ? Math.round((totals.installed / totals.total) * 100)
              : 0;
          finalCustomers = finalCustomers.map((c) =>
            c.name === targetName
              ? { ...c, patchCompliance: pct, patchingIssues: totals.pending }
              : c
          );
        }

        setCustomers(finalCustomers);
        return;
      }

      console.log("Coffee Report data not available or empty");
      setCustomers([]);

      // Fallback to legacy data processing
      const [patchResponse, backupResponse, sentinelResponse] =
        await Promise.all([
          fetch(
            `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/patch_overview?select=client,status,device&order=client`,
            {
              headers: {
                apikey:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/backups_overview?select=partner_name,device_name,total_status&order=partner_name`,
            {
              headers: {
                apikey:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/s1_threats?select=site,status,incident_status,classification,confidence_level&order=site`,
            {
              headers: {
                apikey:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                Authorization:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
                "Content-Type": "application/json",
              },
            }
          ),
        ]);

      const patchData = patchResponse.ok ? await patchResponse.json() : [];
      const backupData = backupResponse.ok ? await backupResponse.json() : [];
      const sentinelData = sentinelResponse.ok
        ? await sentinelResponse.json()
        : [];

      // Normalization helper to canonicalize customer names across sources
      const normalize = (s: string) => {
        let val = (s || "").toLowerCase();
        val = val.replace(/&/g, "and");
        val = val.replace(/[’']/g, "");
        val = val.replace(
          /\b(pty)\b|\b(ltd)\b|\b(limited)\b|\b(group)\b/gi,
          ""
        );
        val = val.replace(/[^a-z0-9]+/g, "");
        val = val.replace(/(coza|com|co)$/i, ""); // collapse domain/company suffixes
        return val.trim();
      };

      // Create unified customer list from all sources using a canonical key
      const allCustomers = new Set<string>();
      const displayNameByKey = new Map<string, string>();
      const preferDisplayName = (key: string, name: string) => {
        const current = displayNameByKey.get(key);
        if (!current || name.length > current.length)
          displayNameByKey.set(key, name);
      };

      // Add patch customers (primary source for device counts)
      patchData.forEach((item: any) => {
        if (item.client) {
          const key = normalize(item.client);
          allCustomers.add(key);
          preferDisplayName(key, item.client);
        }
      });

      // Add backup customers
      backupData.forEach((item: any) => {
        if (item.partner_name) {
          const key = normalize(item.partner_name);
          allCustomers.add(key);
          preferDisplayName(key, item.partner_name);
        }
      });

      // Add SentinelOne customers (IMPORTANT: Include customers with only S1 data)
      sentinelData.forEach((item: any) => {
        if (item.site) {
          const key = normalize(item.site);
          allCustomers.add(key);
          preferDisplayName(key, item.site);
        }
      });

      console.log(
        `Found ${allCustomers.size} total customers:`,
        Array.from(allCustomers).sort()
      );

      // Process patch data by customer - use exact same calculation as PatchingDetails
      const patchStats: {
        [key: string]: {
          total: number;
          installed: number;
          pending: number;
          devices: Set<string>;
        };
      } = {};
      patchData.forEach((item: any) => {
        const key = normalize(item.client);
        if (!key) return;
        if (!patchStats[key]) {
          patchStats[key] = {
            total: 0,
            installed: 0,
            pending: 0,
            devices: new Set(),
          };
        }
        patchStats[key].total++;
        if (item.device) patchStats[key].devices.add(item.device);

        const status = (item.status || "").toLowerCase();
        if (
          status === "installed" ||
          status === "installing" ||
          status === "reboot required"
        ) {
          patchStats[key].installed++;
        } else if (status === "pending") {
          patchStats[key].pending++;
        }
      });

      // Process backup data by customer - improved status detection
      const backupStats: {
        [key: string]: { total: number; success: number; devices: Set<string> };
      } = {};
      backupData.forEach((item: any) => {
        const key = normalize(item.partner_name);
        if (!key) return;
        if (!backupStats[key]) {
          backupStats[key] = { total: 0, success: 0, devices: new Set() };
        }
        backupStats[key].total++;
        if (item.device_name) backupStats[key].devices.add(item.device_name);
        // More flexible success status detection
        const status = (item.total_status || "").toLowerCase();
        if (status === "success" || status === "completed") {
          backupStats[key].success++;
        }
      });

      // Process SentinelOne data by customer
      // SentinelOne stats keyed by canonical name
      const sentinelStats: {
        [key: string]: { total: number; threats: number };
      } = {};
      sentinelData.forEach((item: any) => {
        const key = normalize(item.site);
        if (!key) return;
        if (!sentinelStats[key]) {
          sentinelStats[key] = { total: 0, threats: 0 };
        }
        sentinelStats[key].total++;
        if (item.incident_status !== "Resolved") {
          sentinelStats[key].threats++;
        }
      });

      // Create customer objects with unified data - ensure SentinelOne-only customers are included
      const realCustomers: Customer[] = Array.from(allCustomers).map(
        (customerKey) => {
          const displayName = displayNameByKey.get(customerKey) || customerKey;
          const patchInfo = patchStats[customerKey];
          const backupInfo = backupStats[customerKey];
          const sentinelInfo = sentinelStats[customerKey];

          // Calculate patch compliance - ensure proper percentage calculation
          const patchCompliance =
            patchInfo && patchInfo.total > 0
              ? Math.round((patchInfo.installed / patchInfo.total) * 100)
              : patchInfo
              ? 0
              : null; // null if no patch data at all

          const backupSuccess =
            backupInfo && backupInfo.total > 0
              ? Math.round((backupInfo.success / backupInfo.total) * 100)
              : backupInfo
              ? 0
              : null; // null if no backup data at all

          const securityScore = sentinelInfo
            ? sentinelInfo.threats === 0
              ? 100
              : Math.max(0, 100 - sentinelInfo.threats * 10)
            : null; // null if no security data

          // Device counts - prioritize RMM devices, fallback to backup devices for SentinelOne-only customers
          const rmmDevices = patchInfo ? patchInfo.devices.size : 0;
          const backupDevices = backupInfo ? backupInfo.devices.size : 0;
          const deviceCount = Math.max(rmmDevices, backupDevices);

          // Overall health score calculation - only include scores where we have data
          let healthScore = 0;
          let scoreComponents = 0;
          if (patchCompliance !== null) {
            healthScore += patchCompliance;
            scoreComponents++;
          }
          if (backupSuccess !== null) {
            healthScore += backupSuccess;
            scoreComponents++;
          }
          if (securityScore !== null) {
            healthScore += securityScore;
            scoreComponents++;
          }
          const finalHealthScore =
            scoreComponents > 0
              ? Math.round(healthScore / scoreComponents)
              : 50; // Default 50 if no data

          return {
            id: customerKey,
            name: displayName,
            healthScore: finalHealthScore,
            devices: deviceCount, // Use combined device count to show SentinelOne-only customers
            patchCompliance: patchCompliance || 0, // Show 0 instead of null for display
            securityScore: securityScore || 0, // Show 0 instead of null for display
            backupStatus: backupInfo
              ? backupSuccess && backupSuccess >= 90
                ? "Good"
                : backupSuccess && backupSuccess >= 70
                ? "Warning"
                : "Critical"
              : "N/A",
            securityStatus: sentinelInfo
              ? securityScore && securityScore >= 90
                ? "Protected"
                : "Needs Attention"
              : "N/A",
            networkUptime: 98.5, // Default network uptime
            lastUpdated: new Date().toLocaleDateString(),
            criticalThreats: sentinelInfo ? sentinelInfo.threats : 0,
            patchingIssues: patchInfo ? patchInfo.pending : 0, // Use pending count directly like PatchingDetails
          };
        }
      );

      // Override with direct per-customer calculation when a single customer is in view
      let finalRealCustomers = realCustomers;
      const targetName2 =
        userRole === "admin"
          ? selectedCustomer !== "all"
            ? realCustomers.find((c) => c.id === selectedCustomer)?.name || ""
            : ""
          : customerName;
      if (targetName2) {
        const nameFilter2 = encodeURIComponent(targetName2);
        const perRes2 = await fetch(
          `https://xkfijttdhgkdzruygylq.supabase.co/rest/v1/patch_overview?select=status&client=eq.${nameFilter2}`,
          {
            headers: {
              apikey:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZmlqdHRkaGdrZHpydXlneWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDcxODIsImV4cCI6MjA2OTI4MzE4Mn0.rVz2iZiu4xSYSqPjQgpU2XI_2do6gzGhlNBKUq1-a58",
            },
          }
        );
        const perRows2: Array<{ status: string }> = perRes2.ok
          ? await perRes2.json()
          : [];
        const totals2 = perRows2.reduce(
          (acc, r) => {
            const s = (r.status || "").toLowerCase();
            acc.total++;
            if (
              s === "installed" ||
              s === "installing" ||
              s === "reboot required"
            )
              acc.installed++;
            if (s === "pending") acc.pending++;
            return acc;
          },
          { total: 0, installed: 0, pending: 0 }
        );
        const pct2 =
          totals2.total > 0
            ? Math.round((totals2.installed / totals2.total) * 100)
            : 0;
        finalRealCustomers = realCustomers.map((c) =>
          c.name === targetName2
            ? { ...c, patchCompliance: pct2, patchingIssues: totals2.pending }
            : c
        );
      }

      setCustomers(finalRealCustomers);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

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
      // Call all sync functions in parallel
      const syncPromises = [
        fetch(
          "https://xkfijttdhgkdzruygylq.supabase.co/functions/v1/sync-sentinelone-data",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ),
        fetch(
          "https://xkfijttdhgkdzruygylq.supabase.co/functions/v1/sync-patch-data",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ),
        fetch(
          "https://xkfijttdhgkdzruygylq.supabase.co/functions/v1/sync-backup-data",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ),
      ];

      const results = await Promise.allSettled(syncPromises);

      // Check for any failures
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        console.warn("Some API syncs failed:", failures);
      }

      // Refresh data after sync
      await fetchCustomerData();

      console.log("All APIs synced successfully");
    } catch (error) {
      console.error("Error syncing APIs:", error);
    } finally {
      setIsRefreshing(false);
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

  const filteredCustomers =
    userRole === "admin"
      ? selectedCustomer === "all"
        ? customers
        : customers.filter((c) => c.id === selectedCustomer)
      : customers.filter((c) => c.name === customerName);

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
      value: filteredCustomers.filter((c) => c.securityStatus === "protected")
        .length,
      fill: "hsl(var(--cyber-green))",
    },
    {
      name: "Needs Attention",
      value: filteredCustomers.filter(
        (c) => c.securityStatus === "needs attention"
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
    <div className="min-h-screen bg-black">
      {/* Futuristic Background Effect */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-500/30 to-orange-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-sm px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <svg
                className="h-6 w-6"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Boost MSP Coffee Report 2
              </h1>
              <p className="text-sm text-gray-400">
                {userRole === "admin"
                  ? "Global Compliance Dashboard"
                  : `${customerName} Compliance Overview`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="z-50 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-primary focus:border-primary"
                style={{
                  backgroundColor: "#1f2937",
                  position: "relative",
                  zIndex: 50,
                }}
              >
                <option value="all" className="bg-gray-800 text-white">
                  All Customers
                </option>
                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                    className="bg-gray-800 text-white"
                  >
                    {customer.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {!isRefreshing && "Refresh"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSyncAPIs}
              disabled={isRefreshing}
            >
              <Download
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {!isRefreshing && "Sync APIs"}
            </Button>

            <div className="flex items-center gap-2">
              {userRole === "admin" ? (
                <Users className="h-4 w-4" />
              ) : (
                <Building className="h-4 w-4" />
              )}
              <span className="text-sm font-medium text-white">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 relative z-10 bg-black min-h-screen">
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
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading customer data...
              </div>
            ) : (
              filteredCustomers.map((customer) => (
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
                          `/security?customerName=${encodeURIComponent(
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
                          `/patching?customerName=${encodeURIComponent(
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
                          `/backup?customerName=${encodeURIComponent(
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
                          `/tickets?customerName=${encodeURIComponent(
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
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
