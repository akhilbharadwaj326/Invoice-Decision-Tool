import { UserPlus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

// Mock Data
const mockUsers = [
  { id: 1, name: "Admin User", email: "admin@invoicetool.com", role: "ADMIN", status: "ACTIVE" },
  { id: 2, name: "Jane Doe", email: "jane@company.com", role: "REVIEWER", status: "ACTIVE" },
  { id: 3, name: "Bob Smith", email: "bob@company.com", role: "APPROVER", status: "ACTIVE" },
  { id: 4, name: "Alice Johnson", email: "alice@company.com", role: "VIEWER", status: "INACTIVE" },
];

export function UsersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">User Management</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage user accounts and role-based access.</p>
        </div>
        <Button className="font-semibold shadow-md shadow-primary/20">
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card className="border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Name</TableHead>
              <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Email</TableHead>
              <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Role</TableHead>
              <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12">Status</TableHead>
              <TableHead className="text-slate-500 font-bold tracking-wide text-xs uppercase h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors border-slate-100/60">
                <TableCell className="font-bold text-slate-900 py-4">{user.name}</TableCell>
                <TableCell className="text-slate-500 font-medium py-4">{user.email}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={`font-bold ${
                    user.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 
                    user.role === 'REVIEWER' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
