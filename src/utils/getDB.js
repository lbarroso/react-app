import { openDB } from 'idb'

const DB_NAME = 'PedidosDB'
const DB_VERSION = 4

export async function getDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('productos')) {
        db.createObjectStore('productos', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('carrito_items')) {
        db.createObjectStore('carrito_items', { keyPath: 'product_id' })
      }
      if (!db.objectStoreNames.contains('session_store')) {
        db.createObjectStore('session_store', { keyPath: 'userId' })
      }
    }
  })
}
