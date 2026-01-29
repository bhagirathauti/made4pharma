import React, { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Row = {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number | string;
  costPrice: number | string;
  mrp: number | string;
  discount: number | string;
  supplier: string;
  reorderLevel: number | string;
  refill: boolean;
};

export const AddProductsBulk: React.FC = () => {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDistributors(); fetchProducts(); addRow(); }, []);

  const fetchDistributors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/products/distributors`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok) setDistributors(data.data?.distributors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/products`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok) setAllProducts(data.data?.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addRow = () => {
    setRows((r) => [
      ...r,
      {
        id: Math.random().toString(36).slice(2, 9),
        name: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        costPrice: '',
        mrp: '',
        discount: '',
        supplier: selectedDistributor || '',
        reorderLevel: '',
        refill: false,
      },
    ]);
  };

  const removeRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  useEffect(() => {
    // when distributor changes, set supplier on empty rows
    setRows((rs) => rs.map((row) => ({ ...row, supplier: row.supplier || selectedDistributor })));
  }, [selectedDistributor]);

  

  const submitAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      for (const row of rows) {
        // basic validation
        if (!row.name) continue;
        const body = {
          name: row.name,
          batchNumber: row.batchNumber,
          expiryDate: row.expiryDate,
          quantity: Number(row.quantity || 0),
          costPrice: Number(row.costPrice || 0),
          mrp: Number(row.mrp || 0),
          discount: Number(row.discount || 0),
          supplier: row.supplier || selectedDistributor || null,
          reorderLevel: Number(row.reorderLevel || 0),
          refill: !!row.refill,
        };

        await fetch(`${apiBase}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body),
        });
      }
      // refetch products and distributors
      await fetchProducts();
      await fetchDistributors();
      alert('Products submitted');
      setRows([]);
      addRow();
    } catch (err) {
      console.error(err);
      alert('Error submitting products');
    } finally {
      setLoading(false);
    }
  };

  const productSuggestions = (q: string, manufacturer?: string) => {
    const qq = (q || '').toLowerCase();
    const list = allProducts.filter((p) => {
      const nameMatch = String(p.name || '').toLowerCase().includes(qq);
      const manufacturerMatch = manufacturer ? String(p.manufacturer || '') === String(manufacturer) : true;
      return nameMatch && manufacturerMatch;
    });
    return list.slice(0, 8);
  };

  const handleNameChange = (rowId: string, value: string) => {
    updateRow(rowId, { name: value });
    // If a distributor is selected, try to autofill from a matching product delivered by that distributor
    const manufacturer = selectedDistributor || '';
    if (!manufacturer) return;
    const matches = productSuggestions(value, manufacturer);
    if (matches.length > 0) {
      const p = matches[0];
      updateRow(rowId, {
        costPrice: p.price ?? '',
        mrp: p.mrp ?? '',
        reorderLevel: p.reorderLevel ?? '',
        supplier: p.manufacturer ?? manufacturer,
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Add Products (Bulk)</h1>
      <p className="text-gray-600 mt-1">Add multiple products for a distributor / manufacturer.</p>

      <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select distributor</label>
            <CreatableSelect
              isClearable
              className="mt-1"
              options={distributors.map((d) => ({ value: d.manufacturer, label: d.manufacturer }))}
              onChange={(opt: any) => setSelectedDistributor(opt ? opt.value : '')}
              onCreateOption={async (val: string) => {
                // Persist distributor to backend, then select it. If persistence fails, do not change selection.
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${apiBase}/api/distributors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ name: val }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Failed to create distributor');
                  const created = data.data?.distributor;
                  const name = created?.name || val;
                  const newDist = { manufacturer: name };
                  setDistributors((d) => [newDist, ...d]);
                  setSelectedDistributor(name);
                  // update any empty suppliers in rows immediately
                  setRows((rs) => rs.map((row) => ({ ...row, supplier: row.supplier || name })));
                } catch (e: any) {
                  console.error('Failed to create distributor', e);
                  alert(`Could not create distributor: ${e?.message || e}`);
                }
              }}
              value={selectedDistributor ? { value: selectedDistributor, label: selectedDistributor } : null}
            />
          </div>
          <div className="flex items-end justify-end">
            <div className="text-sm text-gray-500">Selected: <strong className="ml-2">{selectedDistributor || '—'}</strong></div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Products</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => selectedDistributor ? addRow() : alert('Please select a distributor first')} size="sm" disabled={!selectedDistributor}>Add row</Button>
              <Button onClick={() => selectedDistributor ? (setRows([]), addRow()) : alert('Please select a distributor first')} variant="outline" size="sm" disabled={!selectedDistributor}>Clear</Button>
            </div>
          </div>

          <div>
            <Table
              columns={[
                {
                  id: 'name',
                  header: 'Product name',
                  accessor: (r: Row) => (
                    <div style={{ minWidth: 240 }}>
                      <CreatableSelect
                        isClearable
                        isDisabled={!selectedDistributor}
                        onChange={(opt: any) => {
                          if (!opt) return updateRow(r.id, { name: '' });
                          // handle explicit "Add" option
                          if (opt.__isNew) {
                            const val = opt.value;
                            const newProduct = { name: val, manufacturer: selectedDistributor || '', price: '', mrp: '', reorderLevel: 0 };
                            setAllProducts((p) => [newProduct, ...p]);
                            return updateRow(r.id, { name: val });
                          }

                          updateRow(r.id, { name: opt.value });
                          if (opt.__product) {
                            const p = opt.__product;
                            updateRow(r.id, {
                              costPrice: p.price ?? '',
                              mrp: p.mrp ?? '',
                              reorderLevel: p.reorderLevel ?? '',
                              supplier: p.manufacturer ?? selectedDistributor,
                            });
                          }
                        }}
                        onCreateOption={(val: string) => {
                          const newProduct = { name: val, manufacturer: selectedDistributor || '', price: '', mrp: '', reorderLevel: 0 };
                          setAllProducts((p) => [newProduct, ...p]);
                          updateRow(r.id, { name: val });
                        }}
                        onInputChange={(val, actionMeta) => {
                          // react-select calls onInputChange for several actions (including selecting an option).
                          // Only treat genuine user typing ('input-change') as a name change to avoid clearing the value after select.
                          try {
                            const action = (actionMeta as any)?.action;
                            if (!action || action === 'input-change') {
                              handleNameChange(r.id, val || '');
                            }
                          } catch (e) {
                            handleNameChange(r.id, val || '');
                          }
                        }}
                        options={(() => {
                          const list = productSuggestions(r.name, selectedDistributor).map((p) => ({ value: p.name, label: `${p.name} — ${p.batchNo || ''}`, __product: p }));
                          const typed = (r.name || '').trim();
                          if (typed && !list.some((o) => o.value.toLowerCase() === typed.toLowerCase())) {
                            list.unshift({ value: typed, label: `Add "${typed}"`, __isNew: true } as any);
                          }
                          return list;
                        })()}
                        value={r.name ? { value: r.name, label: r.name } : null}
                      />
                    </div>
                  ),
                },
                { id: 'batch', header: 'Batch', accessor: (r: Row) => <Input placeholder="Batch" value={r.batchNumber} onChange={(e) => updateRow(r.id, { batchNumber: e.target.value })} className="w-48" disabled={!selectedDistributor} /> },
                { id: 'expiry', header: 'Expiry', accessor: (r: Row) => <Input placeholder="Expiry" type="date" value={r.expiryDate} onChange={(e) => updateRow(r.id, { expiryDate: e.target.value })} className="w-48" disabled={!selectedDistributor} /> },
                { id: 'qty', header: 'Qty', accessor: (r: Row) => <Input placeholder="Qty" type="number" min={0} value={r.quantity as any} onChange={(e) => updateRow(r.id, { quantity: e.target.value })} className="w-28" disabled={!selectedDistributor} /> },
                { id: 'cost', header: 'Cost', accessor: (r: Row) => <Input placeholder="Cost" type="number" step="0.01" value={r.costPrice as any} onChange={(e) => updateRow(r.id, { costPrice: e.target.value })} className="w-36" disabled={!selectedDistributor} /> },
                { id: 'mrp', header: 'MRP', accessor: (r: Row) => <Input placeholder="MRP" type="number" step="0.01" value={r.mrp as any} onChange={(e) => updateRow(r.id, { mrp: e.target.value })} className="w-36" disabled={!selectedDistributor} /> },
                { id: 'discount', header: 'Discount', accessor: (r: Row) => <Input placeholder="Discount" type="number" step="0.01" value={r.discount as any} onChange={(e) => updateRow(r.id, { discount: e.target.value })} className="w-20" disabled={!selectedDistributor} /> },
                { id: 'reorder', header: 'Reorder', accessor: (r: Row) => <Input placeholder="Reorder" type="number" value={r.reorderLevel as any} onChange={(e) => updateRow(r.id, { reorderLevel: e.target.value })} className="w-20" disabled={!selectedDistributor} /> },
                { id: 'refill', header: 'Refill', accessor: (r: Row) => <Checkbox checked={r.refill} onChange={(e) => updateRow(r.id, { refill: e.target.checked })} disabled={!selectedDistributor} /> },
              ]}
              data={rows}
              keyExtractor={(r) => r.id}
              pagination={false}
              searchable={false}
              actions={[
                {
                  label: 'Remove',
                  variant: 'danger',
                  onClick: (r: Row) => selectedDistributor ? removeRow(r.id) : alert('Please select a distributor first'),
                },
                {
                  label: 'Use distributor',
                  onClick: (r: Row) => selectedDistributor ? updateRow(r.id, { supplier: selectedDistributor || '' }) : alert('Please select a distributor first'),
                },
              ]}
              emptyMessage="No products added"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => selectedDistributor ? submitAll() : alert('Please select a distributor first')} loading={loading} disabled={!selectedDistributor}>{loading ? 'Submitting...' : 'Submit all'}</Button>
            <div className="text-sm text-gray-500">Tip: for existing batches, set the batch number and check Refill.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductsBulk;
