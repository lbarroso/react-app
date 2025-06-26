/* src/components/CarritoModal.jsx */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CarritoModal.css'
import {
  obtenerProductosDelCarrito,
  actualizarCantidadEnCarrito,
  eliminarItemDelCarrito,
  obtenerProductosLocal,
  createPedido,
  clearCarritoByAlmcnt
} from '../utils/indexedDB'
import useOnlineStatus from '../utils/useOnlineStatus'
import CheckoutModal from './CheckoutModal'
import { useClientesLocal } from '../hooks/useClientesLocal'
import { obtenerAlmcnt } from '../utils/session'
import NumberStepper from './NumberStepper'

export default function CarritoModal({ abierto, cerrar, carrito, setCarrito }) {
  const navigate = useNavigate()
  const [productosCarrito, setProductosCarrito] = useState([])
  const [modalState, setModalState] = useState('CARRITO') // 'CARRITO' | 'CLIENT_SELECTION'
  const [almcnt, setAlmcnt] = useState(null)
  const online = useOnlineStatus()

  // Hook para manejo de clientes - solo se activa cuando tenemos almcnt
  const clientesHook = useClientesLocal(almcnt, { autoLoad: !!almcnt })

  useEffect(() => {
    if (!abierto) return
    
    // Resetear estado del modal al abrir
    setModalState('CARRITO')
    cargarCarrito()
    
    // Obtener almcnt de forma asíncrona
    const loadAlmcnt = async () => {
      try {
        const userAlmcnt = await obtenerAlmcnt()
        setAlmcnt(userAlmcnt)
      } catch (error) {
        console.error('Error obteniendo almcnt:', error)
      }
    }
    
    loadAlmcnt()
  }, [abierto])

  const cargarCarrito = async () => {
    try {
      // 1. Leemos todos los registros del carrito y los datos maestros de productos
      const items = await obtenerProductosDelCarrito()
      const productos = await obtenerProductosLocal()

      // 2. Los combinamos para enriquecer con nombre, unit, image, code, etc.
      const itemsCompletos = items.map(item => {
        const producto = productos.find(p => p.id === item.product_id) || {}
        return {
          ...item,
          name: producto.name || `ID ${item.product_id}`,
          unit: producto.unit || '',
          image: producto.image || '/imagenes/placeholder.png',
          code: producto.code || ''
        }
      })

      // 3. Ordenamos ASC por added_at (timestamp de inserción) → primer agregado, primero en la lista
      itemsCompletos.sort((a, b) => a.added_at - b.added_at)

      // 4. Actualizamos estado
      setProductosCarrito(itemsCompletos)
    } catch (error) {
      console.error('Error cargando carrito:', error)
    }
  }

  const aumentar = async (item) => {
    const nueva = item.quantity + 1
    await actualizarCantidadEnCarrito(item.product_id, nueva)
    setCarrito(prev => ({ ...prev, [item.product_id]: nueva }))
    cargarCarrito()
  }

  const disminuir = async (item) => {
    const nueva = item.quantity - 1
    if (nueva < 1) {
      await eliminarItemDelCarrito(item.product_id)
      setCarrito(prev => {
        const copia = { ...prev }
        delete copia[item.product_id]
        return copia
      })
    } else {
      await actualizarCantidadEnCarrito(item.product_id, nueva)
      setCarrito(prev => ({ ...prev, [item.product_id]: nueva }))
    }
    cargarCarrito()
  }

  const eliminar = async (id) => {
    await eliminarItemDelCarrito(id)
    setCarrito(prev => {
      const copia = { ...prev }
      delete copia[id]
      return copia
    })
    cargarCarrito()
  }

  const vaciar = async () => {
    for (const item of productosCarrito) {
      await eliminarItemDelCarrito(item.product_id)
    }
    setCarrito({})
    setProductosCarrito([])
  }

  // Función para proceder al checkout
  const procederAlCheckout = () => {
    if (productosCarrito.length === 0) {
      alert('Tu carrito está vacío')
      return
    }
    
    if (!almcnt) {
      alert('Error: No se pudo obtener información del almacén')
      return
    }
    
    setModalState('CLIENT_SELECTION')
  }

  // Función para volver al carrito desde la selección de cliente
  const volverAlCarrito = () => {
    setModalState('CARRITO')
  }

  // Función para manejar la creación del pedido
  const handleCreateOrder = async (orderData) => {
    console.log('📦 Creando pedido real:', orderData)
    
    try {
      // Calcular totales
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0)
      
      // TODO: Obtener user_id desde la sesión
      const userId = 'user_temp' // PLACEHOLDER
      
      // Preparar header del pedido
      const header = {
        almcnt: orderData.almcnt,
        ctecve: orderData.cliente.ctecve,
        ctename: orderData.cliente.name,
        user_id: userId,
        total_amount: totalAmount,
        notes: ''
      }
      
      // Preparar items
      const items = orderData.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        product_name: item.name || '',
        product_code: item.code || ''
      }))
      
      console.log('📝 Guardando en IndexedDB...')
      console.log('📝 Header:', header)
      console.log('📝 Items:', items)
      
      // FASE 3: Crear pedido real
      const orderId = await createPedido(header, items)
      console.log(`✅ Pedido creado con ID: ${orderId}`)
      
      // Limpiar carrito del almacén
      await clearCarritoByAlmcnt(almcnt)
      console.log('✅ Carrito limpiado')
      
      // Mostrar confirmación
      alert(`✅ Pedido #${orderId} creado exitosamente!\n\nCliente: ${orderData.cliente.name}\nTotal: $${totalAmount.toFixed(2)}\n\nRedirigiendo a gestión de pedidos...`)
      
      // Cerrar modal y navegar a pedidos
      setModalState('CARRITO')
      cerrar()
      
      // Limpiar estado del carrito
      setCarrito({})
      setProductosCarrito([])
      
      // Navegar a la página de pedidos
      navigate('/pedidos')
      
    } catch (error) {
      console.error('❌ Error creando pedido:', error)
      alert(`❌ Error al crear pedido: ${error.message}`)
    }
  }

  const totalCantidad = productosCarrito.reduce((sum, i) => sum + i.quantity, 0)
  const totalPagar   = productosCarrito.reduce((sum, i) => sum + i.total_price, 0)

  if (!abierto) return null

  // Mostrar CheckoutModal si estamos en selección de cliente
  if (modalState === 'CLIENT_SELECTION') {
    if (!almcnt) {
      return (
        <div className="carrito-overlay">
          <div className="carrito-modal">
            <div className="modal-header">
              <h3>⚠️ Error</h3>
              <button onClick={cerrar}>✖</button>
            </div>
            <div className="modal-body">
              <p>No se pudo cargar la información del almacén.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar" onClick={volverAlCarrito}>Volver al Carrito</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <CheckoutModal
        isOpen={true}
        onClose={cerrar}
        onBackToCart={volverAlCarrito}
        onCreateOrder={handleCreateOrder}
        cartItems={productosCarrito}
        clientesHook={clientesHook}
      />
    )
  }

  // Mostrar CarritoModal normal
  return (
    <div className="carrito-overlay">
      <div className="carrito-modal">
        <div className="modal-header">
          <h3>🛒 Carrito</h3>
          <button onClick={cerrar}>✖</button>
        </div>

        <div className="modal-body">
          {productosCarrito.length === 0 ? (
            <p>Tu carrito está vacío.</p>
          ) : (
            productosCarrito.map(item => {
              const imagen = online
                ? `/imagenes/${item.image || 'imagen.jpg'}`
                : '/imagenes/imagen.jpg'
              return (
                <div key={item.product_id} className="carrito-producto">
                  <img src={imagen} alt={item.name} />
                  <div className="carrito-info">
                    <h4>
                      {item.name.length > 25
                        ? item.name.slice(0, 25) + '…'
                        : item.name}
                    </h4>
                    <small>{item.code} {item.unit}</small>
                    <div><strong>${item.total_price.toFixed(2)}</strong></div>
                  </div>
                  <div className="controles-cantidad">
                    <NumberStepper
                      value={item.quantity}
                      min={1}
                      max={9999}
                      onChange={(newQuantity) => {
                        actualizarCantidadEnCarrito(item.product_id, newQuantity)
                        setCarrito(prev => ({ ...prev, [item.product_id]: newQuantity }))
                        cargarCarrito()
                      }}
                      size="small"
                    />
                    <button 
                      onClick={() => eliminar(item.product_id)}
                      className="btn btn-icon-sm"
                      style={{backgroundColor: 'var(--error-color)', color: 'white', marginLeft: 'var(--space-sm)'}}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="totales">
          <div>Total productos: <strong>{totalCantidad}</strong></div>
          <div>Total a pagar: <strong>${totalPagar.toFixed(2)}</strong></div>
        </div>

        <div className="modal-footer">
          <button className="btn-vaciar" onClick={vaciar} disabled={!productosCarrito.length}>
            Vaciar
          </button>
          <button 
            className="btn-checkout" 
            onClick={procederAlCheckout}
            disabled={productosCarrito.length === 0}
          >
            Proceder al Checkout
          </button>
          <button className="btn-cerrar" onClick={cerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
