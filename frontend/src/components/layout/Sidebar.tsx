import { NavLink } from 'react-router-dom';
import { Home, FileText, Upload, Settings, Users, FileBarChart2 } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';

export function Sidebar() {
  const { role } = useAppSelector(state => state.auth);

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-blue-600" />
          InvoiceTool
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
          <Home size={18} /> Dashboard
        </NavLink>
        <NavLink to="/invoices" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
          <FileText size={18} /> Invoices
        </NavLink>
        {['REVIEWER', 'APPROVER', 'ADMIN'].includes(role || '') && (
          <NavLink to="/invoices/upload" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Upload size={18} /> Upload
          </NavLink>
        )}
        <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
          <FileBarChart2 size={18} /> Reports
        </NavLink>
        
        {role === 'ADMIN' && (
          <>
            <div className="pt-6 pb-2 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>
            </div>
            <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Users size={18} /> Users
            </NavLink>
            <NavLink to="/admin/rules" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Settings size={18} /> Risk Rules
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
