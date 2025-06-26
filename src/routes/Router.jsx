import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import OrdersPage from '../pages/OrdersPage'
import OrderDetail from '../pages/OrderDetail'
import ConfigPage from '../pages/ConfigPage'
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
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
