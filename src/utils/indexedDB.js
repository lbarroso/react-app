import { getDB, STORES, CLIENTES_STORE } from './getDB'

const PRODUCTOS_STORE = STORES.PRODUCTOS
const CARRITO_STORE = STORES.CARRITO

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

/**
 * Agrega un item al carrito con cantidad específica en piezas
 * @param {number} product_id - ID del producto
 * @param {number} quantity - Cantidad SIEMPRE en piezas (nunca en unidades)
 * @param {number} unit_price - Precio unitario del producto
 */
export async function agregarItemAlCarrito(product_id, quantity, unit_price) {
  // Validaciones de entrada
  if (!product_id || quantity <= 0 || unit_price < 0) {
    throw new Error('Parámetros inválidos para agregar item al carrito');
  }

  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  
  // Verificar si el item ya existe en el carrito
  const existingItem = await store.get(product_id);
  
  const total_price = unit_price * quantity;
  
  if (existingItem) {
    // Si existe, sumar a la cantidad existente
    existingItem.quantity += quantity;
    existingItem.total_price = existingItem.unit_price * existingItem.quantity;
    existingItem.updated_at = Date.now();
    await store.put(existingItem);
  } else {
    // Si no existe, crear nuevo item
    await store.put({
      product_id,
      quantity, // Siempre en piezas
      unit_price,
      total_price,
      status: 0,
      added_at: Date.now(),
      updated_at: Date.now()
    });
  }
  
  await tx.done
}

export async function obtenerProductosDelCarrito() {
  const db = await getDB()
  return await db.getAll(CARRITO_STORE)
}

export async function actualizarCantidadEnCarrito(product_id, quantity) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  const item = await store.get(product_id)
  if (!item) return
  item.quantity = quantity
  item.total_price = quantity * item.unit_price
  await store.put(item)
  await tx.done
}

export async function eliminarItemDelCarrito(product_id) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  await tx.objectStore(CARRITO_STORE).delete(product_id)
  await tx.done
}

export async function obtenerItemDelCarrito(product_id) {
  const db = await getDB()
  return await db.get(CARRITO_STORE, product_id)
}

/**
 * Guarda o actualiza una lista de clientes en IndexedDB usando upsert masivo
 * @param {Array<{almcnt: number, ctecve: number, name: string}>} clientes - Lista de clientes
 * @returns {Promise<number>} Número de clientes procesados
 */
export async function cacheClients(clientes = []) {
  if (!Array.isArray(clientes) || clientes.length === 0) {
    console.warn('cacheClients: Lista de clientes vacía o inválida')
    return 0
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CLIENTES_STORE, 'readwrite')
    const store = tx.objectStore(CLIENTES_STORE)
    
    let processed = 0
    for (const cliente of clientes) {
      // Validar estructura del cliente
      if (!cliente || typeof cliente !== 'object') {
        console.warn('Cliente inválido encontrado:', cliente)
        continue
      }

      const { almcnt, ctecve, name } = cliente
      
      // Validar campos requeridos
      if (typeof almcnt !== 'number' || typeof ctecve !== 'number' || !name) {
        console.warn('Cliente con datos inválidos:', cliente)
        continue
      }

      await store.put({
        almcnt,
        ctecve,
        name: String(name).trim() // Asegurar que name sea string y sin espacios extra
      })
      processed++
    }
    
    await tx.done
    console.log(`cacheClients: ${processed} clientes procesados exitosamente`)
    return processed
    
  } catch (error) {
    console.error('Error en cacheClients:', error)
    throw new Error(`Error al cache clientes: ${error.message}`)
  }
}

/**
 * Obtiene todos los clientes de un almacén específico, ordenados alfabéticamente
 * @param {number} almcnt - Código del almacén
 * @returns {Promise<Array<{almcnt: number, ctecve: number, name: string}>>}
 */
export async function getClientsLocal(almcnt) {
  if (typeof almcnt !== 'number' || almcnt <= 0) {
    console.warn('getClientsLocal: almcnt inválido:', almcnt)
    return []
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CLIENTES_STORE, 'readonly')
    const index = tx.store.index('by-almcnt')
    const clientes = await index.getAll(almcnt)
    await tx.done
    
    // Ordenar alfabéticamente por nombre
    return clientes.sort((a, b) => a.name.localeCompare(b.name, 'es', { 
      sensitivity: 'base',
      numeric: true 
    }))
    
  } catch (error) {
    console.error('Error en getClientsLocal:', error)
    return []
  }
}

/**
 * Busca clientes por nombre con coincidencia parcial (case-insensitive)
 * @param {number} almcnt - Código del almacén
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} limit - Máximo número de resultados (default: 50)
 * @returns {Promise<Array<{almcnt: number, ctecve: number, name: string}>>}
 */
export async function searchClientsByName(almcnt, searchTerm, limit = 50) {
  if (typeof almcnt !== 'number' || almcnt <= 0) {
    return []
  }

  if (!searchTerm || typeof searchTerm !== 'string') {
    return await getClientsLocal(almcnt)
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CLIENTES_STORE, 'readonly')
    const index = tx.store.index('by-almcnt')
    const allClients = await index.getAll(almcnt)
    await tx.done
    
    const search = searchTerm.toLowerCase().trim()
    
    const filtered = allClients.filter(cliente => 
      cliente.name.toLowerCase().includes(search)
    )
    
    // Ordenar por relevancia: coincidencias al inicio primero
    const sorted = filtered.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      
      const aStartsWith = aName.startsWith(search)
      const bStartsWith = bName.startsWith(search)
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      return aName.localeCompare(bName, 'es', { 
        sensitivity: 'base',
        numeric: true 
      })
    })
    
    return sorted.slice(0, limit)
    
  } catch (error) {
    console.error('Error en searchClientsByName:', error)
    return []
  }
}

/**
 * Encuentra un cliente específico por su código
 * @param {number} almcnt - Código del almacén  
 * @param {number} ctecve - Código del cliente
 * @returns {Promise<{almcnt: number, ctecve: number, name: string}|null>}
 */
export async function findClientByCode(almcnt, ctecve) {
  if (typeof almcnt !== 'number' || typeof ctecve !== 'number') {
    return null
  }

  try {
    const db = await getDB()
    const cliente = await db.get(CLIENTES_STORE, [almcnt, ctecve])
    return cliente || null
    
  } catch (error) {
    console.error('Error en findClientByCode:', error)
    return null
  }
}

/**
 * Obtiene el número total de clientes para un almacén
 * @param {number} almcnt - Código del almacén
 * @returns {Promise<number>}
 */
export async function getClientCount(almcnt) {
  if (typeof almcnt !== 'number' || almcnt <= 0) {
    return 0
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CLIENTES_STORE, 'readonly')
    const index = tx.store.index('by-almcnt')
    const count = await index.count(almcnt)
    await tx.done
    
    return count
    
  } catch (error) {
    console.error('Error en getClientCount:', error)
    return 0
  }
}

/**
 * Elimina todos los clientes de un almacén específico
 * @param {number} almcnt - Código del almacén
 * @returns {Promise<number>} Número de clientes eliminados
 */
export async function clearClientsForAlmacen(almcnt) {
  if (typeof almcnt !== 'number' || almcnt <= 0) {
    return 0
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CLIENTES_STORE, 'readwrite')
    const store = tx.objectStore(CLIENTES_STORE)
    const index = store.index('by-almcnt')
    
    let deleted = 0
    let cursor = await index.openCursor(almcnt)
    
    while (cursor) {
      await cursor.delete()
      deleted++
      cursor = await cursor.continue()
    }
    
    await tx.done
    console.log(`clearClientsForAlmacen: ${deleted} clientes eliminados para almcnt ${almcnt}`)
    return deleted
    
  } catch (error) {
    console.error('Error en clearClientsForAlmacen:', error)
    return 0
  }
}

/**
 * Obtiene estadísticas de clientes por almacén
 * @param {number} almcnt - Código del almacén
 * @returns {Promise<{total: number, hasData: boolean, lastClient: Object|null}>}
 */
export async function getClientStats(almcnt) {
  try {
    const clientes = await getClientsLocal(almcnt)
    
    return {
      total: clientes.length,
      hasData: clientes.length > 0,
      lastClient: clientes.length > 0 ? clientes[clientes.length - 1] : null
    }
    
  } catch (error) {
    console.error('Error en getClientStats:', error)
    return {
      total: 0,
      hasData: false,
      lastClient: null
    }
  }
}
