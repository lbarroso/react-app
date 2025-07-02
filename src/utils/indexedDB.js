import { getDB, STORES, CLIENTES_STORE } from './getDB'

const PRODUCTOS_STORE = STORES.PRODUCTOS
const CARRITO_STORE = STORES.CARRITO
const PEDIDOS_STORE = STORES.PEDIDOS
const PEDIDOS_ITEMS_STORE = STORES.PEDIDOS_ITEMS

// ===== FUNCIONES DE PEDIDOS =====

/**
 * Crea un nuevo pedido con cabecera e items en una sola transacción
 * @param {object} header - Cabecera del pedido (DEBE incluir customer_id)
 * @param {Array} items - Items del pedido
 * @returns {Promise<number>} ID del pedido creado
 * 
 * @example
 * const header = {
 *   customer_id: 123,  // ⭐ REQUERIDO: ID de Supabase del cliente
 *   almcnt: 2033,
 *   ctecve: 54,
 *   ctename: "CLIENTE EJEMPLO",
 *   user_id: "user_temp",
 *   total_amount: 100.50,
 *   notes: ""
 * }
 */
export async function createPedido(header, items) {
  if (!header || !Array.isArray(items) || items.length === 0) {
    throw new Error('Header y items son requeridos')
  }

  // ⭐ VALIDAR que customer_id esté presente
  if (!header.customer_id || typeof header.customer_id !== 'number') {
    throw new Error('customer_id es requerido y debe ser el ID de Supabase del cliente')
  }

  try {
    const db = await getDB()
    const tx = db.transaction([PEDIDOS_STORE, PEDIDOS_ITEMS_STORE], 'readwrite')
    
    // 1. Insertar cabecera
    const pedidosStore = tx.objectStore(PEDIDOS_STORE)
    const pedidoData = {
      ...header,
      customer_id: header.customer_id,  // ⭐ NUEVO: ID del cliente de Supabase para sync
      status: 'pending',
      sync_status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const orderId = await pedidosStore.add(pedidoData)
    
    // 2. Insertar items
    const itemsStore = tx.objectStore(PEDIDOS_ITEMS_STORE)
    for (const item of items) {
      const itemData = {
        pedido_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        product_name: item.product_name || '',
        product_code: item.product_code || '',
        created_at: Date.now()
      }
      await itemsStore.add(itemData)
    }

    await tx.done
    console.log(`✅ Pedido ${orderId} creado con ${items.length} items`)
    return orderId

  } catch (error) {
    console.error('Error creando pedido:', error)
    throw new Error(`Error al crear pedido: ${error.message}`)
  }
}

/**
 * Obtiene pedidos por status
 * @param {string} status - 'pending' | 'processed'
 * @returns {Promise<Array>} Lista de pedidos
 */
export async function getPedidosByStatus(status) {
  try {
    const db = await getDB()
    const tx = db.transaction(PEDIDOS_STORE, 'readonly')
    const index = tx.store.index('by-status')
    const pedidos = await index.getAll(status)
    await tx.done

    return pedidos.sort((a, b) => b.created_at - a.created_at)

  } catch (error) {
    console.error(`Error obteniendo pedidos ${status}:`, error)
    return []
  }
}

/**
 * Actualiza campos de la cabecera del pedido
 * @param {number} id - ID del pedido
 * @param {object} patch - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updatePedidoHeader(id, patch) {
  if (!id || !patch) {
    throw new Error('ID y patch son requeridos')
  }

  try {
    const db = await getDB()
    const tx = db.transaction(PEDIDOS_STORE, 'readwrite')
    const store = tx.objectStore(PEDIDOS_STORE)

    const pedido = await store.get(id)
    if (!pedido) {
      throw new Error(`Pedido ${id} no encontrado`)
    }

    // Actualizar campos
    Object.assign(pedido, patch)
    pedido.updated_at = Date.now()

    await store.put(pedido)
    await tx.done

    console.log(`✅ Pedido ${id} actualizado`)

  } catch (error) {
    console.error('Error actualizando pedido:', error)
    throw new Error(`Error al actualizar pedido: ${error.message}`)
  }
}

/**
 * Actualiza un item del pedido y recalcula totales
 * @param {number} itemId - ID del item
 * @param {object} patch - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updatePedidoItem(itemId, patch) {
  if (!itemId || !patch) {
    throw new Error('ItemId y patch son requeridos')
  }

  try {
    const db = await getDB()
    const tx = db.transaction([PEDIDOS_ITEMS_STORE, PEDIDOS_STORE], 'readwrite')
    
    // 1. Actualizar item
    const itemsStore = tx.objectStore(PEDIDOS_ITEMS_STORE)
    const item = await itemsStore.get(itemId)
    if (!item) {
      throw new Error(`Item ${itemId} no encontrado`)
    }

    Object.assign(item, patch)
    
    // Recalcular total_price si quantity o unit_price cambiaron
    if ('quantity' in patch || 'unit_price' in patch) {
      item.total_price = item.quantity * item.unit_price
    }
    
    await itemsStore.put(item)

    // 2. Recalcular total del pedido
    const allItems = await itemsStore.index('by-pedido').getAll(item.pedido_id)
    const newTotal = allItems.reduce((sum, i) => sum + i.total_price, 0)

    // 3. Actualizar header
    const pedidosStore = tx.objectStore(PEDIDOS_STORE)
    const pedido = await pedidosStore.get(item.pedido_id)
    if (pedido) {
      pedido.total_amount = newTotal
      pedido.updated_at = Date.now()
      await pedidosStore.put(pedido)
    }

    await tx.done
    console.log(`✅ Item ${itemId} actualizado, nuevo total pedido: ${newTotal}`)

  } catch (error) {
    console.error('Error actualizando item:', error)
    throw new Error(`Error al actualizar item: ${error.message}`)
  }
}

/**
 * Limpia carrito por almacén
 * @param {number} almcnt - Código almacén
 * @returns {Promise<void>}
 */
export async function clearCarritoByAlmcnt(almcnt) {
  if (!almcnt) {
    throw new Error('Almcnt requerido')
  }

  try {
    const db = await getDB()
    const tx = db.transaction(CARRITO_STORE, 'readwrite')
    const store = tx.objectStore(CARRITO_STORE)

    // Por ahora limpia todo el carrito (TODO: filtrar por almcnt)
    await store.clear()
    await tx.done

    console.log(`✅ Carrito limpiado para almacén ${almcnt}`)

  } catch (error) {
    console.error('Error limpiando carrito:', error)
    throw new Error(`Error al limpiar carrito: ${error.message}`)
  }
}

/**
 * Obtiene pedidos pending con sus items (para sync)
 * @returns {Promise<Array>} Pedidos con items anidados
 */
export async function getPendingPedidosDeep() {
  try {
    const db = await getDB()
    const tx = db.transaction([PEDIDOS_STORE, PEDIDOS_ITEMS_STORE], 'readonly')
    
    // 1. Obtener pedidos pending
    const pedidosIndex = tx.objectStore(PEDIDOS_STORE).index('by-status')
    const pedidos = await pedidosIndex.getAll('pending')
    
    // 2. Obtener items para cada pedido
    const itemsStore = tx.objectStore(PEDIDOS_ITEMS_STORE)
    const pedidosConItems = []
    
    for (const pedido of pedidos) {
      const items = await itemsStore.index('by-pedido').getAll(pedido.id)
      pedidosConItems.push({
        ...pedido,
        items
      })
    }
    
    await tx.done
    return pedidosConItems.sort((a, b) => b.created_at - a.created_at)

  } catch (error) {
    console.error('Error obteniendo pedidos deep:', error)
    return []
  }
}

/**
 * Obtiene items de un pedido específico por ID
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<Array>} Items del pedido
 */
export async function getItemsByPedidoId(pedidoId) {
  if (!pedidoId) {
    return []
  }

  try {
    const db = await getDB()
    const tx = db.transaction(PEDIDOS_ITEMS_STORE, 'readonly')
    const store = tx.objectStore(PEDIDOS_ITEMS_STORE)
    const items = await store.index('by-pedido').getAll(pedidoId)
    await tx.done
    
    console.log(`📦 ${items.length} items cargados para pedido ${pedidoId}`)
    return items.sort((a, b) => a.id - b.id) // Ordenar por ID
    
  } catch (error) {
    console.error('Error obteniendo items del pedido:', error)
    return []
  }
}

/**
 * Obtiene un pedido completo con sus items (para cualquier status)
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<Object|null>} Pedido con items anidados
 */
export async function getPedidoWithItems(pedidoId) {
  if (!pedidoId) {
    return null
  }

  try {
    const db = await getDB()
    const tx = db.transaction([PEDIDOS_STORE, PEDIDOS_ITEMS_STORE], 'readonly')
    
    // 1. Obtener pedido
    const pedidosStore = tx.objectStore(PEDIDOS_STORE)
    const pedido = await pedidosStore.get(pedidoId)
    
    if (!pedido) {
      await tx.done
      return null
    }
    
    // 2. Obtener items
    const itemsStore = tx.objectStore(PEDIDOS_ITEMS_STORE)
    const items = await itemsStore.index('by-pedido').getAll(pedidoId)
    
    await tx.done
    
    console.log(`📋 Pedido ${pedidoId} cargado con ${items.length} items`)
    return {
      ...pedido,
      items: items.sort((a, b) => a.id - b.id)
    }
    
  } catch (error) {
    console.error('Error obteniendo pedido con items:', error)
    return null
  }
}

/**
 * Marca un pedido como procesado en IndexedDB Y en Supabase
 * @param {number} id - ID local del pedido
 * @param {number} remoteId - ID remoto en Supabase
 */
export async function markPedidoProcessed(id, remoteId) {
  if (!id) {
    throw new Error('ID requerido')
  }

  if (!remoteId) {
    throw new Error('Remote ID requerido para marcar como procesado')
  }

  try {
    console.log(`🔄 Marcando pedido ${id} como procesado (remote: ${remoteId})...`)

    // 1. Actualizar en IndexedDB
    const db = await getDB()
    const tx = db.transaction(PEDIDOS_STORE, 'readwrite')
    const store = tx.objectStore(PEDIDOS_STORE)

    const pedido = await store.get(id)
    if (!pedido) {
      throw new Error(`Pedido ${id} no encontrado en IndexedDB`)
    }

    pedido.status = 'processed'
    pedido.sync_status = 'synced'
    pedido.remote_id = remoteId
    pedido.synced_at = Date.now()
    pedido.updated_at = Date.now()

    await store.put(pedido)
    await tx.done

    console.log(`✅ IndexedDB: Pedido ${id} marcado como procesado`)

    // 2. Actualizar en Supabase
    const { supabase } = await import('../supabaseClient')
    
    const { error: supabaseError } = await supabase
      .from('orders')
      .update({ 
        status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', remoteId)

    if (supabaseError) {
      console.warn(`⚠️ Error actualizando status en Supabase: ${supabaseError.message}`)
      // No lanzar error - IndexedDB ya se actualizó exitosamente
      console.log(`⚠️ Pedido ${id} marcado como procesado en IndexedDB, pero falló actualización en Supabase`)
    } else {
      console.log(`✅ Supabase: Order ${remoteId} marcado como procesado`)
      console.log(`🎉 COMPLETADO: Pedido ${id} procesado en IndexedDB y Supabase`)
    }

  } catch (error) {
    console.error('❌ Error marcando pedido procesado:', error)
    throw new Error(`Error al procesar pedido: ${error.message}`)
  }
}

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
 * @param {Array<{id: number, almcnt: number, ctecve: number, name: string}>} clientes - Lista de clientes
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

      const { id, almcnt, ctecve, name } = cliente
      
      // Validar campos requeridos (incluyendo el nuevo campo id)
      if (typeof id !== 'number' || typeof almcnt !== 'number' || typeof ctecve !== 'number' || !name) {
        console.warn('Cliente con datos inválidos:', cliente)
        continue
      }

      await store.put({
        id,          // ⭐ NUEVO: ID de Supabase para relación con orders
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
 * @returns {Promise<Array<{id: number, almcnt: number, ctecve: number, name: string}>>}
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
 * @returns {Promise<Array<{id: number, almcnt: number, ctecve: number, name: string}>>}
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
 * @returns {Promise<{id: number, almcnt: number, ctecve: number, name: string}|null>}
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
