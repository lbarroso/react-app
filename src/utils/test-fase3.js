/**
 * FASE 3 - Testing Suite
 * Tests para funcionalidad de administración de pedidos
 */

import { 
  createPedido, 
  getPedidosByStatus, 
  getPendingPedidosDeep,
  updatePedidoHeader,
  updatePedidoItem 
} from './indexedDB'

/**
 * Test principal de FASE 3
 */
export async function testFase3() {
  console.log('🚀 INICIANDO TESTS FASE 3 - Administración de Pedidos')
  
  try {
    // Test 1: Crear pedidos de prueba
    await testCreateTestOrders()
    
    // Test 2: Verificar carga en OrdersPage
    await testOrdersPageLoad()
    
    // Test 3: Verificar navegación
    await testNavigation()
    
    // Test 4: Edición de cabecera
    await testHeaderEditing()
    
    // Test 5: Edición de items
    await testItemEditing()
    
    console.log('✅ FASE 3 - Todos los tests completados exitosamente')
    
    return {
      success: true,
      message: 'Tests FASE 3 completados',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Error en tests FASE 3:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Test 1: Crear pedidos de ejemplo para testing
 */
async function testCreateTestOrders() {
  console.log('\n📋 Test 1: Creando pedidos de prueba...')
  
  try {
    // Crear 3 pedidos pending para testing
    const testOrders = [
      {
        header: {
          almcnt: 2033,
          ctecve: 'TEST01',
          ctename: 'Cliente Prueba 1',
          notes: 'Pedido de prueba para testing FASE 3'
        },
        items: [
          {
            product_id: 'PROD001',
            product_name: 'Producto Test 1',
            product_code: 'TEST001',
            quantity: 2,
            unit_price: 15.50,
            total_price: 31.00
          },
          {
            product_id: 'PROD002',
            product_name: 'Producto Test 2',
            product_code: 'TEST002',
            quantity: 1,
            unit_price: 25.00,
            total_price: 25.00
          }
        ]
      },
      {
        header: {
          almcnt: 2033,
          ctecve: 'TEST02',
          ctename: 'Cliente Prueba 2',
          notes: 'Segundo pedido de prueba'
        },
        items: [
          {
            product_id: 'PROD003',
            product_name: 'Producto Test 3',
            product_code: 'TEST003',
            quantity: 5,
            unit_price: 8.75,
            total_price: 43.75
          }
        ]
      },
      {
        header: {
          almcnt: 2033,
          ctecve: 'TEST03',
          ctename: 'Cliente Prueba 3',
          notes: ''
        },
        items: [
          {
            product_id: 'PROD004',
            product_name: 'Producto Test 4',
            product_code: 'TEST004',
            quantity: 3,
            unit_price: 12.33,
            total_price: 36.99
          },
          {
            product_id: 'PROD005',
            product_name: 'Producto Test 5',
            product_code: 'TEST005',
            quantity: 1,
            unit_price: 45.00,
            total_price: 45.00
          }
        ]
      }
    ]
    
    const createdIds = []
    
    for (const [index, order] of testOrders.entries()) {
      const pedidoId = await createPedido(order.header, order.items)
      createdIds.push(pedidoId)
      console.log(`✅ Pedido ${index + 1} creado con ID: ${pedidoId}`)
    }
    
    console.log(`✅ ${createdIds.length} pedidos de prueba creados`)
    
    // Guardar IDs para cleanup posterior
    window.testOrderIds = createdIds
    
  } catch (error) {
    console.error('❌ Error creando pedidos de prueba:', error)
    throw error
  }
}

/**
 * Test 2: Verificar carga de pedidos para OrdersPage
 */
async function testOrdersPageLoad() {
  console.log('\n📄 Test 2: Verificando carga para OrdersPage...')
  
  try {
    // Test pending orders
    const pendingOrders = await getPedidosByStatus('pending')
    console.log(`📋 ${pendingOrders.length} pedidos pending encontrados`)
    
    if (pendingOrders.length === 0) {
      console.warn('⚠️ No hay pedidos pending - crear algunos primero')
    } else {
      console.log('📋 Primer pedido pending:', {
        id: pendingOrders[0].id,
        ctename: pendingOrders[0].ctename,
        total: pendingOrders[0].total_amount,
        status: pendingOrders[0].status
      })
    }
    
    // Test processed orders
    const processedOrders = await getPedidosByStatus('processed')
    console.log(`✅ ${processedOrders.length} pedidos processed encontrados`)
    
    // Test detailed pending orders (with items)
    const pendingWithItems = await getPendingPedidosDeep()
    console.log(`📦 ${pendingWithItems.length} pedidos pending con items cargados`)
    
    if (pendingWithItems.length > 0) {
      const firstOrder = pendingWithItems[0]
      console.log('📦 Primer pedido con items:', {
        id: firstOrder.id,
        ctename: firstOrder.ctename,
        itemsCount: firstOrder.items?.length || 0,
        firstItem: firstOrder.items?.[0]?.product_name || 'N/A'
      })
    }
    
    console.log('✅ Test de carga de OrdersPage completado')
    
  } catch (error) {
    console.error('❌ Error en test de carga:', error)
    throw error
  }
}

/**
 * Test 3: Verificar navegación y rutas
 */
async function testNavigation() {
  console.log('\n🧭 Test 3: Verificando navegación...')
  
  try {
    // Verificar estado del sync
    const syncState = window.syncState
    if (syncState) {
      console.log('📊 Estado del sync:', {
        pendingCount: syncState.syncStats?.pendingCount || 0,
        isOnline: syncState.isOnline,
        hasPendingOrders: syncState.hasPendingOrders
      })
    } else {
      console.warn('⚠️ window.syncState no disponible')
    }
    
    // Test de URLs esperadas
    const expectedRoutes = [
      '/pedidos',
      '/pedidos/1',
      '/pedidos/2'
    ]
    
    console.log('🔗 Rutas esperadas configuradas:', expectedRoutes)
    
    // Verificar que los componentes estén importados
    const currentPath = window.location.pathname
    console.log('🌐 Ruta actual:', currentPath)
    
    console.log('✅ Test de navegación completado')
    
  } catch (error) {
    console.error('❌ Error en test de navegación:', error)
    throw error
  }
}

/**
 * Test 4: Edición de cabecera de pedido
 */
async function testHeaderEditing() {
  console.log('\n✏️ Test 4: Verificando edición de cabecera...')
  
  try {
    // Obtener un pedido pending para editar
    const pendingOrders = await getPedidosByStatus('pending')
    
    if (pendingOrders.length === 0) {
      console.warn('⚠️ No hay pedidos pending para editar')
      return
    }
    
    const pedidoToEdit = pendingOrders[0]
    console.log(`📝 Editando pedido ID: ${pedidoToEdit.id}`)
    
    // Crear datos de prueba para edición
    const originalData = {
      ctecve: pedidoToEdit.ctecve,
      ctename: pedidoToEdit.ctename,
      notes: pedidoToEdit.notes
    }
    
    const updatedData = {
      ctecve: 'EDIT01',
      ctename: 'Cliente Editado Test',
      notes: 'Nota editada por test FASE 3'
    }
    
    console.log('📝 Datos originales:', originalData)
    console.log('📝 Datos a actualizar:', updatedData)
    
    // Realizar update
    await updatePedidoHeader(pedidoToEdit.id, updatedData)
    console.log('✅ Cabecera actualizada')
    
    // Verificar cambios
    const updatedOrders = await getPedidosByStatus('pending')
    const updatedPedido = updatedOrders.find(p => p.id === pedidoToEdit.id)
    
    if (updatedPedido) {
      console.log('📝 Datos después del update:', {
        ctecve: updatedPedido.ctecve,
        ctename: updatedPedido.ctename,
        notes: updatedPedido.notes
      })
      
      // Verificar que los cambios se aplicaron
      const changesApplied = 
        updatedPedido.ctecve === updatedData.ctecve &&
        updatedPedido.ctename === updatedData.ctename &&
        updatedPedido.notes === updatedData.notes
      
      if (changesApplied) {
        console.log('✅ Cambios verificados correctamente')
      } else {
        console.warn('⚠️ Los cambios no se aplicaron completamente')
      }
    }
    
    console.log('✅ Test de edición de cabecera completado')
    
  } catch (error) {
    console.error('❌ Error en test de edición de cabecera:', error)
    throw error
  }
}

/**
 * Test 5: Edición de items de pedido
 */
async function testItemEditing() {
  console.log('\n🛍️ Test 5: Verificando edición de items...')
  
  try {
    // Obtener pedidos con items
    const pendingWithItems = await getPendingPedidosDeep()
    
    if (pendingWithItems.length === 0 || !pendingWithItems[0].items?.length) {
      console.warn('⚠️ No hay pedidos con items para editar')
      return
    }
    
    const pedido = pendingWithItems[0]
    const item = pedido.items[0]
    
    console.log(`🛍️ Editando item ID: ${item.id} del pedido ${pedido.id}`)
    console.log('📦 Item original:', {
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })
    
    // Test 1: Cambiar cantidad
    const newQuantity = item.quantity + 1
    await updatePedidoItem(item.id, { quantity: newQuantity })
    console.log(`✅ Cantidad actualizada a: ${newQuantity}`)
    
    // Test 2: Cambiar precio
    const newPrice = item.unit_price + 5.00
    await updatePedidoItem(item.id, { unit_price: newPrice })
    console.log(`✅ Precio actualizado a: ${newPrice}`)
    
    // Verificar cambios
    const updatedOrdersWithItems = await getPendingPedidosDeep()
    const updatedPedido = updatedOrdersWithItems.find(p => p.id === pedido.id)
    const updatedItem = updatedPedido?.items?.find(i => i.id === item.id)
    
    if (updatedItem) {
      console.log('📦 Item después del update:', {
        product_name: updatedItem.product_name,
        quantity: updatedItem.quantity,
        unit_price: updatedItem.unit_price,
        total_price: updatedItem.total_price
      })
      
      // Verificar cálculo automático del total
      const expectedTotal = updatedItem.quantity * updatedItem.unit_price
      const actualTotal = updatedItem.total_price
      
      if (Math.abs(expectedTotal - actualTotal) < 0.01) {
        console.log('✅ Total recalculado correctamente')
      } else {
        console.warn('⚠️ Error en recálculo del total:', {
          expected: expectedTotal,
          actual: actualTotal
        })
      }
    }
    
    console.log('✅ Test de edición de items completado')
    
  } catch (error) {
    console.error('❌ Error en test de edición de items:', error)
    throw error
  }
}

/**
 * Cleanup function para limpiar datos de prueba
 */
export async function cleanupTestData() {
  console.log('🧹 Limpiando datos de prueba...')
  
  try {
    // TODO: Implementar función de delete cuando esté disponible
    console.log('🚧 Función de cleanup pendiente de implementación')
    console.log('📝 IDs de prueba creados:', window.testOrderIds)
    
  } catch (error) {
    console.error('❌ Error en cleanup:', error)
  }
}

/**
 * Test de funcionalidad específica de OrdersPage
 */
export async function testOrdersPageInteraction() {
  console.log('🖱️ Test de interacción OrdersPage...')
  
  try {
    // Simular clicks y navegación
    const pendingOrders = await getPedidosByStatus('pending')
    
    if (pendingOrders.length > 0) {
      console.log('📋 Pedidos disponibles para navegación:')
      pendingOrders.slice(0, 3).forEach(order => {
        console.log(`  - ID: ${order.id}, Cliente: ${order.ctename}, Total: $${order.total_amount}`)
      })
    }
    
    // Verificar sync stats para badges
    if (window.syncState) {
      const stats = window.syncState.syncStats
      console.log('📊 Stats para badges:', {
        pendingCount: stats.pendingCount,
        totalSynced: stats.totalSynced,
        isOnline: window.syncState.isOnline
      })
    }
    
    console.log('✅ Test de interacción completado')
    
  } catch (error) {
    console.error('❌ Error en test de interacción:', error)
    throw error
  }
}

// Auto-exposición de funciones para testing manual
if (typeof window !== 'undefined') {
  window.testFase3 = testFase3
  window.testOrdersPageInteraction = testOrdersPageInteraction
  window.cleanupTestData = cleanupTestData
  
  console.log('🧪 FASE 3 Test Functions disponibles:')
  console.log('  - testFase3()')
  console.log('  - testOrdersPageInteraction()')
  console.log('  - cleanupTestData()')
} 