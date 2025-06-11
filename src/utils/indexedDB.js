import { openDB } from 'idb'

const DB_NAME = 'PedidosDB'
const STORE_NAME = 'productos'

// Abrir o crear la base de datos con un store "productos"
export async function getDB() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function guardarProductos(productos) {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  for (const producto of productos) {
    await store.put(producto)
  }

  await tx.done
}

export async function obtenerProductosLocal() {
  const db = await getDB()
  return await db.getAll(STORE_NAME)
}

export async function limpiarProductos() {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  await tx.objectStore(STORE_NAME).clear()
  await tx.done
}
