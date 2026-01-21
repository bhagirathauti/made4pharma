import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';

export const Bills: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/sales`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.data?.sales || []);
      } else {
        console.error('Failed to load invoices', data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const columns = [
    { id: 'invoice', header: 'Invoice ID', accessor: (r: any) => r.invoiceNo || r.id, sortable: true },
    { id: 'customerName', header: 'Customer Name', accessor: (r: any) => r.customerName || 'Walk-in' },
    { id: 'customerPhone', header: 'Customer Phone', accessor: (r: any) => r.customerMobile || '—' },
    { id: 'totalAmount', header: 'Total Amount', accessor: (r: any) => (typeof r.totalAmount === 'number' ? r.totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'INR' }) : '—') },
    { id: 'paymentMethod', header: 'Payment Mode', accessor: (r: any) => r.paymentMethod || 'CASH' },
    { id: 'cashier', header: 'Cashier', accessor: (r: any) => r.cashier?.name || '—' },
  ];

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <Table
          columns={columns as any}
          data={invoices}
          keyExtractor={(r: any) => r.id}
          loading={loading}
          emptyMessage="No invoices found"
          searchable
          actions={[
            {
              label: 'View',
              onClick: (row: any) => {
                setSelected(row);
                setOpen(true);
              },
            },
          ]}
        />
      </div>
    </div>
    <Modal isOpen={open} onClose={() => setOpen(false)} size="lg">
      <ModalHeader onClose={() => setOpen(false)}>Invoice Details</ModalHeader>
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
                    <td className="py-2">{(typeof it.price === 'number' ? it.price : Number(it.price || 0)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    <td className="py-2">{(typeof it.subtotal === 'number' ? it.subtotal : Number(it.subtotal || 0)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
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
    </>
  );
};

export default Bills;
