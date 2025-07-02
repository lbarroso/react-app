import { supabase } from '../supabaseClient'
import { 
  cacheClients, 
  getClientsLocal, 
  searchClientsByName,
  findClientByCode,
  getClientCount 
} from './indexedDB'

/**
 * Descarga clientes desde Supabase y los almacena en IndexedDB
 * @param {number} almcnt - Número de almacén
 * @returns {Promise<{clientes: Array, count: number}>} Resultado de la operación
 */
export async function downloadAndCacheClients(almcnt) {
  try {
    console.log(`Descargando clientes para almacén ${almcnt}...`)
    
    const { data: clientes, error } = await supabase
      .from('customers')
      .select('id, almcnt, ctecve, name')
      .eq('almcnt', almcnt)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error al descargar clientes desde Supabase:', error)
      throw new Error(`Error de Supabase: ${error.message}`)
    }

    if (!clientes || clientes.length === 0) {
      console.warn(`No se encontraron clientes para almacén ${almcnt}`)
      return { clientes: [], count: 0 }
    }

    // Usar la función integrada para cachear
    const processed = await cacheClients(clientes)
    
    console.log(`✅ ${processed} clientes descargados y cacheados para almacén ${almcnt}`)
    
    return { 
      clientes, 
      count: processed 
    }
    
  } catch (error) {
    console.error('Error en downloadAndCacheClients:', error)
    throw error
  }
}

/**
 * Obtiene clientes desde IndexedDB (offline)
 * @param {number} almcnt - Número de almacén
 * @returns {Promise<Array>} Lista de clientes desde IndexedDB
 */
export async function getClients(almcnt) {
  try {
    return await getClientsLocal(almcnt)
  } catch (error) {
    console.error('Error al obtener clientes locales:', error)
    return []
  }
}

/**
 * Busca clientes por nombre usando la función integrada optimizada
 * @param {number} almcnt - Número de almacén  
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} limit - Límite de resultados (default: 50)
 * @returns {Promise<Array>} Lista de clientes que coinciden
 */
export async function searchClients(almcnt, searchTerm, limit = 50) {
  try {
    return await searchClientsByName(almcnt, searchTerm, limit)
  } catch (error) {
    console.error('Error al buscar clientes por nombre:', error)
    return []
  }
}

/**
 * Busca un cliente específico por código usando la función integrada optimizada
 * @param {number} almcnt - Número de almacén
 * @param {number} ctecve - Código de cliente
 * @returns {Promise<Object|null>} Cliente encontrado o null
 */
export async function findClient(almcnt, ctecve) {
  try {
    return await findClientByCode(almcnt, ctecve)
  } catch (error) {
    console.error('Error al buscar cliente por código:', error)
    return null
  }
}

/**
 * Obtiene estadísticas de clientes para un almacén
 * @param {number} almcnt - Número de almacén
 * @returns {Promise<{count: number, hasData: boolean}>}
 */
export async function getClientStatistics(almcnt) {
  try {
    const count = await getClientCount(almcnt)
    return {
      count,
      hasData: count > 0
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de clientes:', error)
    return {
      count: 0,
      hasData: false
    }
  }
}

/**
 * Función completa para sincronización de clientes (descarga + cache)
 * @param {number} almcnt - Número de almacén
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export async function syncClients(almcnt) {
  try {
    const result = await downloadAndCacheClients(almcnt)
    const statistics = await getClientStatistics(almcnt)
    
    return {
      success: true,
      data: {
        downloaded: result.count,
        total: statistics.count,
        hasData: statistics.hasData
      }
    }
    
  } catch (error) {
    console.error('Error en sincronización de clientes:', error)
    
    return {
      success: false,
      data: {
        downloaded: 0,
        total: 0,
        hasData: false
      },
      error: error.message
    }
  }
} 