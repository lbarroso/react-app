/**
 * SCRIPT DE RECARGA - Clientes con campo ID
 * Ejecutar desde DevTools para limpiar y recargar clientes con ID de Supabase
 */

import { clearClientsForAlmacen, getClientsLocal, getClientCount } from './indexedDB'
import { downloadAndCacheClients } from './client-operations'

/**
 * Recarga completa de clientes para un almacén específico
 * @param {number} almcnt - Código del almacén
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function reloadClientsWithId(almcnt) {
  console.log(`🔄 INICIANDO RECARGA DE CLIENTES PARA ALMACÉN ${almcnt}...`)
  
  try {
    // 1. Verificar datos actuales
    console.log('📊 Verificando estado actual...')
    const currentClients = await getClientsLocal(almcnt)
    const currentCount = await getClientCount(almcnt)
    
    console.log(`📋 Clientes actuales: ${currentCount}`)
    if (currentClients.length > 0) {
      const sampleClient = currentClients[0]
      console.log('📝 Cliente ejemplo actual:', sampleClient)
      
      if (sampleClient.id) {
        console.log('✅ Los clientes YA tienen campo ID')
        return {
          success: true,
          message: 'Clientes ya tienen campo ID',
          alreadyUpdated: true,
          clientsCount: currentCount
        }
      } else {
        console.log('⚠️ Los clientes NO tienen campo ID - necesario recargar')
      }
    }

    // 2. Limpiar clientes existentes
    console.log('🗑️ Limpiando clientes existentes...')
    const deletedCount = await clearClientsForAlmacen(almcnt)
    console.log(`✅ ${deletedCount} clientes eliminados`)

    // 3. Descargar nuevos clientes con ID
    console.log('⬇️ Descargando clientes desde Supabase...')
    const downloadResult = await downloadAndCacheClients(almcnt)
    console.log(`✅ ${downloadResult.count} clientes descargados`)

    // 4. Verificar resultado
    console.log('🔍 Verificando resultado...')
    const newClients = await getClientsLocal(almcnt)
    const newCount = await getClientCount(almcnt)
    
    if (newClients.length > 0) {
      const sampleNewClient = newClients[0]
      console.log('📝 Cliente ejemplo NUEVO:', sampleNewClient)
      
      if (sampleNewClient.id) {
        console.log('🎉 ¡ÉXITO! Los clientes ahora tienen campo ID')
      } else {
        console.log('❌ ERROR: Los clientes AÚN no tienen campo ID')
        throw new Error('Los clientes descargados no incluyen el campo ID')
      }
    }

    const result = {
      success: true,
      message: 'Clientes recargados exitosamente',
      previousCount: deletedCount,
      newCount: newCount,
      sampleClient: newClients[0] || null,
      hasId: newClients.length > 0 && newClients[0].id ? true : false
    }

    console.log('📊 RESULTADO FINAL:', result)
    return result

  } catch (error) {
    console.error('❌ ERROR en recarga de clientes:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
      error: error
    }
  }
}

/**
 * Función específica para almacén 2033 (según tu caso)
 */
export async function reloadAlmacen2033() {
  return await reloadClientsWithId(2033)
}

/**
 * Función de debug para verificar estado de clientes
 * @param {number} almcnt - Código del almacén
 */
export async function debugClientState(almcnt) {
  console.log(`🔍 DEBUG - Estado de clientes para almacén ${almcnt}`)
  
  try {
    const clients = await getClientsLocal(almcnt)
    const count = await getClientCount(almcnt)
    
    console.log(`📊 Total clientes: ${count}`)
    
    if (clients.length > 0) {
      const sample = clients[0]
      console.log('📋 Cliente ejemplo:', sample)
      console.log('🆔 Tiene ID:', sample.id ? `Sí (${sample.id})` : 'No')
      console.log('📝 Estructura:', Object.keys(sample))
    } else {
      console.log('⚠️ No hay clientes almacenados')
    }
    
    return {
      count,
      hasData: count > 0,
      hasId: clients.length > 0 && clients[0].id ? true : false,
      sampleClient: clients[0] || null
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return { error: error.message }
  }
}

// Hacer funciones disponibles globalmente para DevTools
if (typeof window !== 'undefined') {
  window.reloadClientsWithId = reloadClientsWithId
  window.reloadAlmacen2033 = reloadAlmacen2033
  window.debugClientState = debugClientState
  
  console.log('🧰 Funciones de recarga de clientes disponibles:')
  console.log('  • reloadClientsWithId(almcnt) - Recarga clientes para almacén específico')
  console.log('  • reloadAlmacen2033() - Recarga específica para almacén 2033')
  console.log('  • debugClientState(almcnt) - Verifica estado actual')
} 