import React, { useEffect, useMemo, useState } from 'react';
import ProductForm from '../../components/ui/ProductForm';
import { Modal, ModalHeader, ModalBody } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const itemsPerPageOptions = [10, 20, 50];
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/products`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.data?.products || [];
        console.log('fetched products', list);
        setAllProducts(list);
        setProducts(list);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    console.log(products)
  }, []);
  
  // aggregated products by name + manufacturer
  const aggregated = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of allProducts) {
      const key = `${p.name}||${p.manufacturer || ''}`;
      if (!map[key]) {
        map[key] = { id: key, name: p.name, manufacturer: p.manufacturer, totalQuantity: 0, totalValue: 0, batches: [] };
      }
      const qty = typeof p.quantity === 'number' ? p.quantity : parseInt(p.quantity || '0', 10);
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
      map[key].totalQuantity += qty;
      map[key].totalValue += qty * (isNaN(price) ? 0 : price);
      map[key].batches.push(p);
    }
    return Object.values(map);
  }, [allProducts]);

  const [selectedAggregate, setSelectedAggregate] = useState<any | null>(null);
  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const columns = useMemo(() => [
    { id: 'name', header: 'Name', accessor: (r: any) => (
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedAggregate(r); setShowBatchesModal(true); }} className="text-sm text-left">
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-gray-500">{r.manufacturer}</div>
          </button>
        </div>
      ), sortable: true },
    { id: 'quantity', header: 'Total Qty', accessor: (r: any) => r.totalQuantity },
    { id: 'avgCost', header: 'Avg Cost', accessor: (r: any) => `₹${(r.totalQuantity ? (r.totalValue / r.totalQuantity) : 0).toFixed(2)}` },
    { id: 'totalValue', header: 'Total Value', accessor: (r: any) => `₹${(r.totalValue ?? 0).toFixed(2)}` },
  ], [selectedAggregate]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      <p className="text-gray-600 mt-2">Manage products, stock levels and suppliers.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mb-4">Add Product</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add product
            </button>
          </div>
          <p className="text-sm text-gray-500">Click Add product to open the form.</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm col-span-1 md:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mb-4">Products</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Show</label>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-2 border rounded-md"
              >
                {itemsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <Table
            columns={columns as any}
            data={aggregated}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No products yet"
            searchable
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSearch={(q: string) => {
              const query = (q || '').toLowerCase().trim();
              setCurrentPage(1);
              if (!query) {
                // reset to aggregated
                return;
              }
              const filtered = aggregated.filter((p: any) => {
                return (
                  String(p.name || '').toLowerCase().includes(query) ||
                  String(p.manufacturer || '').toLowerCase().includes(query)
                );
              });
              // show filtered aggregated list by setting a temporary view
              // We replace products state with expanded aggregated entries for simplicity
              setProducts(filtered as any);
            }}
          />
          <Modal isOpen={showBatchesModal} onClose={() => setShowBatchesModal(false)} size="lg" closeOnOverlayClick={true}>
            <ModalHeader onClose={() => setShowBatchesModal(false)}>{selectedAggregate?.name}</ModalHeader>
            <ModalBody>
              <div className="mb-3">
                <div className="text-sm text-gray-600">{selectedAggregate?.manufacturer}</div>
                <div className="mt-2 text-sm text-gray-700">Total Qty: <span className="font-medium">{selectedAggregate?.totalQuantity ?? 0}</span> &middot; Avg Cost: <span className="font-medium">₹{(selectedAggregate?.totalQuantity ? ((selectedAggregate?.totalValue ?? 0) / selectedAggregate.totalQuantity).toFixed(2) : '0.00')}</span> &middot; Total Value: <span className="font-medium">₹{(selectedAggregate?.totalValue ?? 0).toFixed(2)}</span></div>
              </div>
              <Table
                columns={[
                  { id: 'batch', header: 'Batch', accessor: 'batchNo' },
                  { id: 'expiry', header: 'Expiry', accessor: (r: any) => new Date(r.expiryDate).toLocaleDateString() },
                  { id: 'qty', header: 'Qty', accessor: (r: any) => (typeof r.quantity === 'number' ? r.quantity : parseInt(r.quantity || '0', 10)) },
                  { id: 'cost', header: 'Cost', accessor: (r: any) => `₹${(r.price ?? 0).toFixed(2)}` },
                ] as any}
                data={selectedAggregate?.batches || []}
                keyExtractor={(r: any) => r.id}
                emptyMessage="No batches"
              />
            </ModalBody>
          </Modal>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} size="lg">
        <ModalHeader onClose={() => setShowForm(false)}>Add Product</ModalHeader>
        <ModalBody>
          <ProductForm
            onSaved={(p) => {
              setAllProducts((prev) => [p, ...prev]);
              setProducts((prev) => [p, ...prev]);
              setShowForm(false);
            }}
          />
        </ModalBody>
      </Modal>
    </div>
  );
};
