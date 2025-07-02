/* src/pages/Dashboard.jsx */

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function Dashboard () {
  const navigate = useNavigate()
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

  const agregarAlCarrito = async (producto, piezas = 1) => {
    if (producto.stock <= 0) return;

    await agregarItemAlCarrito(producto.id, piezas, producto.price);

    // ① refrescamos el estado local para que el badge y la UI cambien
    setCarrito(prev => ({
      ...prev,
      [producto.id]: (prev[producto.id] || 0) + piezas
    }));
  };

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
  
  // Obtener contador de pedidos pending desde window.syncState
  const syncStats = window.syncState?.syncStats || {}
  const pendingOrdersCount = syncStats.pendingCount || 0

  return (
    <div className="bg-gray-50 text-gray-800">

      <header className="fixed top-0 inset-x-0 z-50 bg-primary text-white shadow-md">

        <div className="flex items-center justify-between px-4 py-3">
          
			<div className="flex items-center gap-2">
			  <span className="text-2xl">📦</span>
				<span className={`px-3 py-1 rounded-full text-sm font-medium ${ online ? 'bg-white bg-opacity-30 text-white' : 'bg-gray-dark text-white' }`}>
					{online ? '🌐 Conectado' : '⚠️ Offline'}
				</span>		
			</div>
			
			<div className="flex items-center gap-3">
		  
				<button 
				  className="flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm font-semibold transition"
				  onClick={() => navigate('/pedidos')}
				>
				  📋 Pedidos
				  {pendingOrdersCount > 0 && (
					<sup className="ml-1 bg-yellow-400 text-white text-xs font-bold rounded-full px-2">{pendingOrdersCount}</sup>
				  )}
				</button>

				<button
				  className="relative flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm font-semibold transition disabled:opacity-50"
				  disabled={totalEnCarrito === 0}
				  onClick={() => setModalAbierto(true)}
				>
				  🛒 Carrito{totalEnCarrito > 0 ? <sup className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{totalEnCarrito}</sup> : ''}
				</button>

			</div>

        </div>
		
        {/* Buscador al estilo Aurrera */}
        <div className="bg-secondary px-4 pb-3 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center bg-gray-100 rounded-full px-4 py-2">
            <span className="text-gray-500 mr-2">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
              placeholder="Buscar producto por nombre o código"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                className="ml-2 text-gray-500 hover:text-red-500 transition"
                onClick={limpiarBusqueda}
                aria-label="Limpiar búsqueda"
              >
                ❌
              </button>
            )}
          </div>
        </div>

      </header>

      {/* separador para el header */}
      <div className="pt-[112px]" />
	  
      <main className="flex-1 px-4 pb-[76px]">

        <h2 className="text-2xl font-semibold text-brandGreen mb-4" >Catálogo de Productos</h2>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            : <p className="text-center text-gray-500">No se encontraron productos.</p>}
        </div>

      </main>

      {/* FOOTER móvil */}
		<footer className="fixed bottom-0 inset-x-0 z-50 bg-green-accent border-t shadow">
		  <nav className="flex justify-around py-2 text-xs text-white">
			{[
			  ['🏠', 'Ventas', ''],
			  ['🔍', 'Novedades', ''],
			  ['🛒', 'Pedido Sugerido', ''],
			  ['👤', 'Cuenta', ''],  // <─ añadimos la ruta aquí
			].map(([icon, label, to]) => (
			  <button
				key={label}
				onClick={() => navigate(to)}
				className="flex flex-col items-center gap-1"
			  >
				<span className="text-lg">{icon}</span>
				<span>{label}</span>
			  </button>
			))}
		  </nav>
		</footer>

      <CarritoModal
        abierto={modalAbierto}
        cerrar={() => setModalAbierto(false)}
        carrito={carrito}
        setCarrito={setCarrito}
      />
    </div>
  )
}
