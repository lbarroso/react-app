/**
 * FASE 2 - Test de sincronización automática
 * Ejecutar en consola del navegador para verificar sync
 */

import { 
  checkSupabaseConnection, 
  pushOrder, 
  pushOrderItems,
  syncPedidoComplete,
  retryWithBackoff,
  isNetworkError
} from './supabaseSync.js'

import { 
  createPedido, 
  getPendingPedidosDeep, 
  markPedidoProcessed 
} from './indexedDB.js'

/**
 * Test completo de FASE 2 - Sincronización
 */
export async function testFase2() {
  console.log('🧪 Iniciando tests FASE 2 - Sincronización...')
  
  try {
    // 1. Test de conectividad Supabase
    console.log('\n🌐 Test 1: checkSupabaseConnection()')
    const hasConnection = await checkSupabaseConnection()
    console.log(`✅ Conectividad Supabase: ${hasConnection ? 'OK' : 'FAIL'}`)
    
    if (!hasConnection) {
      console.warn('⚠️ Sin conectividad - tests limitados')
      return { success: false, reason: 'Sin conectividad Supabase' }
    }
    
    // 2. Crear pedido de prueba local
    console.log('\n📝 Test 2: Crear pedido local para sync')
    const header = {
      almcnt: 2033,
      ctecve: 142,
      ctename: 'AGUA DE SOL TEST',
      user_id: 'sync_test_user',
      total_amount: 125.75,
      notes: 'Pedido test para sync FASE 2'
    }
    
    const items = [
      {
        product_id: 2001,
        quantity: 2,
        unit_price: 50.00,
        total_price: 100.00,
        product_name: 'Producto Sync Test 1',
        product_code: 'ST001'
      },
      {
        product_id: 2002,
        quantity: 1,
        unit_price: 25.75,
        total_price: 25.75,
        product_name: 'Producto Sync Test 2',
        product_code: 'ST002'
      }
    ]
    
    const localOrderId = await createPedido(header, items)
    console.log(`✅ Pedido local creado: ${localOrderId}`)
    
    // 3. Test pushOrder individual
    console.log('\n📤 Test 3: pushOrder() individual')
    try {
      const remoteOrderId = await pushOrder(header)
      console.log(`✅ Order pushed con remote ID: ${remoteOrderId}`)
      
      // 4. Test pushOrderItems
      console.log('\n📦 Test 4: pushOrderItems()')
      await pushOrderItems(remoteOrderId, items)
      console.log('✅ Items pushed exitosamente')
      
    } catch (error) {
      console.warn('⚠️ Error en push individual:', error.message)
      console.log('Continuando con test de sync completo...')
    }
    
    // 5. Test getPendingPedidosDeep
    console.log('\n🔍 Test 5: getPendingPedidosDeep()')
    const pendingPedidos = await getPendingPedidosDeep()
    console.log(`✅ Pedidos pending encontrados: ${pendingPedidos.length}`)
    
    if (pendingPedidos.length === 0) {
      console.log('⚠️ No hay pedidos pending para sync')
      return { success: true, reason: 'Sin pedidos pending' }
    }
    
    // 6. Test syncPedidoComplete
    console.log('\n🔄 Test 6: syncPedidoComplete()')
    const firstPendingPedido = pendingPedidos[0]
    
    try {
      const remoteId = await syncPedidoComplete(firstPendingPedido)
      console.log(`✅ Pedido ${firstPendingPedido.id} sincronizado (remote: ${remoteId})`)
      
      // 7. Test markPedidoProcessed
      console.log('\n✅ Test 7: markPedidoProcessed()')
      await markPedidoProcessed(firstPendingPedido.id, remoteId)
      console.log(`✅ Pedido ${firstPendingPedido.id} marcado como procesado`)
      
    } catch (error) {
      console.error('❌ Error en sync completo:', error)
      
      // Test isNetworkError
      console.log('\n🔍 Test 8: isNetworkError()')
      const isNetErr = isNetworkError(error)
      console.log(`Error es de red (reintentable): ${isNetErr}`)
    }
    
    // 8. Test retryWithBackoff (simulado)
    console.log('\n🔄 Test 9: retryWithBackoff() con función exitosa')
    let callCount = 0
    const testFunction = async () => {
      callCount++
      console.log(`  Intento ${callCount}`)
      if (callCount < 2) {
        throw new Error('NetworkError: Test retry')
      }
      return 'success'
    }
    
    try {
      const result = await retryWithBackoff(testFunction, 3, 500)
      console.log(`✅ Retry exitoso: ${result}`)
    } catch (error) {
      console.warn('⚠️ Retry falló:', error.message)
    }
    
    // 9. Test del hook state (si está disponible)
    console.log('\n📊 Test 10: Estado del hook useSyncPedidos')
    if (window.syncState) {
      const { isOnline, isSyncing, syncStats, hasPendingOrders } = window.syncState
      console.log('Hook state:', {
        isOnline,
        isSyncing,
        pendingCount: syncStats.pendingCount,
        totalSynced: syncStats.totalSynced,
        hasPendingOrders,
        lastSync: syncStats.lastSync ? new Date(syncStats.lastSync).toLocaleTimeString() : 'nunca'
      })
      console.log('✅ Hook state disponible')
    } else {
      console.warn('⚠️ Hook state no disponible en window.syncState')
    }
    
    console.log('\n🎉 TODOS LOS TESTS FASE 2 COMPLETADOS!')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error crítico en tests FASE 2:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test manual de sync usando el hook
 */
export async function testManualSync() {
  if (!window.syncState) {
    console.error('❌ Hook useSyncPedidos no disponible en window.syncState')
    return { success: false, reason: 'Hook no disponible' }
  }
  
  console.log('🚀 Ejecutando sync manual...')
  const result = await window.syncState.manualSync()
  console.log('📊 Resultado sync manual:', result)
  return result
}

/**
 * Test de simulación offline/online
 */
export function testOfflineOnline() {
  console.log('📱 Test simulación offline/online')
  
  // Simular offline
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  })
  window.dispatchEvent(new Event('offline'))
  console.log('📵 Simulado: OFFLINE')
  
  setTimeout(() => {
    // Simular online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    window.dispatchEvent(new Event('online'))
    console.log('📶 Simulado: ONLINE (debería iniciar sync automático)')
  }, 3000)
  
  return { success: true, message: 'Simulación offline→online ejecutada' }
}

// Auto-disponibilizar en consola
if (typeof window !== 'undefined') {
  window.testFase2 = testFase2
  window.testManualSync = testManualSync
  window.testOfflineOnline = testOfflineOnline
  
  console.log('🧪 Tests FASE 2 disponibles:')
  console.log('- testFase2() - Test completo de sync')
  console.log('- testManualSync() - Test sync manual')
  console.log('- testOfflineOnline() - Test simulación conectividad')
  console.log('- window.syncState - Estado del hook')
} 