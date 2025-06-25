import { useState, useCallback } from 'react'
import './CheckoutModal.css'

/**
 * @typedef {Object} Cliente
 * @property {number} almcnt - Número de almacén
 * @property {number} ctecve - Código de cliente  
 * @property {string} name - Nombre completo del cliente
 */

/**
 * @typedef {Object} CheckoutModalProps
 * @property {boolean} isOpen - Si el modal está abierto
 * @property {function} onClose - Función para cerrar modal y volver al Dashboard
 * @property {function} onBackToCart - Función para volver al carrito
 * @property {function} onCreateOrder - Función para crear pedido con cliente
 * @property {Array} cartItems - Items del carrito actual
 */

/**
 * Modal de selección de cliente para checkout
 * @param {CheckoutModalProps} props
 */
export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  onBackToCart, 
  onCreateOrder,
  cartItems = [],
  clientesHook
}) {
  // Usar el hook recibido como prop
  const {
    clientes: filteredClientes = [],
    selectedClient = null,
    searchTerm = '',
    loading: isLoading = false,
    showEmptyState = false,
    error = null,
    totalCount = 0,
    setSearchTerm = () => {},
    selectClient = () => {},
    clearSelection = () => {},
    refresh: refreshClients = () => {},
    canCreateOrder = false,
    showNoResults = false,
    searchStats = {
      totalClients: 0,
      displayedResults: 0,
      isFiltered: false,
      searchTerm: ''
    }
  } = clientesHook || {}

  // Estados locales del componente
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  /**
   * Maneja la selección de un cliente
   */
  const handleClientSelect = useCallback((cliente) => {
    selectClient(cliente)
  }, [selectClient])

  /**
   * Maneja el cierre del modal (X button)
   */
  const handleClose = useCallback(() => {
    clearSelection()
    onClose()
  }, [clearSelection, onClose])

  /**
   * Maneja volver al carrito
   */
  const handleBackToCart = useCallback(() => {
    // NO limpiar selección - preservar estado
    onBackToCart()
  }, [onBackToCart])

  /**
   * Maneja la creación del pedido
   */
  const handleCreateOrder = useCallback(async () => {
    if (!selectedClient || !canCreateOrder) {
      console.warn('No se puede crear pedido sin cliente seleccionado')
      return
    }

    setIsCreatingOrder(true)
    try {
      // Preparar datos del pedido
      const orderData = {
        cliente: selectedClient,
        items: cartItems,
        almcnt: selectedClient.almcnt,
        timestamp: Date.now(),
        total_items: cartItems.length,
        total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      }

      console.log('📝 Creando pedido con datos:', orderData)
      
      // Llamar función del padre para procesar el pedido
      await onCreateOrder(orderData)
      
    } catch (error) {
      console.error('❌ Error al crear pedido:', error)
      // TODO: Mostrar notificación de error al usuario
    } finally {
      setIsCreatingOrder(false)
    }
  }, [selectedClient, canCreateOrder, cartItems, onCreateOrder])

  /**
   * Maneja cambios en el input de búsqueda
   */
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [setSearchTerm])

  /**
   * Maneja teclas especiales en el input
   */
  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setSearchTerm('')
    }
  }, [setSearchTerm])

  /**
   * Renderiza el contenido principal según el estado
   */
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />
    }

    if (showEmptyState) {
      return <EmptyState onRefresh={refreshClients} />
    }

    if (showNoResults) {
      return <NoResultsState searchTerm={searchTerm} />
    }

    return (
      <ClientList 
        clientes={filteredClientes}
        selectedClient={selectedClient}
        onClientSelect={handleClientSelect}
      />
    )
  }

  // No renderizar si el modal está cerrado
  if (!isOpen) return null

  return (
    <div className="checkout-modal-overlay" onClick={handleClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <CheckoutHeader onClose={handleClose} />
        
        {/* Search Bar */}
        <SearchBar 
          searchTerm={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          disabled={isLoading || showEmptyState}
        />

        {/* Stats */}
        {!showEmptyState && (
          <SearchStats 
            stats={searchStats}
            selectedClient={selectedClient}
          />
        )}

        {/* Content Area */}
        <div className="checkout-content">
          {renderContent()}
        </div>

        {/* Footer */}
        <CheckoutFooter 
          onBackToCart={handleBackToCart}
          onCreateOrder={handleCreateOrder}
          canCreateOrder={canCreateOrder}
          isCreatingOrder={isCreatingOrder}
          selectedClient={selectedClient}
        />

        {/* Error Display */}
        {error && (
          <ErrorBanner 
            error={error} 
            onRetry={refreshClients}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Componente Header del modal
 */
function CheckoutHeader({ onClose }) {
  return (
    <div className="checkout-header">
      <h2 className="checkout-title">Seleccionar Cliente</h2>
      <button 
        className="checkout-close-btn"
        onClick={onClose}
        aria-label="Cerrar modal"
        type="button"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Componente de barra de búsqueda
 */
function SearchBar({ searchTerm, onChange, onKeyDown, disabled }) {
  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar cliente por nombre"
          value={searchTerm}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoComplete="off"
          aria-label="Buscar cliente por nombre"
        />
        <span className="search-icon">🔍</span>
      </div>
    </div>
  )
}

/**
 * Componente de estadísticas de búsqueda
 */
function SearchStats({ stats, selectedClient }) {
  return (
    <div className="search-stats">
      <span className="stats-text">
        {stats.isFiltered 
          ? `${stats.displayedResults} resultados de ${stats.totalClients}`
          : `${stats.totalClients} clientes disponibles`
        }
      </span>
      {selectedClient && (
        <span className="selected-indicator">
          ✓ Cliente seleccionado
        </span>
      )}
    </div>
  )
}

/**
 * Componente lista de clientes
 */
function ClientList({ clientes, selectedClient, onClientSelect }) {
  return (
    <div className="client-list">
      {clientes.map((cliente) => (
        <ClientRow
          key={`${cliente.almcnt}-${cliente.ctecve}`}
          cliente={cliente}
          isSelected={selectedClient?.ctecve === cliente.ctecve}
          onSelect={() => onClientSelect(cliente)}
        />
      ))}
    </div>
  )
}

/**
 * Componente fila de cliente individual
 */
function ClientRow({ cliente, isSelected, onSelect }) {
  return (
    <div className={`client-row ${isSelected ? 'selected' : ''}`}>
      <div className="client-info">
        <div className="client-name">{cliente.name}</div>
        <div className="client-code">ctecve: {cliente.ctecve}</div>
      </div>
      <button
        className={`select-btn ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
        type="button"
      >
        {isSelected ? 'Seleccionado ✓' : 'Seleccionar'}
      </button>
    </div>
  )
}

/**
 * Componente footer con botones de acción
 */
function CheckoutFooter({ 
  onBackToCart, 
  onCreateOrder, 
  canCreateOrder, 
  isCreatingOrder,
  selectedClient 
}) {
  return (
    <div className="checkout-footer">
      <button
        className="back-btn"
        onClick={onBackToCart}
        disabled={isCreatingOrder}
        type="button"
      >
        Volver al Carrito
      </button>
      
      <button
        className={`create-order-btn ${canCreateOrder ? 'enabled' : 'disabled'}`}
        onClick={onCreateOrder}
        disabled={!canCreateOrder || isCreatingOrder}
        type="button"
        aria-label={selectedClient 
          ? `Crear pedido para ${selectedClient.name}`
          : 'Seleccione un cliente para crear pedido'
        }
      >
        {isCreatingOrder ? (
          <>
            <span className="spinner">⏳</span>
            Creando...
          </>
        ) : (
          <>
            {canCreateOrder ? '✓' : '🔒'} Crear Pedido
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Componente estado de carga
 */
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner">⏳</div>
      <p>Cargando clientes...</p>
    </div>
  )
}

/**
 * Componente estado vacío
 */
function EmptyState({ onRefresh }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <h3>No hay clientes disponibles</h3>
      <p>No se encontraron clientes para este almacén.</p>
      <button className="refresh-btn" onClick={onRefresh} type="button">
        🔄 Actualizar
      </button>
    </div>
  )
}

/**
 * Componente sin resultados de búsqueda
 */
function NoResultsState({ searchTerm }) {
  return (
    <div className="no-results-state">
      <div className="no-results-icon">🔍</div>
      <h3>No se encontraron clientes</h3>
      <p>No hay resultados para <strong>"{searchTerm}"</strong></p>
      <p>Intente con un término diferente.</p>
    </div>
  )
}

/**
 * Componente banner de error
 */
function ErrorBanner({ error, onRetry }) {
  return (
    <div className="error-banner">
      <span className="error-icon">⚠️</span>
      <span className="error-message">{error}</span>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry} type="button">
          Reintentar
        </button>
      )}
    </div>
  )
} 