import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string, opts: any = {}) => {
  const token = localStorage.getItem('token');
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...opts }).then((r) => r.json());
};

type Sale = { id: string; createdAt: string; totalAmount: number };

export const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<'year' | 'month' | 'week' | 'day'>('month');

  useEffect(() => { fetchSales(); }, []);

  async function fetchSales() {
    setLoading(true);
    try {
      const res = await api('/api/sales');
      if (res && res.success) {
        // normalize items into per-sale totals (server returns sale with items)
        const s: Sale[] = res.data.sales.map((sl: any) => ({ id: sl.id, createdAt: sl.createdAt, totalAmount: Number(sl.totalAmount || sl.netAmount || 0) }));
        setSales(s);
      }
    } catch (err) {
      console.error('fetchSales', err);
    } finally { setLoading(false); }
  }

  const userName = localStorage.getItem('userName') || 'Cashier';

  // aggregate helper
  const data = useMemo(() => {
    const groups: Record<string, number> = {};
    const now = new Date();
    const fmtKey = (d: Date) => {
      if (range === 'year') return String(d.getMonth() + 1); // month index
      if (range === 'month') return `${d.getDate()}/${d.getMonth() + 1}`;
      if (range === 'week') return `${d.getDay()}`;
      return `${d.getHours()}:00`;
    };
    const withinRange = (d: Date) => {
      const diff = now.getTime() - d.getTime();
      if (range === 'year') return diff <= 365 * 24 * 3600 * 1000;
      if (range === 'month') return diff <= 31 * 24 * 3600 * 1000;
      if (range === 'week') return diff <= 7 * 24 * 3600 * 1000;
      return diff <= 24 * 3600 * 1000;
    };
    for (const s of sales) {
      const d = new Date(s.createdAt);
      if (!withinRange(d)) continue;
      const k = fmtKey(d);
      groups[k] = (groups[k] || 0) + (s.totalAmount || 0);
    }
    // convert to array sorted by key
    const out = Object.keys(groups).sort().map((k) => ({ name: k, total: groups[k] }));
    return out.length ? out : [{ name: '—', total: 0 }];
  }, [sales, range]);

  const total = useMemo(() => sales.reduce((s, i) => s + (i.totalAmount || 0), 0), [sales]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {userName}</h1>
          <div className="text-sm text-gray-600">Welcome back — here's your sales summary</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">My sales (total)</div>
            <div className="text-xl font-bold text-green-600">₹{total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Sales Analytics</h3>
          <div className="flex items-center gap-2">
            <select value={range} onChange={(e) => setRange(e.target.value as any)} className="border p-1 rounded">
              <option value="year">Year</option>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
