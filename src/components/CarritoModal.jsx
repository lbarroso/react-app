/* src/components/CarritoModal.jsx */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      const productos = await obtenerProductosLocal(almcnt)

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
      // ⭐ VALIDAR que el cliente tenga ID de Supabase
      if (!orderData.cliente.id || typeof orderData.cliente.id !== 'number') {
        throw new Error('El cliente seleccionado no tiene ID de Supabase. Recarga los clientes primero.')
      }
      
      // Calcular totales
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0)
      
      // TODO: Obtener user_id desde la sesión
      const userId = 'user_temp' // PLACEHOLDER
      
      // Preparar header del pedido
      const header = {
        customer_id: orderData.cliente.id,  // ⭐ NUEVO: ID de Supabase del cliente
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
      
      // 🚀 SINCRONIZACIÓN INMEDIATA: Disparar sync justo después de crear el pedido
      try {
        if (window.syncState && window.syncState.manualSync) {
          console.log('🚀 Iniciando sincronización inmediata del pedido recién creado...')
          const syncResult = await window.syncState.manualSync()
          
          if (syncResult.success && syncResult.synced > 0) {
            console.log(`✅ Sincronización inmediata exitosa: ${syncResult.synced} pedidos sincronizados`)
          } else {
            console.log('⚠️ Sincronización inmediata completada sin nuevos pedidos sincronizados')
          }
        } else {
          console.warn('⚠️ Sistema de sincronización no disponible - el pedido se sincronizará automáticamente')
        }
      } catch (syncError) {
        console.warn('⚠️ Error en sincronización inmediata (el pedido se sincronizará automáticamente):', syncError.message)
      }
      
      // Limpiar carrito del almacén
      await clearCarritoByAlmcnt(almcnt)
      console.log('✅ Carrito limpiado')
      
      // Mostrar confirmación con info de sincronización
      const syncMessage = window.syncState?.isOnline 
        ? '\n📤 Sincronizado automáticamente con Supabase!'
        : '\n📱 Guardado localmente - se sincronizará cuando esté online'
        
      alert(`✅ Pedido #${orderId} creado exitosamente!${syncMessage}\n\nCliente: ${orderData.cliente.name}\nTotal: $${totalAmount.toFixed(2)}\n\nRedirigiendo a gestión de pedidos...`)
      
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
        <div className="fixed inset-0 bg-primary flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-red-600 flex items-center">
                <span className="text-2xl mr-2">⚠️</span>
                Error
              </h3>
              <button 
                onClick={cerrar}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✖
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">No se pudo cargar la información del almacén.</p>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button 
                className="w-full bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                onClick={volverAlCarrito}
              >
                Volver al Carrito
              </button>
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

  // Mostrar CarritoModal normal con diseño Tailwind mejorado
  return (
    <div className="fixed inset-0 bg-primary  flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header mejorado */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-green-accent from-primary to-secondary text-white sm:rounded-t-2xl">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🛒</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Mi Carrito</h3>
              <p className="text-sm opacity-90">
                {online ? '🌐 Conectado' : '📱 Modo Offline'}
              </p>
            </div>
          </div>
          <button 
            onClick={cerrar}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
          >
            <span className="text-xl font-bold">✖</span>
          </button>
        </div>

        {/* Body scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {productosCarrito.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h4>
              <p className="text-gray-500">Agrega productos para comenzar tu pedido</p>
            </div>
          ) : (
            <div className="space-y-4">
              {productosCarrito.map(item => {
                const imagen = online
                  ? `/imagenes/${item.image || 'imagen.jpg'}`
                  : '/imagenes/imagen.jpg'
                
                return (
                  <div key={item.product_id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0">
                        <img 
                          src={imagen} 
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-gray-200"
                          onError={(e) => { e.target.src = '/imagenes/placeholder.png' }}
                        />
                      </div>
                      
                      {/* Info del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                              {item.name.length > 40
                                ? item.name.slice(0, 40) + '…'
                                : item.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              <span className="font-medium">{item.code}</span> • {item.unit}
                            </p>
                          </div>
                          
                          {/* Botón eliminar */}
                          <button 
                            onClick={() => eliminar(item.product_id)}
                            className="flex-shrink-0 bg-primary hover:bg-red-200 text-white rounded-lg p-2 transition-colors"
                            title="Eliminar producto"
                          >
                            <span className="text-white">🗑️</span>
                          </button>
                        </div>
                        
                        {/* Cálculo detallado del precio */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Precio unitario:</span>
                            <span className="font-semibold">${item.unit_price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Cantidad:</span>
                            <span className="font-semibold">{item.quantity} {item.unit}</span>
                          </div>
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">
                                ${item.unit_price.toFixed(2)} × {item.quantity} =
                              </span>
                              <span className="font-bold text-primary text-lg">
                                ${item.total_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Controles de cantidad */}
                        <div className="flex justify-center">
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
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer con totales y acciones */}
        {productosCarrito.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 sm:rounded-b-2xl">
            
            {/* Resumen de totales */}
            <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total de productos:</span>
                <span className="font-semibold text-lg">{totalCantidad}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-semibold">Total a pagar:</span>
                <span className="font-bold text-2xl text-primary">
                  ${totalPagar.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 bg-primary hover:bg-red-200 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={vaciar} 
                disabled={!productosCarrito.length}
              >
                🗑️ Vaciar Carrito
              </button>
              
              <button 
                className="flex-1 bg-green-accent from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={procederAlCheckout}
                disabled={productosCarrito.length === 0}
              >
                🚀 Proceder al Checkout
              </button>
            </div>
            
            <button 
              className="w-full mt-3 bg-secondary hover:bg-gray-300 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
              onClick={cerrar}
            >
              Seguir Comprando
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
