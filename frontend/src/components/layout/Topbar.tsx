import { LogOut, Settings } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-10">
      <div className="flex-1"></div>
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-slate-900">{user?.name || 'Admin User'}</span>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{role || 'ADMIN'}</span>
        </div>
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-extrabold text-sm shadow-inner ring-1 ring-primary/20">
          {user?.name ? user.name.charAt(0) : 'A'}
        </div>
        <div className="w-px h-8 bg-slate-200 mx-2"></div>
        <Link 
          to="/settings"
          className="p-2.5 text-slate-400 hover:text-primary transition-all rounded-xl hover:bg-primary/5"
          title="Settings"
        >
          <Settings size={18} strokeWidth={2.5} />
        </Link>
        <button 
          onClick={handleLogout}
          className="p-2.5 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
          title="Logout"
        >
          <LogOut size={18} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
