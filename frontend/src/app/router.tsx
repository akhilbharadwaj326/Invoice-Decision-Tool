import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { InvoiceListPage } from '@/pages/InvoiceListPage';
import { InvoiceUploadPage } from '@/pages/InvoiceUploadPage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RulesPage } from '@/pages/admin/RulesPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'invoices',
        element: <InvoiceListPage />,
      },
      {
        path: 'invoices/upload',
        element: <InvoiceUploadPage />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetailPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'admin/users',
        element: <UsersPage />,
      },
      {
        path: 'admin/rules',
        element: <RulesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div className="flex h-screen items-center justify-center">404 Not Found</div>,
  },
]);
