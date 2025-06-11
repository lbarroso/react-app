import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { obtenerAlmcnt, cerrarSesion } from '../utils/session'
import {
  guardarProductos,
  obtenerProductosLocal
} from '../utils/indexedDB'
import './Dashboard.css'

export default function Dashboard() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    const almcnt = obtenerAlmcnt()
    if (!almcnt) {
      cerrarSesion()
      return
    }

    const cargarProductos = async () => {
      if (navigator.onLine) {
        // Online: cargar desde Supabase
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('almcnt', almcnt)

        if (error) {
          console.error('Error al obtener productos:', error.message)
        } else {
          setProductos(data)
          await guardarProductos(data) // Guardar para modo offline
        }
      } else {
        // Offline: cargar desde IndexedDB
        const offlineData = await obtenerProductosLocal()
        setProductos(offlineData)
      }
    }

    cargarProductos()
  }, [])

  return (
    <div className="dashboard-container">
      <header className="navbar">
        <div className="navbar-content">
          <span className="logo">🛒 Pedidos</span>
          <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main className="main-content">
        <h2>Productos de mi almacén</h2>
        <ul>
          {productos.map((p) => (
            <li key={p.id}>{p.name} — ${p.price}</li>
          ))}
        </ul>
      </main>
    </div>
  )
}
