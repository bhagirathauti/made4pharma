import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui';

// Lightweight POS for cashier - single, clean implementation
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string, opts: any = {}) => {
  const token = localStorage.getItem('token');
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  }).then((r) => r.json());
};

type AnyProduct = Record<string, any>;
type CartItem = { id: string; name: string; price: number; quantity: number; productId?: string; manual?: boolean };

const POS: React.FC = () => {
  const [allProducts, setAllProducts] = useState<AnyProduct[]>([]);
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [qtyInput, setQtyInput] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep(1);
    setCart([]);
    setCustomer({ name: '', mobile: '' });
    setSearch('');
    setProducts(allProducts);
    setLoading(false);
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await api('/api/products');
      if (res && res.success) {
        setAllProducts(res.data.products || []);
        setProducts(res.data.products || []);
      }
    } catch (e) {
      console.error('POS fetchProducts error', e);
    }
  }

  function handleSearch(q: string) {
    const qq = (q || '').toLowerCase().trim();
    setSearch(q);
    if (!qq) return setProducts(allProducts);
    setProducts(allProducts.filter((p) => {
      const anyP = p as any;
      return String(anyP.name || '').toLowerCase().includes(qq) || String(anyP.batchNo || '').toLowerCase().includes(qq);
    }));
  }

  function addToCartFromProduct(p: AnyProduct, qty = 1) {
    const stock = Number(p.quantity ?? p.stock ?? 0);
    setCart((c) => {
      const found = c.find((it) => it.productId && it.productId === p.id);
      const existingQty = found ? found.quantity : 0;
      if (existingQty + qty > stock) {
        alert('Insufficient quantity in stock');
        return c;
      }
      if (found) return c.map((it) => (it.productId === p.id ? { ...it, quantity: it.quantity + qty } : it));
      return [...c, { id: `${p.id}-${Date.now()}`, productId: p.id, name: p.name || 'Item', price: Number(p.mrp || p.price || 0), quantity: qty }];
    });
  }


  function changeQty(id: string, delta: number) {
    setCart((c) => c.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it)));
  }

  function setQtyExact(id: string, qty: number) {
    setCart((c) => {
      const target = c.find((it) => it.id === id);
      if (!target) return c;
      // if product-backed, enforce stock
      if (target.productId) {
        const prod = allProducts.find((p) => String(p.id) === String(target.productId));
        const stock = Number(prod?.quantity ?? prod?.stock ?? 0);
        if (qty > stock) {
          alert('Insufficient quantity in stock');
          qty = stock || 1;
        }
      }
      return c.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, qty) } : it));
    });
  }

  function removeFromCart(id: string) {
    setCart((c) => c.filter((it) => it.id !== id));
  }

  async function checkout() {
    if (cart.length === 0) return alert('Cart empty');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not authenticated. Please login as a cashier before creating a sale.');
        setLoading(false);
        return;
      }
      const cashierId = localStorage.getItem('userId');
      const payload = { items: cart.map((i) => (i.productId ? { productId: i.productId, quantity: i.quantity, price: i.price } : { name: i.name, quantity: i.quantity, price: i.price })), customer, paymentMethod, cashierId };
      const res = await api('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
      if (res && res.success) {
        alert('Sale recorded');
        setCart([]);
        setModalOpen(false);
        fetchProducts();
      } else {
        alert(res?.message || 'Sale failed');
      }
    } catch (e) {
      console.error('checkout error', e);
      alert('Error during checkout');
    } finally {
      setLoading(false);
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Point of Sale</h2>
        <button onClick={openModal} className="bg-blue-600 text-white px-3 py-2 rounded">Start New Bill</button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white w-full max-w-5xl rounded shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Create Bill — Step {step} of 3</h3>
                <div className="flex items-center gap-2">
                {step > 1 && <button onClick={() => setStep(step - 1)} className="px-3 py-1 border rounded">Back</button>}
                <button onClick={closeModal} className="px-3 py-1 border rounded">Cancel</button>
              </div>
            </div>

            <div>
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Customer name</label>
                    <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="border p-2 w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Mobile (optional)</label>
                    <input value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} className="border p-2 w-full" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="mb-3">
                    <input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); handleSearch(e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const q = (search || '').trim();
                          if (!q) return;
                          const matches = products.filter((p) => {
                            const anyP = p as any;
                            return String(anyP.name || '').toLowerCase().includes(q.toLowerCase()) || String(anyP.batchNo || '').toLowerCase().includes(q.toLowerCase());
                          });
                          if (matches.length > 0) {
                            // add first matched product (qty 1)
                            addToCartFromProduct(matches[0], 1);
                          } else {
                            // add as manual item with name = query
                            setCart((c) => [...c, { id: `m-${Date.now()}`, name: q, price: 0, quantity: 1, manual: true }]);
                          }
                          setSearch('');
                          setProducts(allProducts);
                        }
                      }}
                      placeholder="Search products (press Enter to add if not found)"
                      className="border p-2 w-full"
                    />
                  </div>

                  {/* Top 3 suggestions */}
                  <div className="mb-4">
                    {search ? (
                      (() => {
                        const q = (search || '').toLowerCase().trim();
                        const suggestions = allProducts.filter((p) => {
                          const anyP = p as any;
                          return String(anyP.name || '').toLowerCase().includes(q) || String(anyP.batchNo || '').toLowerCase().includes(q);
                        }).slice(0, 3);
                        if (suggestions.length === 0) return <div className="text-sm text-gray-500">No suggestions — press Enter to add manually</div>;
                        return (
                          <div className="border rounded overflow-hidden">
                            {suggestions.map((p) => (
                              <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                <div>
                                  <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-gray-500">Batch: {p.batchNo || '—'} • Stock: {p.quantity ?? p.stock ?? '—'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">₹{(p.mrp || p.price)?.toFixed ? (p.mrp || p.price).toFixed(2) : (p.mrp || p.price)}</div>
                                  <button onClick={() => { addToCartFromProduct(p, 1); }} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-sm text-gray-500">Type to search products by name or batch.</div>
                    )}
                  </div>

                  {/* Current bill shown below search */}
                  <div className="p-3 border rounded">
                    <h4 className="font-medium mb-2">Current Bill</h4>
                        <Table
                      columns={[
                        { id: 'name', header: 'Name', accessor: (r: CartItem) => r.name },
                        { id: 'price', header: 'Price', accessor: (r: CartItem) => `₹${r.price.toFixed(2)}` },
                        { id: 'quantity', header: 'Qty', accessor: (r: CartItem) => {
                            const inputVal = qtyInput[r.id] ?? String(r.quantity);
                            return (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-20 border p-1"
                                value={inputVal}
                                onChange={(e) => setQtyInput((s) => ({ ...s, [r.id]: e.target.value }))}
                                onBlur={() => {
                                  const raw = qtyInput[r.id] ?? String(r.quantity);
                                  const parsed = parseInt(raw, 10);
                                  const final = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
                                  setQtyExact(r.id, final);
                                  setQtyInput((s) => { const c = { ...s }; delete c[r.id]; return c; });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                              />
                            );
                          } },
                        { id: 'subtotal', header: 'Subtotal', accessor: (r: CartItem) => `₹${(r.price * r.quantity).toFixed(2)}` },
                      ]}
                      data={cart}
                      keyExtractor={(r: any) => r.id}
                      actions={[
                        { label: '+', onClick: (row: CartItem) => changeQty(row.id, +1) },
                        { label: '-', onClick: (row: CartItem) => changeQty(row.id, -1) },
                        { label: 'Remove', variant: 'danger', onClick: (row: CartItem) => removeFromCart(row.id) },
                      ]}
                      pagination={false}
                      emptyMessage="No items in bill"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Customer</h4>
                    <div className="text-sm text-gray-700">{customer.name || 'Walk-in'}</div>
                    <div className="text-sm text-gray-500">{customer.mobile}</div>

                    <div className="mt-4">
                      <h4 className="font-medium">Items</h4>
                      <div id="pos-receipt" className="mt-2">
                        {cart.map((i) => (
                          <div key={i.id} className="flex justify-between py-1">
                            <div>
                              <div className="font-medium">{i.name}</div>
                              <div className="text-xs text-gray-500">{i.manual ? 'Manual' : 'Inventory'}</div>
                            </div>
                            <div className="text-right">{i.quantity} x {i.price.toFixed(2)} = {(i.quantity * i.price).toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="mt-4 border-t pt-2 flex justify-between font-semibold"> <div>Total</div><div>₹{subtotal.toFixed(2)}</div></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="p-3 border rounded mb-3">
                      <h4 className="font-medium mb-2">Payment</h4>
                        <div className="text-sm">Amount: <strong>₹{subtotal.toFixed(2)}</strong></div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">Transaction type</label>
                          <div className="flex gap-3">
                            <label className="inline-flex items-center gap-2">
                              <input type="radio" name="payment" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                              <span>Cash</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                              <span>Online</span>
                            </label>
                          </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end mt-auto">
                      <div className="mb-2 w-full">
                        <button onClick={checkout} disabled={loading} className="w-full bg-blue-700 text-white py-2 rounded">Complete Bill</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {step < 3 && <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>}
              {step === 3 && <button onClick={closeModal} className="px-4 py-2 border rounded">Close</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
