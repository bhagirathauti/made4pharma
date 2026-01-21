import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Modal, ModalHeader, ModalBody } from '../../components/ui/Modal';

const CashierForm: React.FC<{ onSaved?: (u: any) => void }> = ({ onSaved }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = { name, email, password, role: 'CASHIER' };
      const res = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create cashier');
      onSaved?.(data.data?.user ?? data.user ?? data);
      setName(''); setEmail(''); setPassword('');
    } catch (err: any) {
      alert(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {loading ? 'Creating...' : 'Create cashier'}
        </button>
      </div>
    </form>
  );
};

export const Cashiers: React.FC = () => {
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchCashiers = async () => {
    try {
      const token = localStorage.getItem('token');
      // fetch cashiers for this owner's store (new endpoint)
      const res = await fetch(`${apiBase}/api/users/cashiers`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) setCashiers(data.data?.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCashiers(); }, []);

  const columns = [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'email', header: 'Email', accessor: 'email' },
    { id: 'totalSales', header: 'Total Sales', accessor: (r: any) => (typeof r.totalSales === 'number' ? r.totalSales.toLocaleString(undefined, { style: 'currency', currency: 'INR' }) : '—') },
    { id: 'createdAt', header: 'Created', accessor: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Cashiers</h1>
        <button onClick={() => setShowForm(true)} className="px-3 py-2 bg-blue-600 text-white rounded-md">Create cashier</button>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <Table columns={columns as any} data={cashiers} keyExtractor={(r: any) => r.id} emptyMessage="No cashiers" searchable />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} size="md">
        <ModalHeader onClose={() => setShowForm(false)}>Create Cashier</ModalHeader>
        <ModalBody>
          <CashierForm onSaved={(u) => { setCashiers((prev) => [u, ...prev]); setShowForm(false); }} />
        </ModalBody>
      </Modal>
    </div>
  );
};

export default Cashiers;
