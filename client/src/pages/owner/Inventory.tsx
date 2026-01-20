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
  const columns = useMemo(() => [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'batchNo', header: 'Batch', accessor: 'batchNo' },
    { id: 'expiry', header: 'Expiry', accessor: (r: any) => new Date(r.expiryDate).toLocaleDateString() },
    { id: 'quantity', header: 'Qty', accessor: (r: any) => (typeof r.quantity === 'number' ? r.quantity : parseInt(r.quantity || '0', 10)) },
    { id: 'mrp', header: 'MRP', accessor: (r: any) => `₹${(r.mrp ?? 0).toFixed(2)}` },
    { id: 'price', header: 'Cost', accessor: (r: any) => `₹${(r.price ?? 0).toFixed(2)}` },
  ], []);

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
            data={products}
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
                setProducts(allProducts);
                return;
              }
              const filtered = allProducts.filter((p: any) => {
                return (
                  String(p.name || '').toLowerCase().includes(query) ||
                  String(p.batchNo || '').toLowerCase().includes(query) ||
                  String(p.manufacturer || '').toLowerCase().includes(query) ||
                  String(p.genericName || '').toLowerCase().includes(query)
                );
              });
              setProducts(filtered);
            }}
          />
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
