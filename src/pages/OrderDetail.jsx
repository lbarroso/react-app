/**
 * FASE 3 - Detalle de Pedido con edición in-place
 * Cabecera editable + tabla de items para pedidos pending
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  getPedidosByStatus, 
  updatePedidoHeader, 
  updatePedidoItem,
  getPendingPedidosDeep,
  getPedidoWithItems 
} from '../utils/indexedDB'
import { searchClientsByName } from '../utils/indexedDB'
import { shareViaWhatsApp, copyPedidoToClipboard } from '../utils/whatsappShare'
import NumberStepper from '../components/NumberStepper'
import './OrderDetail.css'
import '../css/design-system.css'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialogRef = useRef(null)
  
  // Estados principales
  const [pedido, setPedido] = useState(null)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para edición de cabecera
  const [editedHeader, setEditedHeader] = useState({})
  const [clientes, setClientes] = useState([])
  const [clienteSearch, setClienteSearch] = useState('')

  /**
   * Carga el pedido y sus items
   */
  const loadPedido = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`📋 Cargando pedido ${id}...`)
      
      // Usar la nueva función que funciona para cualquier status
      const foundPedido = await getPedidoWithItems(parseInt(id))
      
      if (!foundPedido) {
        throw new Error(`Pedido ${id} no encontrado`)
      }
      
      setPedido(foundPedido)
      setItems(foundPedido.items || [])
      setEditedHeader({
        ctecve: foundPedido.ctecve,
        ctename: foundPedido.ctename,
        notes: foundPedido.notes || ''
      })
      
      console.log(`✅ Pedido ${id} cargado:`, foundPedido)
      console.log(`📦 Items cargados: ${foundPedido.items?.length || 0}`)
      
    } catch (err) {
      console.error('Error cargando pedido:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  /**
   * Busca clientes para el dropdown
   */
  const searchClientes = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientes([])
      return
    }
    
    try {
      // Usar almcnt del pedido actual
      const almcnt = pedido?.almcnt || 2033
      const results = await searchClientsByName(almcnt, searchTerm, 10)
      setClientes(results)
    } catch (error) {
      console.error('Error buscando clientes:', error)
      setClientes([])
    }
  }, [pedido?.almcnt])

  /**
   * Maneja inicio de edición
   */
  const handleStartEdit = () => {
    if (pedido?.status === 'processed') {
      alert('⚠️ No se puede editar un pedido ya procesado')
      return
    }
    setIsEditing(true)
  }

  /**
   * Maneja cancelar edición
   */
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedHeader({
      ctecve: pedido.ctecve,
      ctename: pedido.ctename,
      notes: pedido.notes || ''
    })
    setClienteSearch('')
    setClientes([])
  }

  /**
   * Maneja guardar cabecera
   */
  const handleSaveHeader = async () => {
    if (!pedido || isSaving) return
    
    setIsSaving(true)
    try {
      const updates = {
        ctecve: editedHeader.ctecve,
        ctename: editedHeader.ctename,
        notes: editedHeader.notes
      }
      
      await updatePedidoHeader(pedido.id, updates)
      
      // Actualizar estado local
      setPedido(prev => ({ ...prev, ...updates }))
      setIsEditing(false)
      setClienteSearch('')
      setClientes([])
      
      console.log(`✅ Cabecera del pedido ${pedido.id} actualizada`)
      
    } catch (error) {
      console.error('Error actualizando cabecera:', error)
      alert(`Error al guardar: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Maneja selección de cliente
   */
  const handleSelectCliente = (cliente) => {
    setEditedHeader(prev => ({
      ...prev,
      ctecve: cliente.ctecve,
      ctename: cliente.name
    }))
    setClienteSearch(cliente.name)
    setClientes([])
  }

  /**
   * Maneja compartir por WhatsApp
   */
  const handleWhatsAppShare = () => {
    shareViaWhatsApp(pedido, items)
  }

  /**
   * Maneja copiar al portapapeles
   */
  const handleCopyToClipboard = async () => {
    const success = await copyPedidoToClipboard(pedido, items)
    if (success) {
      alert('✅ Información del pedido copiada al portapapeles')
    } else {
      alert('❌ Error al copiar la información')
    }
  }

  /**
   * Maneja actualización de item
   */
  const handleUpdateItem = async (itemId, field, value) => {
    if (pedido?.status === 'processed') {
      alert('⚠️ No se puede editar un pedido ya procesado')
      return
    }
    
    try {
      const numericValue = field === 'quantity' || field === 'unit_price' 
        ? parseFloat(value) || 0 
        : value
      
      if (field === 'quantity' && numericValue < 1) {
        alert('La cantidad debe ser mayor a 0')
        return
      }
      
      if (field === 'unit_price' && numericValue < 0) {
        alert('El precio no puede ser negativo')
        return
      }
      
      await updatePedidoItem(itemId, { [field]: numericValue })
      
      // Actualizar estado local
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [field]: numericValue,
              total_price: field === 'quantity' || field === 'unit_price'
                ? (field === 'quantity' ? numericValue : item.quantity) * (field === 'unit_price' ? numericValue : item.unit_price)
                : item.total_price
            }
          : item
      ))
      
      // Recargar pedido para obtener total actualizado
      setTimeout(loadPedido, 500)
      
    } catch (error) {
      console.error('Error actualizando item:', error)
      alert(`Error al actualizar: ${error.message}`)
    }
  }

  /**
   * Maneja eliminación de item
   */
  const handleDeleteItem = async (itemId) => {
    if (pedido?.status === 'processed') {
      alert('⚠️ No se puede editar un pedido ya procesado')
      return
    }
    
    if (!confirm('¿Estás seguro de eliminar este producto del pedido?')) {
      return
    }
    
    try {
      // TODO: Implementar función deleteItemPedido
      console.log(`🗑️ TODO: Eliminar item ${itemId}`)
      alert('🚧 Función de eliminar en desarrollo')
      
    } catch (error) {
      console.error('Error eliminando item:', error)
      alert(`Error al eliminar: ${error.message}`)
    }
  }

  // Effect para cargar pedido y abrir dialog
  useEffect(() => {
    loadPedido()
    
    // Abrir dialog fullscreen al montar
    if (dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [loadPedido])
  
  // Manejo del cierre del dialog
  const handleCloseDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.close()
    }
    navigate('/pedidos')
  }

  // Effect para búsqueda de clientes
  useEffect(() => {
    if (isEditing && clienteSearch !== editedHeader.ctename) {
      const timeoutId = setTimeout(() => {
        searchClientes(clienteSearch)
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [clienteSearch, isEditing, editedHeader.ctename, searchClientes])

  return (
    <dialog ref={dialogRef} className="dialog-fullscreen" onClose={handleCloseDialog}>
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onBack={handleCloseDialog} />
      ) : !pedido ? (
        <NotFoundState onBack={handleCloseDialog} />
      ) : (
        <>
          {/* Header con navegación */}
          <div className="nav-header">
            <div className="flex items-center gap-md">
              <button className="back-btn" onClick={handleCloseDialog}>
                ← Pedidos
              </button>
              <button 
                className="back-btn home-btn"
                onClick={() => navigate('/dashboard')}
              >
                🏠 Dashboard
              </button>
              <h1 className="nav-title">Pedido #{pedido.id}</h1>
            </div>
            
            <div className="nav-actions">
              {/* Botones de compartir */}
              <button 
                className="btn btn-ghost whatsapp-share-btn" 
                onClick={handleWhatsAppShare}
                title="Compartir por WhatsApp"
              >
                📱 WhatsApp
              </button>
              
              <button 
                className="btn btn-ghost copy-share-btn" 
                onClick={handleCopyToClipboard}
                title="Copiar información"
              >
                📋 Copiar
              </button>
              
              {pedido.status === 'pending' && !isEditing && (
                <button className="btn btn-primary" onClick={handleStartEdit}>
                  ✏️ Editar
                </button>
              )}
              
              {isEditing && (
                <div className="flex gap-sm">
                  <button 
                    className="btn btn-ghost" 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveHeader}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="container">
            {/* Información del pedido */}
            <div style={{marginBottom: 'var(--space-xl)'}}>
              <OrderHeader 
                pedido={pedido}
                isEditing={isEditing}
                editedHeader={editedHeader}
                setEditedHeader={setEditedHeader}
                clienteSearch={clienteSearch}
                setClienteSearch={setClienteSearch}
                clientes={clientes}
                onSelectCliente={handleSelectCliente}
              />
            </div>

            {/* Tabla de items */}
            <div>
              <OrderItemsTable 
                items={items}
                isEditable={pedido.status === 'pending' || pedido.status === 'processed'}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            </div>
          </div>
        </>
      )}
    </dialog>
  )
}

/**
 * Componente de cabecera del pedido
 */
function OrderHeader({ 
  pedido, 
  isEditing, 
  editedHeader, 
  setEditedHeader,
  clienteSearch,
  setClienteSearch,
  clientes,
  onSelectCliente 
}) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES')
  }

  const getStatusBadge = (status, syncStatus) => {
    if (status === 'pending') {
      return <span className="status-badge pending">🕓 Pendiente</span>
    }
    if (status === 'processed') {
      if (syncStatus === 'synced') {
        return <span className="status-badge processed">✅ Sincronizado</span>
      }
      return <span className="status-badge processed-local">📱 Local</span>
    }
    return <span className="status-badge unknown">❓ Desconocido</span>
  }

  return (
    <div className="order-header-card">
      <div className="header-row">
        <div className="header-col">
          <label>Estado</label>
          <div>{getStatusBadge(pedido.status, pedido.sync_status)}</div>
        </div>
        
        <div className="header-col">
          <label>Total</label>
          <div className="order-total">${pedido.total_amount?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="header-col">
          <label>Fecha</label>
          <div>{formatDate(pedido.created_at)}</div>
        </div>
        
        <div className="header-col">
          <label>Almacén</label>
          <div>#{pedido.almcnt}</div>
        </div>
      </div>

      <div className="header-row">
        <div className="header-col-full">
          <label>Cliente</label>
          {isEditing ? (
            <div className="client-edit">
              <input
                type="text"
                className="client-search-input"
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                placeholder="Buscar cliente..."
              />
              {clientes.length > 0 && (
                <div className="client-dropdown">
                  {clientes.map(cliente => (
                    <div
                      key={`${cliente.almcnt}-${cliente.ctecve}`}
                      className="client-option"
                      onClick={() => onSelectCliente(cliente)}
                    >
                      <div className="client-name">{cliente.name}</div>
                      <div className="client-code">#{cliente.ctecve}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="client-display">
              <span className="client-name">{pedido.ctename}</span>
              <span className="client-code">#{pedido.ctecve}</span>
            </div>
          )}
        </div>
      </div>

      <div className="header-row">
        <div className="header-col-full">
          <label>Notas</label>
          {isEditing ? (
            <textarea
              className="notes-input"
              value={editedHeader.notes}
              onChange={(e) => setEditedHeader(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Agregar notas del pedido..."
              rows={3}
            />
          ) : (
            <div className="notes-display">
              {pedido.notes || 'Sin notas'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Tabla de items del pedido
 */
function OrderItemsTable({ items, isEditable, onUpdateItem, onDeleteItem }) {
  if (!items || items.length === 0) {
    return (
      <div className="items-empty">
        <div className="empty-icon">📦</div>
        <h3>Sin productos</h3>
        <p>Este pedido no tiene productos asociados</p>
      </div>
    )
  }

  return (
    <div className="items-table-container">
      <h3 className="items-title">Productos ({items.length})</h3>
      
      <div className="items-table">
        <div className="table-header">
          <div className="col-product">Producto</div>
          <div className="col-quantity">Cant.</div>
          <div className="col-price">Precio Unit.</div>
          <div className="col-total">Total</div>
          {isEditable && <div className="col-actions">Acciones</div>}
        </div>
        
        <div className="table-body">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              isEditable={isEditable}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
        
        <div className="table-footer">
          <div className="footer-total">
            <strong>
              Total: ${items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Fila individual de item
 */
function ItemRow({ item, isEditable, onUpdateItem, onDeleteItem }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    quantity: item.quantity,
    unit_price: item.unit_price
  })

  const handleSave = async () => {
    try {
      if (editValues.quantity !== item.quantity) {
        await onUpdateItem(item.id, 'quantity', editValues.quantity)
      }
      if (editValues.unit_price !== item.unit_price) {
        await onUpdateItem(item.id, 'unit_price', editValues.unit_price)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error guardando item:', error)
    }
  }

  const handleCancel = () => {
    setEditValues({
      quantity: item.quantity,
      unit_price: item.unit_price
    })
    setIsEditing(false)
  }

  return (
    <div className="table-row">
      <div className="col-product">
        <div className="product-info">
          <div className="product-name">{item.product_name || 'Sin nombre'}</div>
          <div className="product-code">#{item.product_code || item.product_id}</div>
        </div>
      </div>
      
      <div className="col-quantity">
        {isEditable && isEditing ? (
          <NumberStepper
            value={editValues.quantity}
            min={1}
            max={9999}
            onChange={(value) => setEditValues(prev => ({ ...prev, quantity: value }))}
            size="small"
          />
        ) : (
          <span>{item.quantity}</span>
        )}
      </div>
      
      <div className="col-price">
        {isEditable && isEditing ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={editValues.unit_price}
            onChange={(e) => setEditValues(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
            className="price-input"
          />
        ) : (
          <span>${item.unit_price?.toFixed(2) || '0.00'}</span>
        )}
      </div>
      
      <div className="col-total">
        <strong>${item.total_price?.toFixed(2) || '0.00'}</strong>
      </div>
      
      {isEditable && (
        <div className="col-actions">
          {isEditing ? (
            <div className="edit-actions">
              <button className="btn-save-item" onClick={handleSave}>
                ✓
              </button>
              <button className="btn-cancel-item" onClick={handleCancel}>
                ✕
              </button>
            </div>
          ) : (
            <div className="item-actions">
              <button className="btn-edit-item" onClick={() => setIsEditing(true)}>
                ✏️
              </button>
              <button className="btn-delete-item" onClick={() => onDeleteItem(item.id)}>
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Estados especiales
 */
function LoadingState() {
  return (
    <div className="detail-loading">
      <div className="loading-spinner"></div>
      <p>Cargando pedido...</p>
    </div>
  )
}

function ErrorState({ error, onBack }) {
  return (
    <div className="detail-error">
      <div className="error-icon">❌</div>
      <h3>Error al cargar pedido</h3>
      <p>{error}</p>
      <button className="btn-back" onClick={onBack}>
        ← Volver a Pedidos
      </button>
    </div>
  )
}

function NotFoundState({ onBack }) {
  return (
    <div className="detail-not-found">
      <div className="not-found-icon">🔍</div>
      <h3>Pedido no encontrado</h3>
      <p>El pedido solicitado no existe o fue eliminado</p>
      <button className="btn-back" onClick={onBack}>
        ← Volver a Pedidos
      </button>
    </div>
  )
} 