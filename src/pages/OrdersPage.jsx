/**
 * FASE 3 - Página de Administración de Pedidos
 * Lista con tabs Pendientes/Procesados y scroll infinito
 */

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPedidosByStatus } from '../utils/indexedDB'
import './OrdersPage.css'
import '../css/design-system.css'

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
    <div className="orders-page">
      {/* Header con navegación */}
      <div className="nav-header">
        <div className="flex items-center gap-md">
          <button 
            className="back-btn home-btn"
            onClick={() => navigate('/dashboard')}
          >
            🏠 Dashboard
          </button>
          <h1 className="nav-title">📋 Gestión de Pedidos</h1>
        </div>
        
        {/* Sync Status */}
        <div className="nav-actions">
          <span className={`badge ${isOnline ? 'badge-success' : 'badge-error'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {syncStats.lastSync && (
            <span className="badge badge-gray">
              {new Date(syncStats.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          🕓 Pendientes
          {syncStats.pendingCount > 0 && (
            <span className="tab-badge">{syncStats.pendingCount}</span>
          )}
        </button>
        
        <button
          className={`tab-button ${activeTab === 'processed' ? 'active' : ''}`}
          onClick={() => handleTabChange('processed')}
        >
          ✅ Procesados
          {syncStats.totalSynced > 0 && (
            <span className="tab-badge-secondary">{syncStats.totalSynced}</span>
          )}
        </button>
      </div>

      {/* Action Bar */}
      <div className="container">
        <div className="flex gap-md" style={{marginBottom: 'var(--space-lg)'}}>
          <button 
            className="btn btn-ghost" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            🔄 Actualizar
          </button>
          
          {hasPendingOrders && (
            <button
              className="btn btn-primary"
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
            >
              {isSyncing ? '⏳ Sincronizando...' : '📤 Sincronizar'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="orders-content">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRefresh} />
        ) : pedidos.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <OrdersList pedidos={pedidos} />
        )}
      </div>

      {/* FAB Sync (solo si hay pending y está online) */}
      {hasPendingOrders && isOnline && activeTab === 'pending' && (
        <button
          className="fab-sync"
          onClick={handleManualSync}
          disabled={isSyncing}
          title="Sincronizar pedidos pendientes"
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

  return (
    <Link to={`/pedidos/${pedido.id}`} className="card card-responsive" style={{textDecoration: 'none', color: 'inherit'}}>
      <div className="card-padding">
        <div className="flex justify-between items-center" style={{marginBottom: 'var(--space-md)'}}>
          <div>
            <h3 style={{margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--gray-900)'}}>
              #{pedido.id}
            </h3>
            <p style={{margin: '0.25rem 0 0 0', color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)'}}>
              {pedido.ctename}
            </p>
          </div>
          <div style={{textAlign: 'right'}}>
            <span style={{fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--success-color)'}}>
              ${pedido.total_amount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center" style={{paddingTop: 'var(--space-md)', borderTop: '1px solid var(--gray-100)'}}>
          <div className="stack stack-sm">
            <span style={{fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
              📅 {formatDate(pedido.created_at)}
            </span>
            {pedido.almcnt && (
              <span style={{fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                🏪 Almacén {pedido.almcnt}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-sm">
            {getStatusBadge(pedido.status, pedido.sync_status)}
            <span style={{color: 'var(--gray-300)', fontSize: 'var(--font-size-lg)'}}>›</span>
          </div>
        </div>
      </div>
    </Link>
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