import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string, opts: any = {}) => {
  const token = localStorage.getItem('token');
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...opts }).then((r) => r.json());
};

type SaleRow = {
  id: string;
  invoiceNo?: string;
  createdAt: string;
  totalAmount: number;
  itemsCount: number;
  paymentMethod?: string;
  customerName?: string | null;
  customerMobile?: string | null;
};

const SalesHistory: React.FC = () => {
  const [data, setData] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api('/api/sales');
      if (res && res.success) {
        const rows: SaleRow[] = res.data.sales.map((s: any) => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          createdAt: s.createdAt,
          totalAmount: Number(s.totalAmount ?? s.netAmount ?? 0),
          itemsCount: Array.isArray(s.items) ? s.items.length : 0,
          paymentMethod: s.paymentMethod || 'CASH',
          customerName: s.customerName || null,
          customerMobile: s.customerMobile || null,
        }));
        setData(rows);
      }
    } catch (err) {
      console.error('fetch sales', err);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Sales History</h2>
        <div className="text-sm text-gray-500">Showing sales for you</div>
      </div>

      <Table
        columns={[
          { id: 'customer', header: 'Customer', accessor: (r: SaleRow) => r.customerName || '-' },
          { id: 'mobile', header: 'Mobile', accessor: (r: SaleRow) => r.customerMobile || '-' },
          { id: 'invoice', header: 'Invoice', accessor: (r: SaleRow) => r.invoiceNo || r.id },
          { id: 'date', header: 'Date', accessor: (r: SaleRow) => new Date(r.createdAt).toLocaleString() },
          { id: 'items', header: 'Items', accessor: (r: SaleRow) => r.itemsCount },
          { id: 'amount', header: 'Amount', accessor: (r: SaleRow) => `₹${r.totalAmount.toFixed(2)}` },
          { id: 'payment', header: 'Txn Type', accessor: (r: SaleRow) => r.paymentMethod || 'CASH' },
        ]}
        data={data}
        keyExtractor={(r: SaleRow) => r.id}
        loading={loading}
        pagination={true}
        searchable={true}
        emptyMessage="No sales yet"
      />
    </div>
  );
};

export default SalesHistory;
