/**
 * DEBUG - Verificar estado de sincronización global
 */

/**
 * Verifica si window.syncState está disponible y qué contiene
 */
export function debugSyncState() {
  console.log('🔍 DEBUGGING: Estado de sincronización global')
  
  if (typeof window === 'undefined') {
    console.error('❌ Window no está disponible')
    return { available: false, reason: 'No window object' }
  }
  
  if (!window.syncState) {
    console.error('❌ window.syncState no está disponible')
    console.log('💡 Esto significa que el hook useSyncPedidos no se está exponiendo globalmente')
    return { available: false, reason: 'window.syncState is undefined' }
  }
  
  console.log('✅ window.syncState está disponible')
  
  const state = window.syncState
  console.log('📊 Estado completo:', state)
  
  const analysis = {
    available: true,
    manualSyncAvailable: typeof state.manualSync === 'function',
    isOnline: state.isOnline,
    isAuthenticated: state.isAuthenticated,
    isSyncing: state.isSyncing,
    hasPendingOrders: state.hasPendingOrders,
    syncStats: state.syncStats,
    methods: Object.keys(state).filter(key => typeof state[key] === 'function')
  }
  
  console.log('🔍 Análisis:', analysis)
  
  if (!analysis.manualSyncAvailable) {
    console.warn('⚠️ manualSync function no está disponible')
  }
  
  if (!analysis.isAuthenticated) {
    console.warn('⚠️ Usuario no autenticado - la sincronización no funcionará')
  }
  
  if (!analysis.isOnline) {
    console.warn('⚠️ Usuario offline - la sincronización no funcionará')
  }
  
  return analysis
}

/**
 * Test rápido de sincronización manual
 */
export async function testManualSync() {
  console.log('🧪 TEST: Sincronización manual')
  
  const stateCheck = debugSyncState()
  
  if (!stateCheck.available) {
    console.error('❌ No se puede testear - syncState no disponible')
    return { success: false, error: stateCheck.reason }
  }
  
  if (!stateCheck.manualSyncAvailable) {
    console.error('❌ manualSync function no disponible')
    return { success: false, error: 'manualSync not available' }
  }
  
  try {
    console.log('🚀 Ejecutando manualSync...')
    const result = await window.syncState.manualSync()
    console.log('📊 Resultado:', result)
    
    return { success: true, result }
    
  } catch (error) {
    console.error('❌ Error en manualSync:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Monitorea cambios en window.syncState
 */
export function watchSyncState(duration = 10000) {
  console.log(`👁️ Monitoreando window.syncState por ${duration / 1000}s...`)
  
  let lastState = null
  const changes = []
  
  const monitor = setInterval(() => {
    const currentState = window.syncState ? {
      isOnline: window.syncState.isOnline,
      isAuthenticated: window.syncState.isAuthenticated,
      isSyncing: window.syncState.isSyncing,
      pendingCount: window.syncState.syncStats?.pendingCount,
      lastSync: window.syncState.syncStats?.lastSync
    } : null
    
    if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
      const change = {
        time: Date.now(),
        from: lastState,
        to: currentState
      }
      changes.push(change)
      console.log('📍 Cambio detectado:', change)
      lastState = currentState
    }
  }, 1000)
  
  setTimeout(() => {
    clearInterval(monitor)
    console.log('👁️ Monitoreo completado')
    console.log('📋 Cambios detectados:', changes)
  }, duration)
  
  return { monitor, changes }
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.debugSyncState = debugSyncState
  window.testManualSync = testManualSync
  window.watchSyncState = watchSyncState
  
  console.log('🔍 Funciones de debug syncState disponibles:')
  console.log('  • debugSyncState() - Verifica estado de window.syncState')
  console.log('  • testManualSync() - Testa función manualSync')
  console.log('  • watchSyncState(10000) - Monitorea cambios por 10s')
} 