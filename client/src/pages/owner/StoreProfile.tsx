import React, { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';

export const StoreProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [gstNo, setGstNo] = useState('');
  const { showToast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stores/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.message || 'Failed to load store profile');
        setStore(null);
        return;
      }
      const s = data.data.store;
      setStore(s);
      if (s) {
        setName(s.name || '');
        setAddress(s.address || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setLicenseNo(s.licenseNo || '');
        setGstNo(s.gstNo || '');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stores/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, address, phone, email, licenseNo, gstNo }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.message || 'Failed to save profile');
        return;
      }

      const s = data.data.store;
      setStore(s);
      showToast('success', 'Store profile saved');
      if (s) {
        localStorage.setItem('storeId', s.id);
        localStorage.setItem('storeName', s.name || '');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Profile</h1>
        <p className="text-gray-600 mb-4">View and update your store information.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" className="w-full border rounded-md px-3 py-2" required />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full border rounded-md px-3 py-2" required />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border rounded-md px-3 py-2" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full border rounded-md px-3 py-2" />
          <input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="License number" className="w-full border rounded-md px-3 py-2" required />
          <input value={gstNo} onChange={(e) => setGstNo(e.target.value)} placeholder="GST number (optional)" className="w-full border rounded-md px-3 py-2" />

          <div className="flex items-center justify-end gap-3 mt-4">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              {loading ? 'Saving...' : store ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreProfilePage;
