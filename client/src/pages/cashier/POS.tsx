import React, { useEffect, useState } from 'react';
import { Table, Input, Button } from '../../components/ui';

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
type CartItem = { id: string; name: string; price: number; quantity: number; productId?: string; manual?: boolean; originalPrice?: number | null; override?: boolean };

const POS: React.FC = () => {
  const [allProducts, setAllProducts] = useState<AnyProduct[]>([]);
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '', address: '', doctorName: '', doctorMobile: '' });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [qtyInput, setQtyInput] = useState<Record<string, string>>({});
  const [priceInput, setPriceInput] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep(1);
    setCart([]);
    setCustomer({ name: '', mobile: '', address: '', doctorName: '', doctorMobile: '' });
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
      const name = String(anyP.name || '').toLowerCase();
      const batch = String(anyP.batchNo || '').toLowerCase();
      return name.startsWith(qq) || batch.startsWith(qq);
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
      const basePrice = Number(p.mrp ?? p.price ?? 0);
      return [...c, { id: `${p.id}-${Date.now()}`, productId: p.id, name: p.name || 'Item', price: basePrice, originalPrice: basePrice, quantity: qty, override: false }];
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

  function setPriceExact(id: string, price: number) {
    setCart((c) => c.map((it) => (it.id === id ? { ...it, price: Math.max(0, price), override: true } : it)));
  }

  function resetPriceToOriginal(id: string) {
    setCart((c) => c.map((it) => (it.id === id ? { ...it, price: it.originalPrice ?? it.price, override: false } : it)));
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
        <Button onClick={openModal}>Start New Bill</Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white w-full max-w-5xl rounded shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Create Bill — Step {step} of 3</h3>
                <div className="flex items-center gap-2">
                {step > 1 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Back</Button>}
                <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
              </div>
            </div>

            <div>
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: (e.target as HTMLInputElement).value })} />
                  <Input label="Mobile (optional)" value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: (e.target as HTMLInputElement).value })} />

                  <Input label="Address (optional)" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: (e.target as HTMLInputElement).value })} />
                  <Input label="Prescribing doctor (optional)" value={customer.doctorName} onChange={(e) => setCustomer({ ...customer, doctorName: (e.target as HTMLInputElement).value })} />

                  <Input label="Doctor mobile (optional)" value={customer.doctorMobile} onChange={(e) => setCustomer({ ...customer, doctorMobile: (e.target as HTMLInputElement).value })} />
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="mb-3">
                    <Input
                      value={search}
                      onChange={(e) => { setSearch((e.target as HTMLInputElement).value); handleSearch((e.target as HTMLInputElement).value); }}
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
                      className="w-full"
                    />
                  </div>

                  {/* Top 3 suggestions */}
                  <div className="mb-4">
                    {search ? (
                      (() => {
                        const q = (search || '').toLowerCase().trim();
                        const suggestions = allProducts.filter((p) => {
                          const anyP = p as any;
                          const name = String(anyP.name || '').toLowerCase();
                          const batch = String(anyP.batchNo || '').toLowerCase();
                          return name.startsWith(q) || batch.startsWith(q);
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
                                  <Button size="sm" onClick={() => { addToCartFromProduct(p, 1); }}>Add</Button>
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
                        { id: 'price', header: 'Price', accessor: (r: CartItem) => {
                            const inputVal = priceInput[r.id] ?? String(r.price.toFixed?.(2) ?? r.price);
                            return (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  className="w-24"
                                  value={inputVal}
                                  onChange={(e) => setPriceInput((s) => ({ ...s, [r.id]: (e.target as HTMLInputElement).value }))}
                                  onBlur={() => {
                                    const raw = priceInput[r.id] ?? String(r.price);
                                    const parsed = parseFloat(raw?.toString().replace(/,/g, '') || '0');
                                    const final = Number.isFinite(parsed) && parsed >= 0 ? parsed : r.price;
                                    setPriceExact(r.id, final);
                                    setPriceInput((s) => { const c = { ...s }; delete c[r.id]; return c; });
                                  }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                                {r.override && <span className="text-xs text-yellow-700">edited</span>}
                                {r.originalPrice != null && r.override && (
                                  <button className="text-xs text-blue-600" onClick={() => resetPriceToOriginal(r.id)}>Reset</button>
                                )}
                              </div>
                            );
                          } },
                        { id: 'quantity', header: 'Qty', accessor: (r: CartItem) => {
                            const inputVal = qtyInput[r.id] ?? String(r.quantity);
                            return (
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-20"
                                value={inputVal}
                                onChange={(e) => setQtyInput((s) => ({ ...s, [r.id]: (e.target as HTMLInputElement).value }))}
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
                        <Button onClick={checkout} loading={loading} className="w-full">Complete Bill</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {step < 3 && <Button onClick={() => setStep(step + 1)}>Next</Button>}
              {step === 3 && <Button variant="outline" onClick={closeModal}>Close</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
