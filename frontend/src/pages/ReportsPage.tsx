import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, Clock, CheckCircle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const volumeData = [
  { name: 'Mon', invoices: 140, approved: 120 },
  { name: 'Tue', invoices: 270, approved: 250 },
  { name: 'Wed', invoices: 150, approved: 140 },
  { name: 'Thu', invoices: 320, approved: 290 },
  { name: 'Fri', invoices: 280, approved: 260 },
  { name: 'Sat', invoices: 120, approved: 115 },
  { name: 'Sun', invoices: 80,  approved: 75 },
];

export function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Analytics & Reports</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Detailed insights into your invoice processing.</p>
        </div>
        <Button className="font-semibold shadow-md shadow-primary/20">
          <Download className="mr-2 h-4 w-4" /> Export Report (PDF)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Average Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">12m 30s</div>
            <p className="text-xs font-semibold text-green-600 mt-1 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" /> -2m since last week
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Auto-Extraction Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">96.8%</div>
            <p className="text-xs font-semibold text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +1.2% since last week
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Total Volume</CardTitle>
            <BarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">1,360</div>
            <p className="text-xs font-medium text-slate-400 mt-1 flex items-center">
              Invoices processed this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Processing Volume Trends</CardTitle>
            <CardDescription>Total vs Approved invoices over the past week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="invoices" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="approved" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorApproved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Top Flagged Risk Rules</CardTitle>
            <CardDescription>Rules that triggered manual review most often.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {[
                { name: 'Amount Mismatch', count: 142, percentage: 65 },
                { name: 'Unregistered Vendor', count: 84, percentage: 40 },
                { name: 'Duplicate Invoice ID', count: 28, percentage: 15 },
                { name: 'Date Discrepancy', count: 12, percentage: 5 }
              ].map((rule) => (
                <div key={rule.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <span>{rule.name}</span>
                    <span className="text-slate-500 font-semibold">{rule.count} flags</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${rule.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
