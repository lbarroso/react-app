/**
 * FASE 2 - Hook de Sincronización Automática
 * Monta en <App/> para sync automático offline → online
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getPendingPedidosDeep, markPedidoProcessed } from '../utils/indexedDB'
import { 
  syncPedidoComplete, 
  checkSupabaseConnection, 
  retryWithBackoff,
  isNetworkError 
} from '../utils/supabaseSync'
import { supabase } from '../supabaseClient'

// Configuración del hook
const SYNC_INTERVAL = 60000 // 60 segundos
const MAX_SYNC_RETRIES = 3
const SYNC_RETRY_DELAY = 2000 // 2 segundos

// 🚀 PRODUCCIÓN: SINCRONIZACIÓN HABILITADA
const DISABLE_SYNC_FOR_TESTING = false // 🚀 SYNC ACTIVO - ¡Funcionando en producción!

/**
 * Hook para sincronización automática de pedidos
 * @returns {object} Estado y funciones de sync
 */
export function useSyncPedidos() {
  // Estados del hook
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [syncStats, setSyncStats] = useState({
    lastSync: null,
    totalSynced: 0,
    pendingCount: 0,
    errors: []
  })

  // Referencias para intervals y timeouts
  const syncIntervalRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  /**
   * Verifica si el usuario está autenticado
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.warn('⚠️ Error verificando auth:', error.message)
        setIsAuthenticated(false)
        return false
      }
      
      const authenticated = !!user
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        console.log('✅ Usuario autenticado, sync habilitado')
      } else {
        console.log('🔒 Usuario no autenticado, sync deshabilitado')
      }
      
      return authenticated
    } catch (error) {
      console.warn('⚠️ Error en checkAuthStatus:', error)
      setIsAuthenticated(false)
      return false
    }
  }, [])

  /**
   * Actualiza contador de pedidos pending (solo si está autenticado)
   */
  const updatePendingCount = useCallback(async () => {
    if (!isAuthenticated) {
      setSyncStats(prev => ({ ...prev, pendingCount: 0 }))
      return
    }

    try {
      const pending = await getPendingPedidosDeep()
      setSyncStats(prev => ({
        ...prev,
        pendingCount: pending.length
      }))
    } catch (error) {
      console.error('Error actualizando pending count:', error)
      // No lanzar error, solo registrar
    }
  }, [isAuthenticated])

  /**
   * Maneja cambios de conectividad
   */
  const handleOnlineStatusChange = useCallback(() => {
    const online = navigator.onLine
    setIsOnline(online)
    
    console.log(`📶 Status conectividad: ${online ? 'ONLINE' : 'OFFLINE'}`)
    
    if (online && isAuthenticated) {
      // Al volver online, intentar sync inmediatamente
      console.log('🔄 Volviendo online - iniciando sync...')
      setTimeout(() => {
        performSync()
      }, 1000) // Pequeño delay para estabilizar conexión
    }
  }, [isAuthenticated])

  /**
   * Realiza sincronización de pedidos pending
   */
  const performSync = useCallback(async () => {
    // 🚀 VERIFICACIÓN: Estado del sync
    if (DISABLE_SYNC_FOR_TESTING) {
      console.log('🚫 SYNC DESHABILITADO - DISABLE_SYNC_FOR_TESTING = true')
      return { success: false, reason: 'Sync deshabilitado para testing' }
    } else {
      console.log('🚀 SYNC HABILITADO - DISABLE_SYNC_FOR_TESTING = false')
    }

    // Verificaciones previas
    if (!isAuthenticated) {
      console.log('🔒 No autenticado - saltando sync')
      console.log('🔐 DEBUG: Estado autenticación detallado:', {
        isAuthenticated,
        user: supabase.auth.getUser ? 'método disponible' : 'método no disponible'
      })
      return { success: false, reason: 'No autenticado' }
    }

    if (isSyncing) {
      console.log('⏳ Sync ya en progreso, saltando...')
      return { success: false, reason: 'Sync en progreso' }
    }

    if (!isOnline) {
      console.log('📵 Offline - saltando sync')
      return { success: false, reason: 'Offline' }
    }

    setIsSyncing(true)
    const syncStartTime = Date.now()
    let syncedCount = 0
    let errors = []

    try {
      console.log('🔄 Iniciando sync de pedidos...')

      // 1. Verificar conectividad con Supabase
      const hasConnection = await checkSupabaseConnection()
      if (!hasConnection) {
        throw new Error('Sin conectividad con Supabase')
      }

      // 2. Obtener pedidos pending
      const pendingPedidos = await getPendingPedidosDeep()
      console.log(`📋 Pedidos pending para sync: ${pendingPedidos.length}`)

      if (pendingPedidos.length === 0) {
        console.log('✅ No hay pedidos para sincronizar')
        setSyncStats(prev => ({
          ...prev,
          lastSync: Date.now(),
          pendingCount: 0
        }))
        return { success: true, synced: 0, reason: 'Sin pedidos' }
      }

      // 3. Sincronizar cada pedido con retry
      for (const pedido of pendingPedidos) {
        try {
          console.log(`📦 Syncing pedido ${pedido.id}...`)
          
          const remoteId = await retryWithBackoff(
            () => syncPedidoComplete(pedido),
            MAX_SYNC_RETRIES,
            SYNC_RETRY_DELAY
          )

          // Marcar como procesado
          await markPedidoProcessed(pedido.id, remoteId)
          syncedCount++
          
          console.log(`✅ Pedido ${pedido.id} sincronizado exitosamente`)

        } catch (error) {
          console.error(`❌ Error syncing pedido ${pedido.id}:`, error)
          errors.push({
            pedidoId: pedido.id,
            error: error.message,
            isRetryable: isNetworkError(error),
            timestamp: Date.now()
          })
        }
      }

      // 4. Actualizar estadísticas
      setSyncStats(prev => ({
        ...prev,
        lastSync: Date.now(),
        totalSynced: prev.totalSynced + syncedCount,
        pendingCount: pendingPedidos.length - syncedCount,
        errors: [...prev.errors.slice(-10), ...errors] // Mantener últimos 10 errores
      }))

      // 5. Mostrar notificación de resultado
      const duration = Date.now() - syncStartTime
      if (syncedCount > 0) {
        console.log(`🎉 Sync completado: ${syncedCount}/${pendingPedidos.length} pedidos en ${duration}ms`)
        
        // TODO: Mostrar toast success
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`✅ ${syncedCount} pedidos sincronizados`, 'success')
        }
      }

      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} errores durante sync`)
        
        // TODO: Mostrar toast error
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`⚠️ ${errors.length} errores en sync`, 'warning')
        }
      }

      return { 
        success: true, 
        synced: syncedCount, 
        errors: errors.length,
        duration 
      }

    } catch (error) {
      console.error('❌ Error crítico en sync:', error)
      
      setSyncStats(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-10), {
          error: error.message,
          isCritical: true,
          timestamp: Date.now()
        }]
      }))

      // TODO: Mostrar toast error
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`❌ Error en sync: ${error.message}`, 'error')
      }

      return { success: false, error: error.message }

    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, isAuthenticated])

  /**
   * Sync manual (para botón "Sincronizar ya")
   */
  const manualSync = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('🔒 Sync manual rechazado - no autenticado')
      return { success: false, reason: 'No autenticado' }
    }
    
    console.log('🚀 Sync manual iniciado')
    return await performSync()
  }, [performSync, isAuthenticated])

  /**
   * Programa próximo sync automático
   */
  const scheduleNextSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    if (!isAuthenticated) {
      console.log('🔒 Sync automático deshabilitado - no autenticado')
      return
    }

    syncIntervalRef.current = setInterval(() => {
      if (isOnline && !isSyncing && isAuthenticated) {
        console.log('⏰ Sync automático programado ejecutándose...')
        performSync()
      }
    }, SYNC_INTERVAL)

    console.log(`⏰ Próximo sync automático en ${SYNC_INTERVAL / 1000}s`)
  }, [isOnline, isSyncing, performSync, isAuthenticated])

  /**
   * Effect para monitorear cambios de autenticación
   */
  useEffect(() => {
    console.log('🔧 Configurando listener de auth...')
    
    // Verificar estado inicial
    checkAuthStatus()
    
    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 Auth event: ${event}`, session?.user?.id || 'no user')
        
        const authenticated = !!session?.user
        setIsAuthenticated(authenticated)
        
        if (authenticated && event === 'SIGNED_IN') {
          console.log('✅ Usuario autenticado - habilitando sync')
          // Dar tiempo para que se estabilice la sesión
          setTimeout(() => {
            updatePendingCount()
            if (isOnline) {
              performSync()
            }
          }, 2000)
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuario desconectado - deshabilitando sync')
          setSyncStats(prev => ({
            ...prev,
            pendingCount: 0,
            errors: []
          }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Solo ejecutar una vez

  /**
   * Effect principal del hook
   */
  useEffect(() => {
    console.log('🔧 Inicializando useSyncPedidos...')

    // 1. Listeners de conectividad
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [handleOnlineStatusChange])

  /**
   * Effect para re-programar sync cuando cambie autenticación o conectividad
   */
  useEffect(() => {
    scheduleNextSync()
  }, [scheduleNextSync])

  /**
   * Effect para actualizar pending count periódicamente (solo si autenticado)
   */
  useEffect(() => {
    if (!isAuthenticated) return

    const updateInterval = setInterval(updatePendingCount, 10000) // Cada 10s
    return () => clearInterval(updateInterval)
  }, [updatePendingCount, isAuthenticated])

  // Retornar estado y funciones públicas
  return {
    // Estados
    isOnline,
    isSyncing,
    isAuthenticated,
    syncStats,
    
    // Funciones
    manualSync,
    updatePendingCount,
    checkAuthStatus,
    
    // Estados derivados
    hasPendingOrders: syncStats.pendingCount > 0,
    hasErrors: syncStats.errors.length > 0,
    lastSyncAgo: syncStats.lastSync 
      ? Math.floor((Date.now() - syncStats.lastSync) / 1000)
      : null,
    
    // Estado de disponibilidad
    canSync: isAuthenticated && isOnline && !isSyncing
  }
}

export default useSyncPedidos 