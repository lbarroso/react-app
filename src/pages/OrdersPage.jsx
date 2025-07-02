/**
 * FASE 3 - Página de Administración de Pedidos
 * Lista con tabs Pendientes/Procesados y scroll infinito
 */

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPedidosByStatus, getPedidoWithItems } from '../utils/indexedDB'
import { shareViaWhatsApp, copyPedidoToClipboard } from '../utils/whatsappShare'


export default function OrdersPage() {
  const navigate = useNavigate()
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'processed'
  const [pedidos, setPedidos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados para sync manual
  const [isSyncing, setIsSyncing] = useState(false)

  /**
   * Carga pedidos según tab activo
   */
  const loadPedidos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`📋 Cargando pedidos ${activeTab}...`)
      const data = await getPedidosByStatus(activeTab)
      setPedidos(data)
      console.log(`✅ ${data.length} pedidos ${activeTab} cargados`)
      
    } catch (err) {
      console.error('Error cargando pedidos:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  /**
   * Maneja cambio de tab
   */
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }

  /**
   * Sync manual usando hook global
   */
  const handleManualSync = async () => {
    if (!window.syncState) {
      alert('Sistema de sync no disponible')
      return
    }

    setIsSyncing(true)
    try {
      console.log('🚀 Iniciando sync manual desde OrdersPage...')
      const result = await window.syncState.manualSync()
      
      if (result.success) {
        console.log('✅ Sync manual exitoso:', result)
        // Recargar pedidos para reflejar cambios
        setTimeout(loadPedidos, 1000)
        
        if (result.synced > 0) {
          alert(`✅ ${result.synced} pedidos sincronizados exitosamente`)
        } else {
          alert('ℹ️ No hay pedidos pendientes para sincronizar')
        }
      } else {
        console.warn('⚠️ Sync manual falló:', result)
        alert(`⚠️ Error en sincronización: ${result.error || result.reason}`)
      }
      
    } catch (error) {
      console.error('❌ Error en sync manual:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Refresca la lista actual
   */
  const handleRefresh = () => {
    loadPedidos()
  }

  // Effect para cargar pedidos cuando cambie el tab
  useEffect(() => {
    loadPedidos()
  }, [loadPedidos])

  // Obtener stats del sync
  const syncStats = window.syncState?.syncStats || {}
  const isOnline = window.syncState?.isOnline ?? true
  const hasPendingOrders = window.syncState?.hasPendingOrders ?? false

  return (
  <div className="bg-gray-50 min-h-screen flex flex-col">

    {/* Header */}
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Volver al Dashboard */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-2xl hover:text-secondary transition"
          >
            🏠
          </button>
          <h1 className="text-lg font-semibold">📋 Gestión de Pedidos</h1>
        </div>
        {/* Estado y último sync */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              isOnline ? 'bg-green-accent text-white' : 'bg-red-600 text-white'
            }`}
          >
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {syncStats.lastSync && (
            <span className="px-2 py-1 text-xs bg-gray-light text-gray-dark rounded">
              {new Date(syncStats.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </header>

    {/* Tabs */}
    <nav className="bg-white shadow-inner">
      <div className="max-w-7xl mx-auto flex space-x-4 overflow-x-auto px-4 py-2">
        {[
          ['pending', '🕓 Pendientes', syncStats.pendingCount, 'bg-green-light'],
          ['processed', '✅ Procesados', syncStats.totalSynced, 'bg-secondary']
        ].map(([tab, label, count, badgeColor]) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative pb-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-medium'
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`${badgeColor} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center absolute -top-2 -right-0`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>

    {/* Action Bar */}
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-dark rounded-md hover:bg-gray-light transition text-sm"
        >
          🔄 Actualizar
        </button>
        {hasPendingOrders && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition text-sm"
          >
            {isSyncing ? '⏳ Sincronizando...' : '📤 Sincronizar'}
          </button>
        )}
      </div>
    </div>

    {/* Content */}
    <main className="flex-1 overflow-auto max-w-7xl mx-auto px-4 pb-20">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRefresh} />
      ) : pedidos.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <OrdersList pedidos={pedidos} />
      )}
    </main>

    {/* FAB Sync */}
    {hasPendingOrders && isOnline && activeTab === 'pending' && (
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        title="Sincronizar pedidos pendientes"
        className="fixed bottom-8 right-4 bg-secondary text-white p-4 rounded-full shadow-lg hover:bg-secondary/90 transition"
      >
        {isSyncing ? '⏳' : '📤'}
      </button>
    )}
  </div>
  )
}

/**
 * Lista de pedidos virtualizada
 */
function OrdersList({ pedidos }) {
  return (
    <div className="orders-list">
      {pedidos.map(pedido => (
        <OrderCard key={pedido.id} pedido={pedido} />
      ))}
    </div>
  )
}

/**
 * Card individual de pedido
 */
function OrderCard({ pedido }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status, syncStatus) => {
    if (status === 'pending') {
      return <span className="badge badge-warning">🕓 Pendiente</span>
    }
    if (status === 'processed') {
      if (syncStatus === 'synced') {
        return <span className="badge badge-success">✅ Sincronizado</span>
      }
      return <span className="badge badge-info">📱 Local</span>
    }
    return <span className="badge badge-gray">❓ Desconocido</span>
  }

  const handleWhatsAppShare = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const button = e.target.closest('button')
    const originalText = button.innerHTML
    
    try {
      // Mostrar indicador de carga
      button.innerHTML = '⏳'
      button.disabled = true
      
      // Obtener el pedido completo con items
      const pedidoCompleto = await getPedidoWithItems(pedido.id)
      shareViaWhatsApp(pedidoCompleto, pedidoCompleto.items || [])
      
      // Mostrar éxito temporal
      button.innerHTML = '✅'
      setTimeout(() => {
        button.innerHTML = originalText
        button.disabled = false
      }, 1500)
      
    } catch (error) {
      console.error('Error obteniendo pedido completo:', error)
      // Fallback: compartir sin items
      shareViaWhatsApp(pedido)
      
      // Restaurar botón
      button.innerHTML = originalText
      button.disabled = false
    }
  }

  const handleCopyToClipboard = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const button = e.target.closest('button')
    const originalText = button.innerHTML
    
    try {
      // Mostrar indicador de carga
      button.innerHTML = '⏳'
      button.disabled = true
      
      // Obtener el pedido completo con items
      const pedidoCompleto = await getPedidoWithItems(pedido.id)
      const success = await copyPedidoToClipboard(pedidoCompleto, pedidoCompleto.items || [])
      
      if (success) {
        // Mostrar feedback visual temporal
        button.innerHTML = '✅'
        setTimeout(() => {
          button.innerHTML = originalText
          button.disabled = false
        }, 1500)
      } else {
        // Error al copiar
        button.innerHTML = '❌'
        setTimeout(() => {
          button.innerHTML = originalText
          button.disabled = false
        }, 1500)
      }
    } catch (error) {
      console.error('Error obteniendo pedido completo:', error)
      
      // Fallback: copiar sin items
      try {
        const success = await copyPedidoToClipboard(pedido)
        if (success) {
          button.innerHTML = '✅'
        } else {
          button.innerHTML = '❌'
        }
      } catch (fallbackError) {
        button.innerHTML = '❌'
      }
      
      setTimeout(() => {
        button.innerHTML = originalText
        button.disabled = false
      }, 1500)
    }
  }

  return (

  <div className="relative">
    <Link
      to={`/pedidos/${pedido.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
    >
      <div className="p-4 space-y-4">
        {/* Encabezado: ID y total */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-primary font-bold text-lg">#{pedido.id}</h3>
            <p className="text-gray-medium text-sm mt-1">{pedido.ctename}</p>
          </div>
          <div className="text-right">
            <span className="text-green-accent font-bold text-xl">
              ${pedido.total_amount?.toFixed(2) ?? '0.00'}
            </span>
          </div>
        </div>

        {/* Detalles: fecha, almacén y estado */}
        <div className="flex justify-between items-center border-t border-gray-light pt-4">
          <div className="space-y-1 text-xs text-gray-medium">
            <div>📅 {formatDate(pedido.created_at)}</div>
            {pedido.almcnt && <div>🏪 Almacén {pedido.almcnt}</div>}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(pedido.status, pedido.sync_status)}
            <span className="text-gray-light text-xl">›</span>
          </div>
        </div>
      </div>
    </Link>

    {/* Botón flotante de acción */}
    <button
      onClick={handleCopyToClipboard}
      title="Copiar información"
      className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-light text-gray-dark p-2 rounded-full shadow-md transition"
    >
      📋
    </button>
  </div>


  )
  
}

/**
 * Estado de carga
 */
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Cargando pedidos...</p>
    </div>
  )
}

/**
 * Estado de error
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-icon">❌</div>
      <h3>Error al cargar pedidos</h3>
      <p>{error}</p>
      <button className="btn-retry" onClick={onRetry}>
        🔄 Reintentar
      </button>
    </div>
  )
}

/**
 * Estado vacío
 */
function EmptyState({ tab }) {
  const messages = {
    pending: {
      icon: '📝',
      title: 'No hay pedidos pendientes',
      subtitle: 'Los nuevos pedidos aparecerán aquí'
    },
    processed: {
      icon: '✅',
      title: 'No hay pedidos procesados',
      subtitle: 'Los pedidos sincronizados aparecerán aquí'
    }
  }

  const message = messages[tab] || messages.pending

  return (
    <div className="empty-state">
      <div className="empty-icon">{message.icon}</div>
      <h3>{message.title}</h3>
      <p>{message.subtitle}</p>
    </div>
  )
} 