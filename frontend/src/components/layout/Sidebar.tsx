import { NavLink } from 'react-router-dom';
import { Home, FileText, Upload, Settings, Users, FileBarChart2 } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';

export function Sidebar() {
  const { role } = useAppSelector(state => state.auth);

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200/60 flex flex-col h-screen shadow-[4px_0_24px_rgba(0,0,0,0.01)] relative z-20">
      <div className="h-20 px-8 border-b border-slate-100 flex items-center shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <FileText className="w-5 h-5" strokeWidth={2.5} />
          </div>
          InvoiceTool
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Main Menu</p>
        <nav className="space-y-1.5">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            {({ isActive }) => (
              <>
                <Home size={18} strokeWidth={isActive ? 2.5 : 2} /> Dashboard
              </>
            )}
          </NavLink>
          <NavLink to="/invoices" end className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            {({ isActive }) => (
              <>
                <FileText size={18} strokeWidth={isActive ? 2.5 : 2} /> Invoices
              </>
            )}
          </NavLink>
          {['REVIEWER', 'APPROVER', 'ADMIN'].includes(role || '') && (
            <NavLink to="/invoices/upload" className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              {({ isActive }) => (
                <>
                  <Upload size={18} strokeWidth={isActive ? 2.5 : 2} /> Upload
                </>
              )}
            </NavLink>
          )}
          <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            {({ isActive }) => (
              <>
                <FileBarChart2 size={18} strokeWidth={isActive ? 2.5 : 2} /> Reports
              </>
            )}
          </NavLink>
          
          {role === 'ADMIN' && (
            <>
              <div className="pt-8 pb-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">Administration</p>
              </div>
              <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                {({ isActive }) => (
                  <>
                    <Users size={18} strokeWidth={isActive ? 2.5 : 2} /> Users
                  </>
                )}
              </NavLink>
              <NavLink to="/admin/rules" className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                {({ isActive }) => (
                  <>
                    <Settings size={18} strokeWidth={isActive ? 2.5 : 2} /> Risk Rules
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
