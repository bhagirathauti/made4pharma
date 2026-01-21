import React, { useState, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './components/DashboardSidebar';
import ShopProfileModal from './components/ui/ShopProfileModal';
import StoreProfilePage from './pages/owner/StoreProfile';
import { MedicalOwnerDashboard } from './pages/owner/MedicalOwnerDashboard';
import { Inventory as InventoryPage } from './pages/owner/Inventory';
import { CustomerContacts as CustomerContactsPage } from './pages/owner/CustomerContacts';
import { Bills as BillsPage } from './pages/owner/Bills';
import { StoreAnalytics as StoreAnalyticsPage } from './pages/owner/StoreAnalytics';
import { Cashiers } from './pages/owner/Cashiers';
import { Distributors } from './pages/owner/Distributors';

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
  const [shopProfileOpen, setShopProfileOpen] = useState(false);

  const PosWrapper = lazy(() => import('./pages/cashier/POS'));
  const CashierDashboard = lazy(() => import('./pages/cashier/Dashboard'));
  const SalesHistory = lazy(() => import('./pages/cashier/SalesHistory'));
  const ProductsPage = lazy(() => import('./pages/cashier/Products'));

  // initialize selectedTab from current location on mount
  React.useEffect(() => {
    setSelectedTab(pathToTabId(location.pathname));

    // If medical owner and they don't have a store assigned in localStorage, force shop profile
    try {
      if (role === 'medical-owner') {
        const sid = localStorage.getItem('storeId');
        if (!sid || sid === 'null') {
          setShopProfileOpen(true);
        }
      }
    } catch (err) {
      console.warn('Error checking storeId in localStorage', err);
    }
    // update selectedTab whenever location changes
  }, [location.pathname]);

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
      if (path.includes('/store-profile') || path.includes('/profile')) return 'profile';
      if (path.includes('/inventory')) return 'inventory';
      if (path.includes('/customers')) return 'customers';
      if (path.includes('/bills')) return 'bills';
      if (path.includes('/cashiers')) return 'cashiers';
      if (path.includes('/distributors')) return 'distributors';
      if (path.includes('/analytics') || path.includes('/store-analytics')) return 'analytics';
      return 'dashboard';
    }
    if (path.startsWith('/cashier')) {
      if (path.includes('/transactions')) return 'transactions';
      if (path.includes('/products')) return 'products';
      if (path.includes('/reports')) return 'reports';
      if (path.includes('/pos')) return 'pos';
      return 'dashboard';
    }
    return 'dashboard';
  };

  const handleNavigate = (path: string) => {
    // prevent navigation while shop profile modal is required
    if (shopProfileOpen) {
      return;
    }

    const tab = pathToTabId(path);
    console.log('[DashboardLayout] handleNavigate ->', { path, tab });
    setSelectedTab(tab);
    // keep URL in sync
    navigate(path);
  };

  const handleShopSaved = (store: { id: string; name: string }) => {
    // persist store info and close modal
    localStorage.setItem('storeId', store.id);
    if (store.name) localStorage.setItem('storeName', store.name);
    setShopProfileOpen(false);
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
    if (role === 'medical-owner') {
      switch (tabId) {
        case 'inventory':
          return '/owner/inventory';
        case 'cashiers':
          return '/owner/cashiers';
        case 'distributors':
          return '/owner/distributors';
        case 'customers':
          return '/owner/customers';
        case 'bills':
          return '/owner/bills';
        case 'analytics':
          return '/owner/analytics';
        case 'profile':
          return '/owner/store-profile';
        default:
          return '/owner/dashboard';
      }
    }
    // fallback
    return location.pathname;
  };

  const activePathForSidebar = location.pathname;

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
            <ShopProfileModal isOpen={shopProfileOpen} onClose={() => {}} onSaved={handleShopSaved} />
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
                {role === 'medical-owner' && (
                  <>
                    {selectedTab === 'dashboard' && <MedicalOwnerDashboard />}
                    {selectedTab === 'profile' && <StoreProfilePage />}
                    {selectedTab === 'inventory' && <InventoryPage />}
                      {selectedTab === 'cashiers' && <Cashiers />}
                      {selectedTab === 'distributors' && <Distributors />}
                    {selectedTab === 'customers' && <CustomerContactsPage />}
                    {selectedTab === 'bills' && <BillsPage />}
                    {selectedTab === 'analytics' && <StoreAnalyticsPage />}
                  </>
                )}
                {role === 'cashier' && (
                  <>
                    {selectedTab === 'dashboard' && (
                      <React.Suspense fallback={<div>Loading dashboard...</div>}>
                        <CashierDashboard />
                      </React.Suspense>
                    )}
                    {selectedTab === 'transactions' && (
                      <React.Suspense fallback={<div>Loading sales history...</div>}>
                        <SalesHistory />
                      </React.Suspense>
                    )}
                    {selectedTab === 'products' && (
                      <React.Suspense fallback={<div>Loading products...</div>}>
                        <ProductsPage />
                      </React.Suspense>
                    )}
                    {selectedTab === 'pos' && (
                      <React.Suspense fallback={<div>Loading POS...</div>}>
                        <PosWrapper />
                      </React.Suspense>
                    )}
                    {selectedTab !== 'pos' && selectedTab !== 'dashboard' && <p className="text-gray-600">Cashier workspace (select a tab)</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
