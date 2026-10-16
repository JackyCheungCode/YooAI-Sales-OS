import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CustomersPage } from '../modules/customers/CustomersPage';
export default function App(){return <Routes><Route element={<AppLayout/>}><Route path="/" element={<Navigate to="/customers" replace/>}/><Route path="/customers" element={<CustomersPage/>}/><Route path="*" element={<Navigate to="/customers" replace/>}/></Route></Routes>}
