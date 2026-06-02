import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppSelector } from '@/app/hooks';

export function AppShell() {
  const { token } = useAppSelector(state => state.auth);

  // For testing purposes during UI dev, we allow bypassing the token check if we want,
  // but let's stick to the secure approach. The Login page will mock a token.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-background/95">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
