/**
 * TESTING - Verificar que el detalle de pedidos funcione correctamente
 */

import { getPedidoWithItems, getItemsByPedidoId } from './indexedDB'

/**
 * Testa la carga de un pedido específico con sus items
 * @param {number} pedidoId - ID del pedido a testear
 */
export async function testOrderDetail(pedidoId) {
  console.log(`🧪 TESTING: Detalle de pedido ${pedidoId}`)
  
  try {
    // Usar la nueva función getPedidoWithItems
    const pedido = await getPedidoWithItems(pedidoId)
    
    if (!pedido) {
      console.error(`❌ Pedido ${pedidoId} no encontrado`)
      return { success: false, error: 'Pedido no encontrado' }
    }
    
    console.log('📋 PEDIDO CARGADO:')
    console.log(`   ID: ${pedido.id}`)
    console.log(`   Cliente: ${pedido.ctename} (${pedido.ctecve})`)
    console.log(`   Status: ${pedido.status}`)
    console.log(`   Sync Status: ${pedido.sync_status}`)
    console.log(`   Total: $${pedido.total_amount}`)
    console.log(`   Items: ${pedido.items?.length || 0}`)
    
    if (pedido.items && pedido.items.length > 0) {
      console.log('\n📦 ITEMS:')
      pedido.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product_name} (${item.product_code})`)
        console.log(`      Cantidad: ${item.quantity} | Precio: $${item.unit_price} | Total: $${item.total_price}`)
      })
      
      // Verificar totales
      const itemsTotal = pedido.items.reduce((sum, item) => sum + item.total_price, 0)
      const totalMatch = Math.abs(itemsTotal - pedido.total_amount) < 0.01
      
      console.log('\n🧮 VERIFICACIÓN DE TOTALES:')
      console.log(`   Suma items: $${itemsTotal.toFixed(2)}`)
      console.log(`   Total pedido: $${pedido.total_amount.toFixed(2)}`)
      console.log(`   ✅ Totales coinciden: ${totalMatch}`)
      
      return { 
        success: true, 
        pedido, 
        itemsCount: pedido.items.length,
        totalMatch 
      }
    } else {
      console.warn('⚠️ El pedido no tiene items asociados')
      return { 
        success: false, 
        error: 'Sin items',
        pedido 
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing order detail:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Lista todos los pedidos y sus items para debugging
 */
export async function debugAllPedidosWithItems() {
  console.log('🔍 DEBUG: Todos los pedidos con items')
  
  try {
    // Obtener todos los IDs de pedidos de IndexedDB
    const { getDB, PEDIDOS_STORE, PEDIDOS_ITEMS_STORE } = await import('./indexedDB')
    
    const db = await getDB()
    const tx = db.transaction([PEDIDOS_STORE, PEDIDOS_ITEMS_STORE], 'readonly')
    
    const pedidosStore = tx.objectStore(PEDIDOS_STORE)
    const allPedidos = await pedidosStore.getAll()
    
    const itemsStore = tx.objectStore(PEDIDOS_ITEMS_STORE)
    const allItems = await itemsStore.getAll()
    
    await tx.done
    
    console.log(`📋 Total pedidos: ${allPedidos.length}`)
    console.log(`📦 Total items: ${allItems.length}`)
    
    // Agrupar items por pedido
    const itemsByPedido = {}
    allItems.forEach(item => {
      if (!itemsByPedido[item.pedido_id]) {
        itemsByPedido[item.pedido_id] = []
      }
      itemsByPedido[item.pedido_id].push(item)
    })
    
    console.log('\n📊 RESUMEN POR PEDIDO:')
    allPedidos.forEach(pedido => {
      const items = itemsByPedido[pedido.id] || []
      console.log(`   Pedido ${pedido.id}: ${items.length} items, status: ${pedido.status}, cliente: ${pedido.ctename}`)
    })
    
    // Identificar pedidos sin items
    const pedidosSinItems = allPedidos.filter(p => !itemsByPedido[p.id] || itemsByPedido[p.id].length === 0)
    if (pedidosSinItems.length > 0) {
      console.warn('\n⚠️ PEDIDOS SIN ITEMS:')
      pedidosSinItems.forEach(pedido => {
        console.warn(`   Pedido ${pedido.id}: ${pedido.ctename}, total: $${pedido.total_amount}`)
      })
    }
    
    return {
      totalPedidos: allPedidos.length,
      totalItems: allItems.length,
      pedidosSinItems: pedidosSinItems.length,
      itemsByPedido
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return { error: error.message }
  }
}

/**
 * Fuerza la recarga de un pedido específico en la UI
 * @param {number} pedidoId - ID del pedido
 */
export async function forceReloadOrderDetail(pedidoId) {
  console.log(`🔄 Forzando recarga del pedido ${pedidoId}`)
  
  // Primero testear que los datos estén correctos
  const testResult = await testOrderDetail(pedidoId)
  
  if (!testResult.success) {
    console.error('❌ Los datos del pedido tienen problemas:', testResult.error)
    return testResult
  }
  
  // Si la página actual es el detalle de este pedido, forzar recarga
  if (window.location.pathname === `/pedidos/${pedidoId}`) {
    console.log('🔄 Recargando página del detalle...')
    window.location.reload()
  } else {
    console.log('💡 Para ver los cambios, navega a: /pedidos/' + pedidoId)
  }
  
  return testResult
}

// Hacer funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  window.testOrderDetail = testOrderDetail
  window.debugAllPedidosWithItems = debugAllPedidosWithItems
  window.forceReloadOrderDetail = forceReloadOrderDetail
  
  console.log('🧪 Funciones de testing detalle de pedidos disponibles:')
  console.log('  • testOrderDetail(pedidoId) - Testa carga de pedido específico')
  console.log('  • debugAllPedidosWithItems() - Debug todos los pedidos y items')
  console.log('  • forceReloadOrderDetail(pedidoId) - Fuerza recarga del detalle')
} 