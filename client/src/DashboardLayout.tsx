import React, { useState } from 'react';
import {
  Sidebar,
  Navbar,
  Breadcrumbs,
  Table,
  useToast,
  ConfirmDialog,
} from './components/ui';
import type {
  SidebarItem,
  NavbarUser,
  Store,
  BreadcrumbItem,
  TableColumn,
  TableAction,
} from './components/ui';

interface Patient {
  id: string;
  name: string;
  age: number;
  status: 'active' | 'inactive';
  lastVisit: string;
  doctor: string;
}

const mockPatients: Patient[] = [
  { id: '1', name: 'John Doe', age: 45, status: 'active', lastVisit: '2026-01-01', doctor: 'Dr. Smith' },
  { id: '2', name: 'Jane Smith', age: 32, status: 'active', lastVisit: '2025-12-28', doctor: 'Dr. Johnson' },
  { id: '3', name: 'Bob Wilson', age: 58, status: 'inactive', lastVisit: '2025-11-15', doctor: 'Dr. Smith' },
  { id: '4', name: 'Alice Brown', age: 28, status: 'active', lastVisit: '2026-01-02', doctor: 'Dr. Lee' },
  { id: '5', name: 'Charlie Davis', age: 67, status: 'active', lastVisit: '2025-12-30', doctor: 'Dr. Johnson' },
  { id: '6', name: 'Emma Garcia', age: 41, status: 'inactive', lastVisit: '2025-10-20', doctor: 'Dr. Lee' },
  { id: '7', name: 'Frank Miller', age: 54, status: 'active', lastVisit: '2025-12-25', doctor: 'Dr. Smith' },
  { id: '8', name: 'Grace Taylor', age: 36, status: 'active', lastVisit: '2026-01-01', doctor: 'Dr. Johnson' },
];

export const DashboardLayout: React.FC = () => {
  const { showToast } = useToast();
  const [currentPath, setCurrentPath] = useState('/patients');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [currentStore, setCurrentStore] = useState<Store>({ id: '1', name: 'Main Hospital' });

  const user: NavbarUser = {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hospital.com',
    role: 'Administrator',
  };

  const stores: Store[] = [
    { id: '1', name: 'Main Hospital' },
    { id: '2', name: 'East Clinic' },
    { id: '3', name: 'West Medical Center' },
  ];

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'patients',
      label: 'Patients',
      path: '/patients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      badge: 8,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      path: '/appointments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: 3,
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      roles: ['admin', 'doctor'],
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Patients', path: '/patients' },
  ];

  const columns: TableColumn<Patient>[] = [
    {
      id: 'name',
      header: 'Patient Name',
      accessor: 'name',
      sortable: true,
      width: '25%',
    },
    {
      id: 'age',
      header: 'Age',
      accessor: 'age',
      sortable: true,
      width: '10%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: false,
      width: '15%',
    },
    {
      id: 'lastVisit',
      header: 'Last Visit',
      accessor: 'lastVisit',
      sortable: true,
      width: '20%',
    },
    {
      id: 'doctor',
      header: 'Doctor',
      accessor: 'doctor',
      sortable: true,
      width: '30%',
    },
  ];

  const actions: TableAction<Patient>[] = [
    {
      label: 'View Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      onClick: (patient) => {
        showToast('info', `Viewing details for ${patient.name}`);
      },
    },
    {
      label: 'Edit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      onClick: (patient) => {
        showToast('info', `Editing ${patient.name}`);
      },
    },
    {
      label: 'Delete',
      variant: 'danger',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      onClick: (patient) => {
        setPatientToDelete(patient);
        setDeleteDialogOpen(true);
      },
      show: (patient) => patient.status === 'inactive',
    },
  ];

  const handleLogout = () => {
    showToast('success', 'Logged out successfully');
  };

  const handleDeleteConfirm = () => {
    if (patientToDelete) {
      showToast('success', `Deleted patient: ${patientToDelete.name}`);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activePath={currentPath}
        onNavigate={setCurrentPath}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        logo={
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        }
        appName="MediCare"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          user={user}
          stores={stores}
          currentStore={currentStore}
          onStoreChange={setCurrentStore}
          onLogout={handleLogout}
          onThemeToggle={() => showToast('info', 'Theme toggle clicked')}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbs} onNavigate={setCurrentPath} />

            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and view all patient records in the system
              </p>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              data={mockPatients}
              keyExtractor={(row) => row.id}
              actions={actions}
              searchable
              searchPlaceholder="Search patients..."
              selectable
              pagination
              itemsPerPage={5}
              emptyMessage="No patients found"
            />
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        description={`Are you sure you want to delete ${patientToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
