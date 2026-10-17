import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CustomersPage } from '../modules/customers/CustomersPage';
import { LeadsPage } from '../modules/leads/LeadsPage';
import { AccountsPage } from '../modules/accounts/AccountsPage';
import { ContactsPage } from '../modules/contacts/ContactsPage';
import { OpportunitiesPage } from '../modules/opportunities/OpportunitiesPage';
import { QuotesPage } from '../modules/quotes/QuotesPage';
import { OrdersPage } from '../modules/orders/OrdersPage';
import { PaymentsPage } from '../modules/payments/PaymentsPage';
import { ShipmentsPage } from '../modules/shipments/ShipmentsPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { LoginPage } from '../modules/settings/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AIProvidersPage } from '../modules/settings/AIProvidersPage';

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/leads" element={<LeadsPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/opportunities" element={<OpportunitiesPage />} />
      <Route path="/quotes" element={<QuotesPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/shipments" element={<ShipmentsPage />} />
      <Route path="/settings/ai-providers" element={<AIProvidersPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>;
}
