import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', invoices: 14 },
  { name: 'Tue', invoices: 27 },
  { name: 'Wed', invoices: 15 },
  { name: 'Thu', invoices: 32 },
  { name: 'Fri', invoices: 28 },
  { name: 'Sat', invoices: 12 },
  { name: 'Sun', invoices: 8 },
];

export function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Overview of your invoice processing workflow.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Total Invoices</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">1,284</div>
            <p className="text-xs font-semibold text-green-600 mt-1 flex items-center">
              +12% <span className="text-slate-400 font-medium ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Pending Review</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">42</div>
            <p className="text-xs font-medium text-slate-400 mt-1">Requires manual attention</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Auto-Approved</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">84%</div>
            <p className="text-xs font-semibold text-green-600 mt-1 flex items-center">
              +2.4% <span className="text-slate-400 font-medium ml-1">approval rate this week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">High Risk</CardTitle>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-600">7</div>
            <p className="text-xs font-medium text-slate-400 mt-1">Blocked by AI risk rules</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="font-bold text-lg text-slate-900">Invoices Processed</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="invoices" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border border-slate-100 shadow-sm shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="font-bold text-lg text-slate-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 ${
                    i === 2 ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1 truncate pr-4">
                    <p className="text-sm font-bold text-slate-900 truncate">IDT-2026-06-{String(i * 123).padStart(4, '0')}</p>
                    <p className="text-[13px] font-medium text-slate-500 truncate">
                      {i === 2 ? 'Flagged for review (Amount Mismatch)' : 'Automatically extracted & approved'}
                    </p>
                  </div>
                  <div className="ml-auto font-semibold text-[13px] text-slate-400 shrink-0">
                    {i * 12}m ago
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
