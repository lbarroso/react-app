import { useEffect, useState } from 'react'
import './CarritoModal.css'
import {
  obtenerProductosDelCarrito,
  actualizarCantidadEnCarrito,
  eliminarItemDelCarrito,
  obtenerProductosLocal
} from '../utils/indexedDB'

export default function CarritoModal({ abierto, cerrar, carrito, setCarrito }) {
  const [productosCarrito, setProductosCarrito] = useState([])

  useEffect(() => {
    if (!abierto) return
    cargarCarrito()
  }, [abierto])

  const cargarCarrito = async () => {
    const items = await obtenerProductosDelCarrito()
    const productos = await obtenerProductosLocal()

    // combinar carrito_items con info de productos
    const itemsCompletos = items.map(item => {
      const producto = productos.find(p => p.id === item.product_id) || {}
      return {
        ...item,
        name: producto.name || `ID ${item.product_id}`,
        unit: producto.unit || '',
        image: producto.image || '/imagenes/placeholder.png'
      }
    })

    setProductosCarrito(itemsCompletos)
  }

  const aumentar = async (item) => {
    if (item.quantity >= item.stock) return
    const nueva = item.quantity + 1
    await actualizarCantidadEnCarrito(item.product_id, nueva)
    setCarrito(prev => ({ ...prev, [item.product_id]: nueva }))
    cargarCarrito()
  }

  const disminuir = async (item) => {
    const nueva = item.quantity - 1
    if (nueva < 1) {
      await eliminarItemDelCarrito(item.product_id)
      const copia = { ...carrito }
      delete copia[item.product_id]
      setCarrito(copia)
    } else {
      await actualizarCantidadEnCarrito(item.product_id, nueva)
      setCarrito(prev => ({ ...prev, [item.product_id]: nueva }))
    }
    cargarCarrito()
  }

  const eliminar = async (id) => {
    await eliminarItemDelCarrito(id)
    const copia = { ...carrito }
    delete copia[id]
    setCarrito(copia)
    cargarCarrito()
  }

  const vaciar = async () => {
    for (const item of productosCarrito) {
      await eliminarItemDelCarrito(item.product_id)
    }
    setCarrito({})
    setProductosCarrito([])
  }

  const totalCantidad = productosCarrito.reduce((suma, item) => suma + item.quantity, 0)
  const totalPagar   = productosCarrito.reduce((suma, item) => suma + item.total_price, 0)

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
            productosCarrito.map(item => (
              <div key={item.product_id} className="carrito-producto">
                <img src={item.image} alt="img" />
                <div className="carrito-info">
                  <h4>{item.name}</h4>
                  <small>${item.unit_price.toFixed(2)} x {item.quantity} / {item.unit}</small>
                  <div><strong>${item.total_price.toFixed(2)}</strong></div>
                </div>
                <div className="controles-cantidad">
                  <button onClick={() => disminuir(item)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => aumentar(item)}>+</button>
                  <button onClick={() => eliminar(item.product_id)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="totales">
          <div>Total productos: <strong>{totalCantidad}</strong></div>
          <div>Total a pagar: <strong>${totalPagar.toFixed(2)}</strong></div>
        </div>

        <div className="modal-footer">
          <button className="btn-vaciar" onClick={vaciar} disabled={!productosCarrito.length}>Vaciar</button>
          <button className="btn-checkout">Checkout</button>
          <button className="btn-cerrar" onClick={cerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
