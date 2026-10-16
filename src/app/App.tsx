import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CustomersPage } from '../modules/customers/CustomersPage';
import { LeadsPage } from '../modules/leads/LeadsPage';
import { AccountsPage } from '../modules/accounts/AccountsPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { LoginPage } from '../modules/settings/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/leads" element={<LeadsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>;
}
