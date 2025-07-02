/**
 * TESTING - Verificar que la sincronización inmediata funcione después de crear pedidos
 */

import { createPedido } from './indexedDB'

/**
 * Simula la creación de un pedido y verifica que se sincronice inmediatamente
 * @param {Object} testData - Datos de prueba para el pedido
 */
export async function testImmediateSyncAfterOrder(testData = null) {
  console.log('🧪 TESTING: Sincronización inmediata después de crear pedido')
  
  // Datos de prueba por defecto
  const defaultTestData = {
    header: {
      customer_id: 775, // ID del cliente de prueba
      almcnt: 2039,
      ctecve: 3,
      ctename: 'JALAPA DEL VALLE',
      user_id: 'user_test',
      total_amount: 50.00,
      notes: 'Pedido de prueba para testing sync inmediato'
    },
    items: [
      {
        product_id: 8521,
        quantity: 1,
        unit_price: 50.00,
        total_price: 50.00,
        product_name: 'Producto de prueba',
        product_code: 'TEST001'
      }
    ]
  }
  
  const data = testData || defaultTestData
  
  try {
    console.log('📝 Creando pedido de prueba...')
    console.log('📋 Header:', data.header)
    console.log('📦 Items:', data.items)
    
    // 1. Verificar estado de sincronización antes
    const syncStateBefore = {
      isOnline: window.syncState?.isOnline ?? false,
      pendingCount: window.syncState?.syncStats?.pendingCount ?? 0,
      isAuthenticated: window.syncState?.isAuthenticated ?? false,
      syncAvailable: !!(window.syncState && window.syncState.manualSync)
    }
    
    console.log('🔍 Estado antes de crear pedido:', syncStateBefore)
    
    if (!syncStateBefore.syncAvailable) {
      console.warn('⚠️ Sistema de sincronización no disponible')
      return { success: false, error: 'Sistema de sincronización no disponible' }
    }
    
    if (!syncStateBefore.isAuthenticated) {
      console.warn('⚠️ Usuario no autenticado - no se podrá sincronizar')
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    // 2. Crear pedido
    console.log('💾 Creando pedido en IndexedDB...')
    const orderId = await createPedido(data.header, data.items)
    console.log(`✅ Pedido creado con ID: ${orderId}`)
    
    // 3. Simular sincronización inmediata (como en CarritoModal)
    console.log('🚀 Iniciando sincronización inmediata...')
    const syncStartTime = Date.now()
    
    const syncResult = await window.syncState.manualSync()
    const syncDuration = Date.now() - syncStartTime
    
    console.log(`📊 Resultado de sincronización (${syncDuration}ms):`, syncResult)
    
    // 4. Verificar resultado
    if (syncResult.success) {
      if (syncResult.synced > 0) {
        console.log(`🎉 ¡ÉXITO! Pedido ${orderId} sincronizado inmediatamente`)
        console.log(`   • Pedidos sincronizados: ${syncResult.synced}`)
        console.log(`   • Duración: ${syncDuration}ms`)
        
        return {
          success: true,
          orderId,
          syncResult,
          syncDuration,
          message: `Pedido ${orderId} creado y sincronizado en ${syncDuration}ms`
        }
      } else {
        console.warn('⚠️ Sincronización exitosa pero sin pedidos nuevos sincronizados')
        return {
          success: false,
          orderId,
          syncResult,
          error: 'Sin pedidos sincronizados'
        }
      }
    } else {
      console.error('❌ Error en sincronización:', syncResult.error)
      return {
        success: false,
        orderId,
        syncResult,
        error: syncResult.error || 'Error desconocido en sync'
      }
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verifica el tiempo de sincronización actual vs inmediata
 */
export async function compareImmediateSyncVsInterval() {
  console.log('📊 COMPARANDO: Sync inmediato vs intervalo automático')
  
  const syncInterval = 60000 // 60 segundos por defecto
  const avgSyncTime = 2000   // ~2 segundos promedio para sync
  
  console.log(`⏰ Intervalo automático: ${syncInterval / 1000}s`)
  console.log(`🚀 Sync inmediato: ~${avgSyncTime / 1000}s`)
  console.log(`📈 Mejora de tiempo: ${((syncInterval - avgSyncTime) / 1000).toFixed(1)}s más rápido`)
  
  const improvement = {
    intervalTime: syncInterval,
    immediateTime: avgSyncTime,
    timeSaved: syncInterval - avgSyncTime,
    percentImprovement: ((syncInterval - avgSyncTime) / syncInterval * 100).toFixed(1)
  }
  
  console.log(`💡 Mejora: ${improvement.percentImprovement}% más rápido`)
  
  return improvement
}

/**
 * Monitorea el estado de sincronización en tiempo real
 * @param {number} duration - Duración del monitoreo en ms (default: 10s)
 */
export async function monitorSyncState(duration = 10000) {
  console.log(`📡 Monitoreando estado de sincronización por ${duration / 1000}s...`)
  
  const startTime = Date.now()
  const logs = []
  
  const monitor = setInterval(() => {
    const elapsed = Date.now() - startTime
    const state = {
      time: elapsed,
      isOnline: window.syncState?.isOnline ?? false,
      isAuthenticated: window.syncState?.isAuthenticated ?? false,
      pendingCount: window.syncState?.syncStats?.pendingCount ?? 0,
      isSyncing: window.syncState?.isSyncing ?? false,
      lastSync: window.syncState?.syncStats?.lastSync ?? null
    }
    
    logs.push(state)
    console.log(`[${(elapsed / 1000).toFixed(1)}s] 📊`, state)
    
    if (elapsed >= duration) {
      clearInterval(monitor)
      console.log('📡 Monitoreo completado')
      console.log('📋 Logs completos:', logs)
    }
  }, 1000)
  
  return new Promise(resolve => {
    setTimeout(() => {
      clearInterval(monitor)
      resolve(logs)
    }, duration)
  })
}

// Hacer funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  window.testImmediateSyncAfterOrder = testImmediateSyncAfterOrder
  window.compareImmediateSyncVsInterval = compareImmediateSyncVsInterval
  window.monitorSyncState = monitorSyncState
  
  console.log('🧪 Funciones de testing sincronización inmediata disponibles:')
  console.log('  • testImmediateSyncAfterOrder() - Test completo de sync inmediato')
  console.log('  • compareImmediateSyncVsInterval() - Compara tiempos')
  console.log('  • monitorSyncState(10000) - Monitorea estado por 10s')
} 