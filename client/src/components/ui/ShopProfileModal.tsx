import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (store: { id: string; name: string }) => void;
}

export const ShopProfileModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stores/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, address, phone, email, licenseNo, gstNo }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to save store profile');
        return;
      }

      const store = data.data.store;
      // persist minimal store info for UI checks
      if (store) {
        localStorage.setItem('storeId', store.id);
        localStorage.setItem('storeName', store.name || '');
      }

      onSaved({ id: store.id, name: store.name });
      onClose();
    } catch (err) {
      setError('Error saving store profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} closeOnEscape={false} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={undefined}>Complete Your Shop Profile</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">Please provide your shop details to continue.</p>

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

          <div className="grid grid-cols-1 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" className="border px-3 py-2 rounded-md w-full" required />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="border px-3 py-2 rounded-md w-full" required />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="border px-3 py-2 rounded-md w-full" required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="border px-3 py-2 rounded-md w-full" />
            <input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="License number" className="border px-3 py-2 rounded-md w-full" required />
            <input value={gstNo} onChange={(e) => setGstNo(e.target.value)} placeholder="GST number (optional)" className="border px-3 py-2 rounded-md w-full" />
          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => {}} disabled className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ShopProfileModal;
