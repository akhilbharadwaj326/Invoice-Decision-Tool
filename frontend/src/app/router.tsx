import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { InvoiceListPage } from '@/pages/InvoiceListPage';
import { InvoiceUploadPage } from '@/pages/InvoiceUploadPage';

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
      // Other protected routes will be added here
    ],
  },
  {
    path: '*',
    element: <div className="flex h-screen items-center justify-center">404 Not Found</div>,
  },
]);
