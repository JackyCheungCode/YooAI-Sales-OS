import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CustomersPage } from '../modules/customers/CustomersPage';
import { LoginPage } from '../modules/settings/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
export default function App(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}><Route path="/" element={<Navigate to="/customers" replace/>}/><Route path="/customers" element={<CustomersPage/>}/><Route path="*" element={<Navigate to="/customers" replace/>}/></Route></Routes>}
