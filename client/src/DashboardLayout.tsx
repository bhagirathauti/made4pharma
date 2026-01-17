import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './components/DashboardSidebar';

// Admin pages (rendered via internal tabs)
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { StoreManagement } from './pages/admin/StoreManagement';
import { Reports as AdminReports } from './pages/admin/Reports';
import { SystemSettings } from './pages/admin/SystemSettings';

// Owner pages - will be created later
// import { Dashboard as OwnerDashboard } from './pages/owner/Dashboard';

// Cashier pages - will be created later
// import { Dashboard as CashierDashboard } from './pages/cashier/Dashboard';

interface DashboardLayoutProps {
  role: 'admin' | 'medical-owner' | 'cashier';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');

  // initialize selectedTab from current location on mount
  React.useEffect(() => {
    setSelectedTab(pathToTabId(location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('storeId');
    localStorage.removeItem('storeName');
    
    // Redirect to login page
    navigate('/');
  };

  // Map sidebar paths to tab ids so we can keep using the existing Sidebar API
  const pathToTabId = (path: string) => {
    if (path.startsWith('/admin')) {
      if (path.includes('/users')) return 'users';
      if (path.includes('/stores')) return 'stores';
      if (path.includes('/reports')) return 'reports';
      if (path.includes('/settings')) return 'settings';
      return 'dashboard';
    }
    if (path.startsWith('/owner')) {
      if (path.includes('/inventory')) return 'inventory';
      if (path.includes('/sales')) return 'sales';
      if (path.includes('/staff')) return 'staff';
      if (path.includes('/reports')) return 'reports';
      return 'dashboard';
    }
    if (path.startsWith('/cashier')) {
      if (path.includes('/transactions')) return 'transactions';
      if (path.includes('/products')) return 'products';
      if (path.includes('/reports')) return 'reports';
      return 'pos';
    }
    return 'dashboard';
  };

  const handleNavigate = (path: string) => {
    const tab = pathToTabId(path);
    console.log('[DashboardLayout] handleNavigate ->', { path, tab });
    setSelectedTab(tab);
    // optionally keep URL in sync by uncommenting the next line
    // navigate(path);
  };

  // make sidebar highlight follow selectedTab (keeps UI consistent even without URL changes)
  const tabIdToPath = (tabId: string) => {
    if (role === 'admin') {
      switch (tabId) {
        case 'users':
          return '/admin/users';
        case 'stores':
          return '/admin/stores';
        case 'reports':
          return '/admin/reports';
        case 'settings':
          return '/admin/settings';
        default:
          return '/admin/dashboard';
      }
    }
    // fallback
    return location.pathname;
  };

  const activePathForSidebar = tabIdToPath(selectedTab) || location.pathname;

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar
        role={role}
        currentPath={activePathForSidebar}
        collapsed={sidebarCollapsed}
        onNavigate={handleNavigate}
        onCollapse={setSidebarCollapsed}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Tab-based rendering: render components based on `selectedTab` */}
            <div className="mb-4 text-sm text-gray-500">Active tab: <strong className="text-gray-800">{selectedTab}</strong></div>
            {role === 'admin' && (
              <div>
                {selectedTab === 'dashboard' && <AdminDashboard />}
                {selectedTab === 'users' && <UserManagement />}
                {selectedTab === 'stores' && <StoreManagement />}
                {selectedTab === 'reports' && <AdminReports />}
                {selectedTab === 'settings' && <SystemSettings />}
              </div>
            )}
            {role !== 'admin' && (
              <div>
                <p className="text-gray-600">{`No tab-renderer implemented for role: ${role}`}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
