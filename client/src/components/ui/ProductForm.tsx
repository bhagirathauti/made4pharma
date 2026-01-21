import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

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
  const [reorderLevel, setReorderLevel] = useState('');
  const [refill, setRefill] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const submitActual = async (body: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      setReorderLevel('');
      setRefill(false);
      setExistingProduct(null);
      setConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      name,
      batchNumber,
      expiryDate,
      quantity: parseInt(quantity || '0', 10),
      costPrice: parseFloat(costPrice || '0'),
      mrp: parseFloat(mrp || '0'),
      discount: parseFloat(discount || '0'),
      supplier,
      reorderLevel: parseInt(reorderLevel || '0', 10),
      refill,
    };

    try {
      if (batchNumber) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/api/products`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = await res.json();
        const list = data.data?.products || [];
        const found = list.find((p: any) => String(p.batchNo) === String(batchNumber));
        if (found && !refill) {
          setExistingProduct(found);
          setConfirmOpen(true);
          return;
        }
      }

      await submitActual(body);
    } catch (err) {
      console.error('batch check error', err);
      await submitActual(body);
    }
  };

  return (
    <>
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Inventory alert (reorder level)</label>
          <input value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} type="number" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input id="refill" type="checkbox" checked={refill} onChange={(e) => setRefill(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="refill" className="text-sm text-gray-700">Refill existing batch if found</label>
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

    <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} size="md">
      <ModalHeader onClose={() => setConfirmOpen(false)}>Batch exists</ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-700">A product with batch <strong>{existingProduct?.batchNo}</strong> already exists: <strong>{existingProduct?.name}</strong>.</p>
        <p className="text-sm text-gray-600 mt-2">Do you want to refill the existing batch (increase quantity) or create a new separate batch record?</p>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={async () => {
            // Refill
            setRefill(true);
            const body = {
              name,
              batchNumber,
              expiryDate,
              quantity: parseInt(quantity || '0', 10),
              costPrice: parseFloat(costPrice || '0'),
              mrp: parseFloat(mrp || '0'),
              discount: parseFloat(discount || '0'),
              supplier,
              reorderLevel: parseInt(reorderLevel || '0', 10),
              refill: true,
            };
            await submitActual(body);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded" 
        >
          Refill existing
        </button>
        <button
          onClick={async () => {
            // Create new
            setRefill(false);
            const body = {
              name,
              batchNumber,
              expiryDate,
              quantity: parseInt(quantity || '0', 10),
              costPrice: parseFloat(costPrice || '0'),
              mrp: parseFloat(mrp || '0'),
              discount: parseFloat(discount || '0'),
              supplier,
              reorderLevel: parseInt(reorderLevel || '0', 10),
              refill: false,
            };
            await submitActual(body);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
        >
          Create new batch
        </button>
      </ModalFooter>
    </Modal>
    </>
  );
};

export default ProductForm;
