/* src/components/CarritoModal.jsx */
import { useEffect, useState } from 'react'
import './CarritoModal.css'
import {
  obtenerProductosDelCarrito,
  actualizarCantidadEnCarrito,
  eliminarItemDelCarrito,
  obtenerProductosLocal
} from '../utils/indexedDB'
import useOnlineStatus from '../utils/useOnlineStatus'

export default function CarritoModal({ abierto, cerrar, carrito, setCarrito }) {
  const [productosCarrito, setProductosCarrito] = useState([])
  const online = useOnlineStatus()

  useEffect(() => {
    if (!abierto) return
    cargarCarrito()
  }, [abierto])

  const cargarCarrito = async () => {
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

  const totalCantidad = productosCarrito.reduce((sum, i) => sum + i.quantity, 0)
  const totalPagar   = productosCarrito.reduce((sum, i) => sum + i.total_price, 0)

  if (!abierto) return null

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
                    <button onClick={() => disminuir(item)}>-</button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const q = Math.max(1, Number(e.target.value))
                        actualizarCantidadEnCarrito(item.product_id, q)
                        setCarrito(prev => ({ ...prev, [item.product_id]: q }))
                        cargarCarrito()
                      }}
                      className="input-cantidad"
                    />
                    <button onClick={() => aumentar(item)}>+</button>
                    <button onClick={() => eliminar(item.product_id)}>🗑</button>
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
          <button className="btn-checkout">Checkout</button>
          <button className="btn-cerrar" onClick={cerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
