import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';

export const StoreManagement = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/stores`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) setStores(data.data?.stores || []);
      else console.error('Failed to load stores', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const columns = [
    { id: 'name', header: 'Store Name', accessor: 'name', sortable: true },
    { id: 'phone', header: 'Mobile', accessor: 'phone' },
    { id: 'email', header: 'Email', accessor: 'email' },
    { id: 'address', header: 'Address', accessor: 'address' },
    { id: 'totalSales', header: 'Total Sales', accessor: (r: any) => (typeof r.totalSales === 'number' ? r.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">Manage all medical stores and their settings</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Store
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <Table columns={columns as any} data={stores} keyExtractor={(r: any) => r.id} loading={loading} emptyMessage="No stores found" searchable />
      </div>
    </div>
  );
};
