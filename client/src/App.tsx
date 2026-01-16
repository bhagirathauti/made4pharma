import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CashierDashboard } from './pages/CashierDashboard';
import { MedicalOwnerDashboard } from './pages/MedicalOwnerDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/owner" element={<MedicalOwnerDashboard />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
