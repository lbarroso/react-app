import { openDB } from 'idb'

const DB_NAME = 'PedidosDB'
const DB_VERSION = 6  // Migración v6: añadimos nuevos stores

// Store names - Constants for consistency
export const STORES = {
  PRODUCTOS: 'productos',
  CARRITO: 'carrito_items', 
  SESSION: 'session_store',
  PEDIDOS: 'pedidos',
  PEDIDOS_ITEMS: 'pedidos_items',
  CLIENTES: 'clientes'
}

// Legacy exports for backward compatibility
export const PRODUCTOS_STORE = STORES.PRODUCTOS
export const CARRITO_STORE = STORES.CARRITO
export const SESSION_STORE = STORES.SESSION
export const PEDIDOS_STORE = STORES.PEDIDOS
export const PEDIDOS_ITEMS = STORES.PEDIDOS_ITEMS
export const CLIENTES_STORE = STORES.CLIENTES

/**
 * Opens and configures the IndexedDB database
 * @returns {Promise<IDBPDatabase>} Database instance
 */
export async function getDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`)
      
      // Store: productos (desde v1)
      if (!db.objectStoreNames.contains(STORES.PRODUCTOS)) {
        const productosStore = db.createObjectStore(STORES.PRODUCTOS, { 
          keyPath: 'id' 
        })
        productosStore.createIndex('by-category', 'category', { unique: false })
        productosStore.createIndex('by-brand', 'brand', { unique: false })
        productosStore.createIndex('by-active', 'active', { unique: false })
        console.log('Created productos store with indices')
      }

      // Store: carrito_items (desde v1)
      if (!db.objectStoreNames.contains(STORES.CARRITO)) {
        const carritoStore = db.createObjectStore(STORES.CARRITO, { 
          keyPath: 'product_id' 
        })
        carritoStore.createIndex('by-status', 'status', { unique: false })
        carritoStore.createIndex('by-added-date', 'added_at', { unique: false })
        console.log('Created carrito_items store with indices')
      }

      // Store: session_store (desde v2)
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        const sessionStore = db.createObjectStore(STORES.SESSION, { 
          keyPath: 'userId' 
        })
        sessionStore.createIndex('by-last-activity', 'lastActivity', { unique: false })
        console.log('Created session_store with indices')
      }

      // **NUEVOS STORES v6**: pedidos y pedidos_items
      if (!db.objectStoreNames.contains(STORES.PEDIDOS)) {
        const pedidosStore = db.createObjectStore(STORES.PEDIDOS, { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        // Índices para pedidos
        pedidosStore.createIndex('by-almcnt', 'almcnt', { unique: false })
        pedidosStore.createIndex('by-client', 'ctecve', { unique: false })
        pedidosStore.createIndex('by-date', 'created_at', { unique: false })
        pedidosStore.createIndex('by-status', 'status', { unique: false })
        pedidosStore.createIndex('by-sync-status', 'sync_status', { unique: false })
        console.log('✅ Created pedidos store with autoIncrement and indices')
      }

      if (!db.objectStoreNames.contains(STORES.PEDIDOS_ITEMS)) {
        const pedidosItemsStore = db.createObjectStore(STORES.PEDIDOS_ITEMS, {
          keyPath: 'id',
          autoIncrement: true
        })
        // Índices para pedidos_items
        pedidosItemsStore.createIndex('by-pedido', 'pedido_id', { unique: false })
        pedidosItemsStore.createIndex('by-product', 'product_id', { unique: false })
        pedidosItemsStore.createIndex('by-pedido-product', ['pedido_id', 'product_id'], { unique: true })
        console.log('✅ Created pedidos_items store with autoIncrement and indices')
      }

      // Store: clientes (NUEVO en v5)
      if (!db.objectStoreNames.contains(STORES.CLIENTES)) {
        const clientesStore = db.createObjectStore(STORES.CLIENTES, {
          keyPath: ['almcnt', 'ctecve'] // Clave compuesta
        })
        
        // Índices para búsquedas optimizadas
        clientesStore.createIndex('by-almcnt', 'almcnt', { unique: false })
        clientesStore.createIndex('by-name', 'name', { unique: false })
        clientesStore.createIndex('by-ctecve', 'ctecve', { unique: false })
        
        console.log('Created clientes store with composite key and indices')
      }

      // Upgrade data migrations if needed
      if (oldVersion < 5) {
        console.log('Running migration to v5...')
        // Migración de datos v5: clientes store
      }
      
      if (oldVersion < 6) {
        console.log('🚀 Running migration to v6: adding pedidos and pedidos_items stores')
        // Migración de datos v6: pedidos y pedidos_items stores
      }
    },

    blocked() {
      console.warn('Database upgrade blocked by another connection')
    },

    blocking() {
      console.warn('This connection is blocking a database upgrade')
    },

    terminated() {
      console.error('Database connection terminated unexpectedly')
    }
  })
}

/**
 * Gets database info for debugging
 * @returns {Promise<Object>} Database information
 */
export async function getDBInfo() {
  try {
    const db = await getDB()
    return {
      name: db.name,
      version: db.version,
      stores: Array.from(db.objectStoreNames),
      storeCount: db.objectStoreNames.length
    }
  } catch (error) {
    console.error('Error getting DB info:', error)
    return null
  }
}

/**
 * Clears all data from specified stores (for development/testing)
 * @param {string[]} storeNames - Store names to clear
 */
export async function clearStores(storeNames = []) {
  try {
    const db = await getDB()
    const tx = db.transaction(storeNames, 'readwrite')
    
    for (const storeName of storeNames) {
      await tx.objectStore(storeName).clear()
      console.log(`Cleared store: ${storeName}`)
    }
    
    await tx.done
  } catch (error) {
    console.error('Error clearing stores:', error)
  }
}
