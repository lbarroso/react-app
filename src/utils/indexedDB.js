import { openDB } from 'idb'

const DB_NAME = 'PedidosDB'
const DB_VERSION = 3
const PRODUCTOS_STORE = 'productos'
const CARRITO_STORE = 'carrito_items'

// Abre la base de datos y asegura que ambos stores existan
export async function getDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PRODUCTOS_STORE)) {
        db.createObjectStore(PRODUCTOS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CARRITO_STORE)) {
        db.createObjectStore(CARRITO_STORE, { keyPath: 'product_id' })
      }
    }
  })
}

// ========== FUNCIONES PARA PRODUCTOS ==========

export async function guardarProductos(productos) {
  const db = await getDB()
  const tx = db.transaction(PRODUCTOS_STORE, 'readwrite')
  const store = tx.objectStore(PRODUCTOS_STORE)

  for (const producto of productos) {
    await store.put(producto)
  }

  await tx.done
}

export async function obtenerProductosLocal() {
  const db = await getDB()
  return await db.getAll(PRODUCTOS_STORE)
}

export async function limpiarProductos() {
  const db = await getDB()
  const tx = db.transaction(PRODUCTOS_STORE, 'readwrite')
  await tx.objectStore(PRODUCTOS_STORE).clear()
  await tx.done
}

// ========== FUNCIONES PARA CARRITO ==========

export async function agregarItemAlCarrito(product_id, quantity, unit_price) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  const total_price = unit_price * quantity

  const nuevoItem = {
    product_id,
    quantity,
    unit_price,
    total_price,
    status: 0
  }

  await store.put(nuevoItem)
  await tx.done
}

export async function obtenerProductosDelCarrito() {
  const db = await getDB()
  const tx = db.transaction('carrito_items', 'readonly')
  const store = tx.objectStore('carrito_items')
  const items = await store.getAll()
  await tx.done
  return items
}

// indexedDB.js  (única fuente de verdad)
export async function actualizarCantidadEnCarrito(product_id, quantity) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)

  const item = await store.get(product_id)
  if (!item) {                     // <-- validación fuerte
    console.warn(`Producto id ${product_id} no existe en carrito_items`)
    await tx.done
    return
  }

  // objeto limpio, sólo primitivos
  await store.put({
    product_id,
    unit_price: item.unit_price,
    quantity,
    total_price: item.unit_price * quantity,
    status: item.status ?? 0
  })

  await tx.done
}


export async function eliminarItemDelCarrito(product_id) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  await store.delete(product_id)
  await tx.done
}

export async function obtenerItemDelCarrito(product_id) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readonly')
  const store = tx.objectStore(CARRITO_STORE)
  const item = await store.get(product_id)
  await tx.done
  return item
}
