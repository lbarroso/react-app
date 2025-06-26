/**
 * FASE 1 - Test de funciones de pedidos
 * Ejecutar en consola del navegador para verificar implementación
 */

import { 
  createPedido, 
  getPedidosByStatus, 
  updatePedidoHeader, 
  updatePedidoItem, 
  clearCarritoByAlmcnt, 
  getPendingPedidosDeep, 
  markPedidoProcessed 
} from './indexedDB.js'

/**
 * Test completo de funciones FASE 1
 */
export async function testFase1() {
  console.log('🧪 Iniciando tests FASE 1...')
  
  try {
    // 1. Test createPedido
    console.log('\n📝 Test 1: createPedido()')
    const header = {
      almcnt: 2033,
      ctecve: 142,
      ctename: 'AGUA DE SOL',
      user_id: 'test_user',
      total_amount: 150.50,
      notes: 'Pedido de prueba'
    }
    
    const items = [
      {
        product_id: 1001,
        quantity: 2,
        unit_price: 50.25,
        total_price: 100.50,
        product_name: 'Producto Test 1',
        product_code: 'PT001'
      },
      {
        product_id: 1002,
        quantity: 1,
        unit_price: 50.00,
        total_price: 50.00,
        product_name: 'Producto Test 2',
        product_code: 'PT002'
      }
    ]
    
    const orderId = await createPedido(header, items)
    console.log(`✅ Pedido creado con ID: ${orderId}`)
    
    // 2. Test getPedidosByStatus
    console.log('\n📋 Test 2: getPedidosByStatus("pending")')
    const pendingPedidos = await getPedidosByStatus('pending')
    console.log(`✅ Pedidos pending encontrados: ${pendingPedidos.length}`)
    console.log('Primer pedido:', pendingPedidos[0])
    
    // 3. Test updatePedidoHeader
    console.log('\n✏️ Test 3: updatePedidoHeader()')
    await updatePedidoHeader(orderId, { 
      notes: 'Pedido actualizado desde test',
      total_amount: 200.75
    })
    console.log('✅ Header actualizado')
    
    // 4. Test getPendingPedidosDeep
    console.log('\n🔍 Test 4: getPendingPedidosDeep()')
    const deepPedidos = await getPendingPedidosDeep()
    console.log(`✅ Pedidos con items: ${deepPedidos.length}`)
    if (deepPedidos.length > 0) {
      console.log('Primer pedido con items:', {
        id: deepPedidos[0].id,
        cliente: deepPedidos[0].ctename,
        itemsCount: deepPedidos[0].items.length
      })
    }
    
    // 5. Test updatePedidoItem (si hay items)
    console.log('\n🔧 Test 5: updatePedidoItem()')
    if (deepPedidos.length > 0 && deepPedidos[0].items.length > 0) {
      const firstItem = deepPedidos[0].items[0]
      await updatePedidoItem(firstItem.id, { 
        quantity: 5,
        unit_price: 75.00
      })
      console.log(`✅ Item ${firstItem.id} actualizado`)
    }
    
    // 6. Test markPedidoProcessed
    console.log('\n✅ Test 6: markPedidoProcessed()')
    await markPedidoProcessed(orderId, 999)
    console.log(`✅ Pedido ${orderId} marcado como procesado`)
    
    // 7. Test getPedidosByStatus("processed")
    console.log('\n📋 Test 7: getPedidosByStatus("processed")')
    const processedPedidos = await getPedidosByStatus('processed')
    console.log(`✅ Pedidos processed: ${processedPedidos.length}`)
    
    // 8. Test clearCarritoByAlmcnt
    console.log('\n🧹 Test 8: clearCarritoByAlmcnt()')
    await clearCarritoByAlmcnt(2033)
    console.log('✅ Carrito limpiado')
    
    console.log('\n🎉 TODOS LOS TESTS FASE 1 COMPLETADOS EXITOSAMENTE!')
    return { success: true, orderId }
    
  } catch (error) {
    console.error('❌ Error en tests:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test individual de createPedido
 */
export async function testCreatePedido() {
  const header = {
    almcnt: 2033,
    ctecve: 142,
    ctename: 'AGUA DE SOL',
    user_id: 'test_user',
    total_amount: 75.50,
    notes: 'Test individual'
  }
  
  const items = [
    {
      product_id: 9999,
      quantity: 1,
      unit_price: 75.50,
      total_price: 75.50,
      product_name: 'Test Product',
      product_code: 'TEST001'
    }
  ]
  
  return await createPedido(header, items)
}

// Auto-ejecutar en consola
if (typeof window !== 'undefined') {
  window.testFase1 = testFase1
  window.testCreatePedido = testCreatePedido
  console.log('🧪 Tests disponibles:')
  console.log('- testFase1() - Test completo')
  console.log('- testCreatePedido() - Test individual')
} 