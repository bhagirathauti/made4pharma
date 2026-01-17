import React, { useState, useEffect } from 'react';
import { Table } from '../ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string | null;
  storeName?: string;
  createdAt: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const itemsPerPageOptions = [5,10, 20, 50, 100];
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: { users: [...] } }
        if (data && data.data && Array.isArray(data.data.users)) {
          setUsers(data.data.users);
        } else if (Array.isArray(data)) {
          setUsers(data as any);
        } else {
          console.error('Unexpected users response shape', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // client-side filtered data based on searchQuery
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const store = (u.storeName || '').toLowerCase();
    return name.includes(q) || email.includes(q) || store.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all system users and their permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            {itemsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          columns={[
            {
              id: 'name',
              header: 'Name',
              accessor: 'name',
              sortable: true,
            },
            {
              id: 'email',
              header: 'Email',
              accessor: 'email',
              sortable: true,
            },
            {
              id: 'role',
              header: 'Role',
              accessor: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  row.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-700'
                    : row.role === 'MEDICAL_OWNER'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {row.role.replace('_', ' ')}
                </span>
              ),
              sortable: true,
            },
            {
              id: 'store',
              header: 'Store',
              accessor: (row) => row.storeName || 'N/A',
              sortable: true,
            },
            {
              id: 'createdAt',
              header: 'Created At',
              accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
              sortable: true,
            },
          ]}
          data={filteredUsers}
          keyExtractor={(row) => row.id}
          loading={loading}
          searchable={true}
          searchPlaceholder="Search users..."
          onSearch={(q) => setSearchQuery(q)}
          pagination={true}
          itemsPerPage={itemsPerPage}
          emptyMessage="No users found"
          actions={[
            {
              label: 'Edit',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              onClick: (row) => console.log('Edit user:', row),
            },
            {
              label: 'Delete',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ),
              onClick: (row) => console.log('Delete user:', row),
              variant: 'danger',
            },
          ]}
        />
      </div>
    </div>
  );
};
