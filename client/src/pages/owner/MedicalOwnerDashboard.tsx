import type { FC } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { Button, Table } from '../../components/ui';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string, opts: any = {}) => {
  const token = localStorage.getItem('token');
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...opts }).then((r) => r.json());
};

export const MedicalOwnerDashboard: FC = () => {
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [todaysSales, setTodaysSales] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockItemsList, setLowStockItemsList] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, sRes, staffRes, salesRes] = await Promise.all([
        api('/api/products'),
        api('/api/sales?recent=true'),
        api('/api/users/cashiers'),
        api('/api/sales?limit=5'),
      ]);

      if (pRes && pRes.success) {
        const products = pRes.data.products || [];
        setTotalProducts(products.length);
        const lowItems = products.filter((x: any) => typeof x.quantity === 'number' ? x.quantity <= (x.reorderLevel ?? 10) : false);
        setLowStockCount(lowItems.length);
        setLowStockItemsList(lowItems);
      }

      if (sRes && sRes.success) {
        // sRes could be structured; compute today's sales total
        const sales = sRes.data?.sales || [];
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        const todays = sales.filter((s: any) => s.createdAt >= start && s.createdAt <= end);
        const total = todays.reduce((acc: number, it: any) => acc + (Number(it.netAmount || it.totalAmount || 0) || 0), 0);
        setTodaysSales(total);
      }

      if (staffRes && staffRes.success) {
        setStaffCount((staffRes.data && staffRes.data.users && staffRes.data.users.length) || 0);
      }

      if (salesRes && salesRes.success) {
        setRecentSales(salesRes.data?.sales || []);
      }
    } catch (e) {
      console.error('dashboard fetchAll error', e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5000);
    return () => clearInterval(t);
  }, [fetchAll]);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Store Dashboard</h1>
          <p className="text-sm text-gray-500">Live overview of your store activity</p>
        </div>
        <div>
          <Button onClick={() => fetchAll()}>Refresh</Button>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Products</p>
          <div className="mt-2 text-2xl font-semibold">{totalProducts ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Today's Sales</p>
          <div className="mt-2 text-2xl font-semibold">{todaysSales != null ? `₹${todaysSales.toFixed(2)}` : '—'}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Staff Members</p>
          <div className="mt-2 text-2xl font-semibold">{staffCount ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <div className="mt-2 text-2xl font-semibold">{lowStockCount ?? '—'}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Low Stock Items</h2>
          <Table
            columns={[
              { id: 'name', header: 'Product', accessor: (r: any) => r.name },
              { id: 'manufacturer', header: 'Distributor', accessor: (r: any) => r.manufacturer || r.supplier || '—' },
              { id: 'quantity', header: 'Quantity Left', accessor: (r: any) => String(r.quantity ?? 0), sortable: true, width: '120px' },
            ]}
            data={lowStockItemsList}
            keyExtractor={(r: any) => r.id}
            pagination={false}
            emptyMessage="No low stock items"
          />
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.assign('/owner/inventory')}>Inventory</Button>
            <Button onClick={() => window.location.assign('/owner/reports')} variant="outline">Reports</Button>
            <Button onClick={() => window.location.assign('/owner/staff')} variant="outline">Staff</Button>
          </div>
        </div>
      </section>
    </div>
  );
};
