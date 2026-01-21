import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string, opts: any = {}) => {
  const token = localStorage.getItem('token');
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...opts }).then((r) => r.json());
};

type Product = {
  id: string;
  name: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  price: number;
  mrp?: number;
  manufacturer?: string | null;
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await api('/api/products');
        if (res && res.success) {
          const list = res.data.products || [];
          setProducts(list);
          setFiltered(list);
        }
    } catch (err) {
      console.error('fetchProducts', err);
    } finally { setLoading(false); }
  }

  const columns: TableColumn<Product>[] = [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'batch', header: 'Batch', accessor: 'batchNo' },
    { id: 'manufacturer', header: 'Manufacturer', accessor: (row) => row.manufacturer || '-' },
    { id: 'expiry', header: 'Expiry', accessor: (row) => (row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-') },
    { id: 'stock', header: 'Stock', accessor: 'quantity', sortable: true },
    { id: 'price', header: 'Price', accessor: (row) => `₹${(row.mrp || row.price || 0).toFixed(2)}` },
  ];

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    const s = String(q || '').trim().toLowerCase();
    if (!s) {
      setFiltered(products);
      return;
    }
    const out = products.filter((p) => {
      return (
        (p.name || '').toLowerCase().includes(s) ||
        (p.batchNo || '').toLowerCase().includes(s) ||
        (p.manufacturer || '').toLowerCase().includes(s)
      );
    });
    setFiltered(out);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Products</h2>
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search products by name, batch or manufacturer"
        onSearch={handleSearch}
        emptyMessage="No products found in your store"
        pagination={true}
        itemsPerPage={15}
      />
    </div>
  );
};

export default ProductsPage;
