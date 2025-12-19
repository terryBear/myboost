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
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  Mail,
  RefreshCw,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
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

interface TicketData {
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

interface BranchTicketStats {
  branch: string;
  total: number;
  open: number;
  resolved: number;
}

const TicketingDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock ticket data - all available tickets
  const allTickets: TicketData[] = [
    {
      id: "TK-001",
      subject: "Email server connectivity issues",
      priority: "High",
      status: "Open",
      customer: "Acme Corporation",
      branch: "Head Office",
      user: "john.doe@acme.com",
      created: "2024-01-15 09:30",
      updated: "2024-01-15 14:22",
      category: "Email",
      description: "Users unable to connect to Exchange server",
    },
    {
      id: "TK-002",
      subject: "VPN connection failing",
      priority: "Medium",
      status: "In Progress",
      customer: "TechStart Inc",
      branch: "Remote Office",
      user: "sarah.smith@techstart.com",
      created: "2024-01-14 16:45",
      updated: "2024-01-15 10:15",
      category: "Network",
      description: "Remote users cannot establish VPN connection",
    },
    {
      id: "TK-003",
      subject: "Printer driver installation",
      priority: "Low",
      status: "Resolved",
      customer: "Nando's Feitoria (Pty) Ltd",
      branch: "Store 5",
      user: "store5.manager@nandos.co.za",
      created: "2024-01-13 11:20",
      updated: "2024-01-14 09:30",
      category: "Hardware",
      description: "New printer requires driver installation on 3 workstations",
    },
    {
      id: "TK-004",
      subject: "Security incident - malware detection",
      priority: "Critical",
      status: "Open",
      customer: "Nando's Feitoria (Pty) Ltd",
      branch: "Manufacturing",
      user: "it.support@nandos.co.za",
      created: "2024-01-15 07:15",
      updated: "2024-01-15 08:45",
      category: "Security",
      description:
        "SentinelOne detected suspicious activity on workstation NF-WS-045",
    },
    {
      id: "TK-005",
      subject: "Backup job failure",
      priority: "High",
      status: "In Progress",
      customer: "Nando's Feitoria (Pty) Ltd",
      branch: "Main Office",
      user: "backup.admin@nandos.co.za",
      created: "2024-01-14 22:30",
      updated: "2024-01-15 08:00",
      category: "Backup",
      description: "Nightly backup failed for file server NF-FS-01",
    },
    {
      id: "TK-006",
      subject: "Network connectivity issues",
      priority: "Medium",
      status: "Open",
      customer: "Nando's Feitoria (Pty) Ltd",
      branch: "Head Office",
      user: "network@nandos.co.za",
      created: "2024-01-16 10:00",
      updated: "2024-01-16 11:30",
      category: "Network",
      description: "Intermittent network drops at head office",
    },
    {
      id: "TK-007",
      subject: "Email migration support",
      priority: "Low",
      status: "Resolved",
      customer: "Nando's Feitoria (Pty) Ltd",
      branch: "Remote Office",
      user: "admin@nandos.co.za",
      created: "2024-01-12 09:00",
      updated: "2024-01-13 16:00",
      category: "Email",
      description: "Assistance needed for email migration to new platform",
    },
  ];

  // Filter tickets by selected customer
  const tickets = selectedCustomer
    ? allTickets.filter((t) => t.customer === selectedCustomer)
    : allTickets;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleEmailTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      const subject = `Follow-up: ${ticket.subject} (${ticketId})`;
      const body = `Dear Support Team,\n\nI would like to follow up on ticket ${ticketId}:\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\n\nAdditional details:\n\n[Please add your comments here]\n\nBest regards`;

      window.location.href = `mailto:Techsupport@Myboost.co.za?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive text-destructive-foreground";
      case "High":
        return "bg-destructive/80 text-destructive-foreground";
      case "Medium":
        return "bg-warning text-warning-foreground";
      case "Low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-destructive text-destructive-foreground";
      case "In Progress":
        return "bg-warning text-warning-foreground";
      case "Resolved":
        return "bg-success text-success-foreground";
      case "Closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertTriangle className="h-4 w-4" />;
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      case "Resolved":
      case "Closed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  // Chart data preparation
  const ticketStatusData = [
    {
      name: "Open",
      value: tickets.filter((t) => t.status === "Open").length,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "In Progress",
      value: tickets.filter((t) => t.status === "In Progress").length,
      fill: "hsl(var(--warning))",
    },
    {
      name: "Resolved",
      value: tickets.filter((t) => t.status === "Resolved").length,
      fill: "hsl(var(--success))",
    },
    {
      name: "Closed",
      value: tickets.filter((t) => t.status === "Closed").length,
      fill: "hsl(var(--muted))",
    },
  ];

  const priorityData = [
    {
      name: "Critical",
      value: tickets.filter((t) => t.priority === "Critical").length,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "High",
      value: tickets.filter((t) => t.priority === "High").length,
      fill: "hsl(var(--destructive) / 0.8)",
    },
    {
      name: "Medium",
      value: tickets.filter((t) => t.priority === "Medium").length,
      fill: "hsl(var(--warning))",
    },
    {
      name: "Low",
      value: tickets.filter((t) => t.priority === "Low").length,
      fill: "hsl(var(--muted))",
    },
  ];

  const categoryData = tickets.reduce((acc: any[], ticket) => {
    const existing = acc.find((item) => item.name === ticket.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: ticket.category, value: 1 });
    }
    return acc;
  }, []);

  // Branch statistics
  const branchStats: BranchTicketStats[] = tickets.reduce(
    (acc: BranchTicketStats[], ticket) => {
      const existing = acc.find((item) => item.branch === ticket.branch);
      if (existing) {
        existing.total += 1;
        if (ticket.status === "Open" || ticket.status === "In Progress") {
          existing.open += 1;
        } else {
          existing.resolved += 1;
        }
      } else {
        acc.push({
          branch: ticket.branch,
          total: 1,
          open:
            ticket.status === "Open" || ticket.status === "In Progress" ? 1 : 0,
          resolved:
            ticket.status === "Resolved" || ticket.status === "Closed" ? 1 : 0,
        });
      }
      return acc;
    },
    []
  );

  const chartConfig = {
    open: { label: "Open", color: "hsl(var(--destructive))" },
    inProgress: { label: "In Progress", color: "hsl(var(--warning))" },
    resolved: { label: "Resolved", color: "hsl(var(--success))" },
    closed: { label: "Closed", color: "hsl(var(--muted))" },
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
              <h1 className="text-xl font-bold">
                Ticketing System Integration
              </h1>
              <p className="text-sm text-muted-foreground">
                Support ticket overview and management
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
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                (window.location.href =
                  "mailto:Techsupport@Myboost.co.za?subject=New Support Request")
              }
            >
              <Mail className="h-4 w-4 mr-2" />
              New Ticket
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
              <CardTitle className="text-sm font-medium">
                Total Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs text-muted-foreground">
                Active support requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Tickets
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter((t) => t.status === "Open").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Issues
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {tickets.filter((t) => t.priority === "Critical").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Immediate action needed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolution Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (tickets.filter(
                    (t) => t.status === "Resolved" || t.status === "Closed"
                  ).length /
                    tickets.length) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Ticket Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ticketStatusData.map((entry, index) => (
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
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
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
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Bar
                      dataKey="value"
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

        {/* Branch Analytics & Tickets List */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Branch Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Branch Ticket Volume</CardTitle>
              <CardDescription>
                Identify locations generating highest ticket volume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branchStats.map((branch) => (
                <div key={branch.branch} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {branch.branch}
                      </span>
                    </div>
                    <Badge variant="outline">{branch.total} total</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                      {branch.open} open
                    </Badge>
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                      {branch.resolved} resolved
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Tickets */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>
                Click ticket ID to email support directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.slice(0, 8).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-semibold text-primary hover:underline"
                          onClick={() => handleEmailTicket(ticket.id)}
                        >
                          {ticket.id}
                        </Button>
                        <Badge
                          className={getPriorityColor(ticket.priority)}
                          variant="secondary"
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge
                          className={getStatusColor(ticket.status)}
                          variant="secondary"
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(ticket.status)}
                            {ticket.status}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{ticket.customer}</span>
                        <span>•</span>
                        <span>{ticket.branch}</span>
                        <span>•</span>
                        <span>{ticket.user}</span>
                        <span>•</span>
                        <span>{ticket.created}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailTicket(ticket.id)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TicketingDetails;
