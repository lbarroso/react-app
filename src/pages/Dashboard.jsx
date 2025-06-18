/* src/pages/Dashboard.jsx */

import { useEffect, useState } from 'react'
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
import './Dashboard.css'

export default function Dashboard () {
  const [productos, setProductos] = useState([])
  const [carrito,  setCarrito]   = useState({})
  const [busqueda, setBusqueda]  = useState('')
  const [scrollVisible, setScrollVisible] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const online = useOnlineStatus()

  useEffect(() => {
    const onScroll = () => setScrollVisible(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const almcnt = obtenerAlmcnt()
    if (!almcnt) { cerrarSesion(); return }

    const cargarProductos = async () => {
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
    (async () => {
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
    const nueva  = actual + 1
    if (nueva > producto.stock) return
    await actualizarCantidadEnCarrito(producto.id, nueva)
    setCarrito(prev => ({ ...prev, [producto.id]: nueva }))
  }

  const disminuirCantidad = async (producto) => {
    const actual = carrito[producto.id] ?? 0
    const nueva  = actual - 1
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
      <header className="navbar">
        <div className="navbar-content">
          <div className="left-section d-flex align-items-center gap-2">
            <img src="/logoTdaBienestar.png" alt="Logo Tienda Bienestar" className="logo-img img-fluid"/>
            <span className={`status-icon ${online ? 'online' : 'offline'}`}>
              {online ? '🌐' : '⚠️'}
            </span>
          </div>

          <div className="right-section">
            <button className="nav-button">Pedidos</button>
            <button
              className="nav-button"
              disabled={totalEnCarrito === 0}
              onClick={() => setModalAbierto(true)}
            >
              🛒 {totalEnCarrito > 0 ? <sup>{totalEnCarrito}</sup> : ''}
            </button>
            
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="buscador-box">
          <span className="lupa-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar producto por nombre o código"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-buscador"
          />
        </div>

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

      {scrollVisible && (
        <a
          className="scroll-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️
        </a>
      )}

      <CarritoModal
        abierto={modalAbierto}
        cerrar={() => setModalAbierto(false)}
        carrito={carrito}
        setCarrito={setCarrito}
      />
    </div>
  )
}