import React, { useState } from 'react';

type Props = {
  onSaved?: (product: any) => void;
};

export const ProductForm: React.FC<Props> = ({ onSaved }) => {
  const [name, setName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [discount, setDiscount] = useState('');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        name,
        batchNumber,
        expiryDate,
        quantity: parseInt(quantity || '0', 10),
        costPrice: parseFloat(costPrice || '0'),
        mrp: parseFloat(mrp || '0'),
        discount: parseFloat(discount || '0'),
        supplier,
      };

      const res = await fetch(`${apiBase}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save product');
      onSaved?.(data.data?.product ?? data.product ?? data);
      // clear
      setName('');
      setBatchNumber('');
      setExpiryDate('');
      setQuantity('');
      setCostPrice('');
      setMrp('');
      setDiscount('');
      setSupplier('');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product name</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Batch number</label>
          <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry date</label>
          <input value={expiryDate} onChange={e => setExpiryDate(e.target.value)} type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <input value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" step="1" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost price</label>
          <input value={costPrice} onChange={e => setCostPrice(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">MRP</label>
          <input value={mrp} onChange={e => setMrp(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
          <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {loading ? 'Saving...' : 'Save product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
