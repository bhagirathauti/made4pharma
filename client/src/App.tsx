import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './DashboardLayout';
// Admin pages
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { StoreManagement } from './pages/admin/StoreManagement';
import { Reports as AdminReports } from './pages/admin/Reports';
import { SystemSettings } from './pages/admin/SystemSettings';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/admin/*" element={<DashboardLayout role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="stores" element={<StoreManagement />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          <Route path="/cashier/*" element={<DashboardLayout role="cashier" />} />
          <Route path="/owner/*" element={<DashboardLayout role="medical-owner" />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
