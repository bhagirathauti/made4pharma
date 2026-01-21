import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';

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
  const [fullSales, setFullSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api('/api/sales');
      if (res && res.success) {
        setFullSales(res.data.sales || []);
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
        actions={[
          {
            label: 'View',
            onClick: (row: SaleRow) => {
              const sale = fullSales.find((s) => s.id === row.id);
              setSelected(sale || null);
              setOpen(true);
            },
          },
        ]}
      />
      <Modal isOpen={open} onClose={() => setOpen(false)} size="lg">
        <ModalHeader onClose={() => setOpen(false)}>Sale Details</ModalHeader>
        <ModalBody>
          {!selected ? (
            <div>Loading...</div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">Invoice: <strong className="text-gray-800">{selected.invoiceNo || selected.id}</strong></div>
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Rate</th>
                    <th className="py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selected.items) && selected.items.map((it: any) => (
                    <tr key={it.id || `${it.name}-${Math.random()}`} className="border-b">
                      <td className="py-2">{it.name || it.product?.name || 'Item'}</td>
                      <td className="py-2">{it.quantity}</td>
                      <td className="py-2">{(typeof it.price === 'number' ? it.price : Number(it.price || 0)).toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</td>
                      <td className="py-2">{(typeof it.subtotal === 'number' ? it.subtotal : Number(it.subtotal || 0)).toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SalesHistory;
