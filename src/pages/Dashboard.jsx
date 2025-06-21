/* src/pages/Dashboard.jsx */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { obtenerAlmcnt, cerrarSesion } from '../utils/session'
import {
  guardarProductos,
  obtenerProductosLocal,
  agregarItemAlCarrito,
  obtenerItemDelCarrito,
  actualizarCantidadEnCarrito,
  eliminarItemDelCarrito
} from '../utils/indexedDB'
import useOnlineStatus from '../utils/useOnlineStatus'
import ProductCard from '../components/ProductCard'
import CarritoModal from '../components/CarritoModal'
import './Dashboard.css';
import './Navbar.css';

export default function Dashboard () {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [scrollVisible, setScrollVisible] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const online = useOnlineStatus()
  const inputRef = useRef(null)

  const limpiarBusqueda = () => {
    setBusqueda('')
    inputRef.current?.focus()
  }

  useEffect(() => {
    const onScroll = () => setScrollVisible(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const cargarProductos = async () => {
      const almcnt = await obtenerAlmcnt()
      if (!almcnt) {
        cerrarSesion()
        return
      }

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('almcnt', almcnt)

        if (error) {
          console.error('Error al obtener productos:', error.message)
        } else {
          setProductos(data)
          await guardarProductos(data)
        }
      } else {
        const offline = await obtenerProductosLocal()
        setProductos(offline)
      }
    }

    cargarProductos()
  }, [])

  useEffect(() => {
    if (!productos.length) return
    ;(async () => {
      const pares = await Promise.all(
        productos.map(async p => {
          const item = await obtenerItemDelCarrito(p.id)
          return item ? { [p.id]: item.quantity } : {}
        })
      )
      setCarrito(Object.assign({}, ...pares))
    })()
  }, [productos])

  const agregarAlCarrito = async (producto) => {
    if (producto.stock <= 0) {
      alert('Producto sin stock disponible')
      return
    }
    await agregarItemAlCarrito(producto.id, 1, producto.price)
    setCarrito(prev => ({ ...prev, [producto.id]: 1 }))
  }

  const aumentarCantidad = async (producto) => {
    const actual = carrito[producto.id] ?? 0
    const nueva = actual + 1
    if (nueva > producto.stock) return
    await actualizarCantidadEnCarrito(producto.id, nueva)
    setCarrito(prev => ({ ...prev, [producto.id]: nueva }))
  }

  const disminuirCantidad = async (producto) => {
    const actual = carrito[producto.id] ?? 0
    const nueva = actual - 1
    if (nueva < 0) return

    if (nueva === 0) {
      await eliminarItemDelCarrito(producto.id)
      setCarrito(prev => {
        const copia = { ...prev }
        delete copia[producto.id]
        return copia
      })
    } else {
      await actualizarCantidadEnCarrito(producto.id, nueva)
      setCarrito(prev => ({ ...prev, [producto.id]: nueva }))
    }
  }

  const productosFiltrados = productos.filter(p =>
    (p.name?.toLowerCase().includes(busqueda.toLowerCase())) ||
    (p.code?.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const totalEnCarrito = Object.values(carrito).reduce((suma, cant) => suma + cant, 0)

  return (
    <div className="dashboard-container">

      <nav className="navbar">

        <div className="navbar-container">
          
            <div className="navbar-brand">
              <h1>📦 Pedidos Offline</h1>
              <span className="navbar-subtitle">Sistema de Pedidos PWA</span>
            </div>
            <div className='navbar-actions'>
            
                <span className={`connection-indicator}`}>
                  {online ? '🌐 Conectado a Internet' : '⚠️ Trabajando sin conexión'}
                </span>
                
          
                <button className="nav-btn orders-btn">📋 Pedidos</button>
                <button
                  className="nav-btn cart-btn"
                  disabled={totalEnCarrito === 0}
                  onClick={() => setModalAbierto(true)}
                >
                  🛒 Carrito{totalEnCarrito > 0 ? <sup className="cart-badge">{totalEnCarrito}</sup> : ''}
                </button>

            </div>

        </div>

        {/* Buscador al estilo Aurrera */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Buscar producto por nombre o código"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                className="clear-button"
                onClick={limpiarBusqueda}
                aria-label="Limpiar búsqueda"
              >
                ❌
              </button>
            )}
          </div>
        </div>

      </nav>

      <main className="main-content">

        <h2>Catálogo de Productos</h2>

        <div className="product-grid">
          {productosFiltrados.length
            ? productosFiltrados.map(p => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  cantidad={carrito[p.id] || 0}
                  agregarAlCarrito={agregarAlCarrito}
                  aumentarCantidad={aumentarCantidad}
                  disminuirCantidad={disminuirCantidad}
                />
              ))
            : <p>No se encontraron productos.</p>}
        </div>
      </main>


      <CarritoModal
        abierto={modalAbierto}
        cerrar={() => setModalAbierto(false)}
        carrito={carrito}
        setCarrito={setCarrito}
      />
    </div>
  )
}
