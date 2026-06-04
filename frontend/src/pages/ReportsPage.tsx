import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, TrendingUp, Clock, CheckCircle, BarChart3, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetDashboardStatsQuery, useLazyExportCsvQuery } from "@/features/api/adminApi";
import { useGetInvoicesQuery } from "@/features/api/invoicesApi";

// Colors for charts
const PIE_COLORS: Record<string, string> = {
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  UNDER_REVIEW: "#f59e0b",
  PENDING: "#94a3b8",
  ON_HOLD: "#8b5cf6",
  EXTRACTED: "#3b82f6",
  PROCESSING: "#06b6d4",
};

export function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined);
  const { data: invoicesData } = useGetInvoicesQuery({ page_size: 100 });
  const [triggerExport] = useLazyExportCsvQuery();

  // Build status distribution for pie chart
  const allInvoices = invoicesData?.items || [];
  const statusCounts: Record<string, number> = {};
  allInvoices.forEach((inv: any) => {
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
  });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Build monthly trend from real invoices (grouped by day)
  const trendMap: Record<string, { invoices: number; approved: number }> = {};
  allInvoices.forEach((inv: any) => {
    const day = new Date(inv.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
    if (!trendMap[day]) trendMap[day] = { invoices: 0, approved: 0 };
    trendMap[day].invoices++;
    if (inv.status === "APPROVED") trendMap[day].approved++;
  });
  const trendData = Object.entries(trendMap)
    .map(([name, v]) => ({ name, ...v }))
    .slice(-7);

  const handleExportCsv = async () => {
    try {
      const result = await triggerExport(undefined);
      if (result.data) {
        const blob = new Blob([result.data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const approvalRate = stats ? Math.round(stats.approval_rate * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Analytics & Reports</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Real-time insights from your invoice database.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white font-semibold text-slate-700" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button className="font-semibold shadow-md shadow-primary/20" onClick={handleExportPdf}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Total Invoices</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {statsLoading ? "..." : stats?.total_invoices ?? 0}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {statsLoading ? "..." : `${approvalRate}%`}
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${approvalRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {statsLoading ? "..." : stats?.pending_review ?? 0}
            </div>
            <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Needs attention
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {statsLoading ? "..." : stats?.high_risk ?? 0}
            </div>
            <p className="text-xs font-medium text-red-600 mt-1">Flagged for review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend Chart */}
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Invoice Volume Trend</CardTitle>
            <CardDescription>Total vs Approved invoices over recent days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-2">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dx={-10} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="invoices" name="Total" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  No data available for trend chart.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of all invoices by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-2">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as string] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name ? name.toString().replace("_", " ") : ""]} />
                    <Legend formatter={(value) => value.toString().replace("_", " ")} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  No invoice data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Table */}
      <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Current invoice counts by status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Badge className="mb-2" style={{
                  backgroundColor: `${PIE_COLORS[status]}20`,
                  color: PIE_COLORS[status] || "#94a3b8",
                  border: "0"
                }}>
                  {status.replace("_", " ")}
                </Badge>
                <span className="text-2xl font-extrabold text-slate-900">{count}</span>
              </div>
            ))}
            {pieData.length === 0 && (
              <div className="col-span-4 text-center text-slate-400 py-8 font-medium">No data available.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
