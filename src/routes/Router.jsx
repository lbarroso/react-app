import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import OrdersPage from '../pages/OrdersPage'
import OrderDetail from '../pages/OrderDetail'
import ConfigPage from '../pages/ConfigPage'
import AdminDashboard from '../admin/pages/AdminDashboard'
import CsvUpload from '../admin/pages/CsvUpload'
import OrdersCsvExport from '../admin/pages/OrdersCsvExport'
import AdminCatalog from '../admin/pages/AdminCatalog'
import PrivateRoute from './PrivateRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/pedidos" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/pedidos/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/config" element={<PrivateRoute><ConfigPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/upload-csv" element={<PrivateRoute><CsvUpload /></PrivateRoute>} />
        <Route path="/admin/export-orders" element={<PrivateRoute><OrdersCsvExport /></PrivateRoute>} />
        <Route path="/admin/catalog" element={<PrivateRoute><AdminCatalog /></PrivateRoute>} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
