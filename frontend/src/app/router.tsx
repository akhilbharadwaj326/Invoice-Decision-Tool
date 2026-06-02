import { createBrowserRouter, Navigate } from 'react-router-dom';

const Dashboard = () => <div className="p-8"><h1>Dashboard Placeholder</h1></div>;
const Login = () => <div className="p-8"><h1>Login Placeholder</h1></div>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
