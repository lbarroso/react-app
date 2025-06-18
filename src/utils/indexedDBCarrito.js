const DB_NAME = 'PedidosDB'
const DB_VERSION = 3
const STORE_NAME = 'carrito_items'

function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'product_id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function agregarItemAlCarrito(product_id, quantity, unit_price) {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const total_price = unit_price * quantity
  await store.put({ product_id, quantity, unit_price, total_price, status: 0 })
  await tx.complete
  db.close()
}

export async function obtenerItemDelCarrito(product_id) {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const item = await store.get(product_id)
  await tx.complete
  db.close()
  return item
}

export async function actualizarCantidadEnCarrito(product_id, quantity) {
    const db = await abrirDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const item = await store.get(product_id)
  
    if (!item || typeof item.product_id === 'undefined') {
      console.warn('Producto no encontrado o sin product_id válido')
      await tx.complete
      db.close()
      return
    }
  
    const nuevo = {
      product_id: product_id,
      unit_price: item.unit_price,
      quantity,
      total_price: item.unit_price * quantity,
      status: item.status ?? 0
    }
  
    await store.put(nuevo)
    await tx.complete
    db.close()
  }
  

export async function eliminarItemDelCarrito(product_id) {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  await store.delete(product_id)
  await tx.complete
  db.close()
}
 