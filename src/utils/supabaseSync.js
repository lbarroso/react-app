/**
 * FASE 2 - Sincronización con Supabase
 * Helper functions para push de pedidos offline → online
 */

import { supabase } from '../supabaseClient'
import { 
  mapPedidoToSupabase, 
  mapItemsToSupabase, 
  validatePedidoForSync,
  debugFieldMapping 
} from './supabaseFieldMapping'

/**
 * Push pedido header a Supabase
 * @param {object} header - Cabecera del pedido local
 * @returns {Promise<number>} Remote ID del pedido creado
 */
export async function pushOrder(header) {
  if (!header) {
    throw new Error('Header requerido para push order')
  }

  try {
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Usuario no autenticado')
    }

    console.log('📤 Pushing order header:', header)
    
    // Mapear datos usando la función de mapeo
    const supabaseOrder = mapPedidoToSupabase(header, user.id)
    
    console.log('📤 Supabase order data:', supabaseOrder)
    
    // Insertar en Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([supabaseOrder])
      .select('id')
      .single()

    if (error) {
      console.error('❌ Error pushing order:', error)
      console.error('❌ Error details:', error.details, error.hint, error.code)
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!data?.id) {
      throw new Error('No se recibió ID del pedido creado')
    }

    console.log(`✅ Order pushed con remote ID: ${data.id}`)
    return data.id

  } catch (error) {
    console.error('❌ Error en pushOrder:', error)
    throw error
  }
}

/**
 * Push items del pedido a Supabase (batch)
 * @param {number} remoteOrderId - ID remoto del pedido
 * @param {Array} items - Items del pedido local
 * @returns {Promise<void>}
 */
export async function pushOrderItems(remoteOrderId, items) {
  if (!remoteOrderId || !Array.isArray(items) || items.length === 0) {
    throw new Error('Remote order ID y items son requeridos')
  }

  try {
    console.log(`📤 Pushing ${items.length} items para order ${remoteOrderId}`)
    
    // Mapear items usando la función de mapeo
    const supabaseItems = mapItemsToSupabase(items, remoteOrderId)
    
    console.log('📤 Supabase items data:', supabaseItems)
    
    // Insertar en Supabase
    const { data, error } = await supabase
      .from('order_items')
      .insert(supabaseItems)
      .select('id')

    if (error) {
      console.error('❌ Error pushing order items:', error)
      console.error('❌ Error details:', error.details, error.hint, error.code)
      throw new Error(`Supabase error: ${error.message}`)
    }

    console.log(`✅ ${data?.length || items.length} items pushed exitosamente`)

  } catch (error) {
    console.error('❌ Error en pushOrderItems:', error)
    throw error
  }
}

/**
 * Verifica conectividad con Supabase
 * @returns {Promise<boolean>} true si hay conexión
 */
export async function checkSupabaseConnection() {
  try {
    // Test simple de conectividad - corregir sintaxis
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1)

    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection OK')
    return true

  } catch (error) {
    console.warn('⚠️ Supabase connectivity issue:', error.message)
    return false
  }
}

/**
 * Sync completo de un pedido (header + items)
 * @param {object} pedido - Pedido con items anidados desde getPendingPedidosDeep()
 * @returns {Promise<number>} Remote ID del pedido
 */
export async function syncPedidoComplete(pedido) {
  if (!pedido || !pedido.items || pedido.items.length === 0) {
    throw new Error('Pedido con items requerido')
  }

  try {
    console.log(`📦 Syncing pedido completo ${pedido.id}...`)
    
    // Validar datos antes de sincronizar
    const validation = validatePedidoForSync(pedido)
    if (!validation.isValid) {
      console.error('❌ Pedido inválido para sync:', validation.errors)
      throw new Error(`Pedido inválido: ${validation.errors.join(', ')}`)
    }

    // Debug: mostrar mapeo de campos
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      debugFieldMapping(pedido, user.id)
    }
    
    // 1. Push header
    const remoteId = await pushOrder(pedido)
    
    // 2. Push items
    await pushOrderItems(remoteId, pedido.items)
    
    console.log(`✅ Pedido ${pedido.id} sincronizado completamente (remote: ${remoteId})`)
    return remoteId

  } catch (error) {
    console.error(`❌ Error syncing pedido ${pedido.id}:`, error)
    throw error
  }
}

/**
 * Manejo de errores de red
 * @param {Error} error 
 * @returns {boolean} true si es error de red (reintentable)
 */
export function isNetworkError(error) {
  const networkErrors = [
    'NetworkError',
    'fetch',
    'Failed to fetch',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'timeout'
  ]
  
  const errorMessage = error.message || error.toString()
  return networkErrors.some(netError => 
    errorMessage.toLowerCase().includes(netError.toLowerCase())
  )
}

/**
 * Retry con exponential backoff
 * @param {Function} fn - Función a reintentar
 * @param {number} maxRetries - Máximo número de reintentos
 * @param {number} baseDelay - Delay base en ms
 * @returns {Promise} Resultado de la función
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`⏳ Retry ${attempt + 1}/${maxRetries} en ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
} 