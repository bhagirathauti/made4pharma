import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';

export const Distributors: React.FC = () => {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/products/distributors`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) setDistributors(data.data?.distributors || []);
      else console.error('Failed to load distributors', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDistributors(); }, []);

  const columns = [
    { id: 'manufacturer', header: 'Distributor / Manufacturer', accessor: 'manufacturer', sortable: true },
    { id: 'totalAmount', header: 'Total Cost', accessor: (r: any) => (typeof r.totalAmount === 'number' ? r.totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'INR' }) : '—') },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Distributors / Manufacturers</h1>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <Table columns={columns as any} data={distributors} keyExtractor={(r: any) => r.manufacturer} loading={loading} emptyMessage="No distributors found" />
      </div>
    </div>
  );
};

export default Distributors;
