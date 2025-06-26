// Test file para verificar migración a IndexedDB v6
import { getDB, getDBInfo, STORES } from './getDB.js'

/**
 * Función para probar la migración a v6
 */
export async function testDBMigration() {
  console.log('🧪 Testing IndexedDB v6 migration...')
  
  try {
    // 1. Obtener información de la base de datos
    const dbInfo = await getDBInfo()
    console.log('📊 Database Info:', dbInfo)
    
    // 2. Verificar versión
    if (dbInfo.version !== 6) {
      throw new Error(`Expected version 6, got ${dbInfo.version}`)
    }
    console.log('✅ Database version is correct: v6')
    
    // 3. Verificar que existen todos los stores
    const expectedStores = [
      STORES.PRODUCTOS,
      STORES.CARRITO,
      STORES.SESSION,
      STORES.CLIENTES,
      STORES.PEDIDOS,        // NUEVO en v6
      STORES.PEDIDOS_ITEMS   // NUEVO en v6
    ]
    
    for (const store of expectedStores) {
      if (!dbInfo.stores.includes(store)) {
        throw new Error(`Missing store: ${store}`)
      }
      console.log(`✅ Store exists: ${store}`)
    }
    
    // 4. Verificar estructura de stores nuevos
    const db = await getDB()
    
    // Verificar store pedidos
    const tx1 = db.transaction(STORES.PEDIDOS, 'readonly')
    const pedidosStore = tx1.objectStore(STORES.PEDIDOS)
    
    console.log('🔍 Pedidos store keyPath:', pedidosStore.keyPath)
    console.log('🔍 Pedidos store autoIncrement:', pedidosStore.autoIncrement)
    console.log('🔍 Pedidos store indexNames:', Array.from(pedidosStore.indexNames))
    
    // Verificar store pedidos_items
    const tx2 = db.transaction(STORES.PEDIDOS_ITEMS, 'readonly')
    const pedidosItemsStore = tx2.objectStore(STORES.PEDIDOS_ITEMS)
    
    console.log('🔍 Pedidos_items store keyPath:', pedidosItemsStore.keyPath)
    console.log('🔍 Pedidos_items store autoIncrement:', pedidosItemsStore.autoIncrement)
    console.log('🔍 Pedidos_items store indexNames:', Array.from(pedidosItemsStore.indexNames))
    
    await tx1.done
    await tx2.done
    
    console.log('🎉 Migration test completed successfully!')
    return {
      success: true,
      version: dbInfo.version,
      stores: dbInfo.stores,
      message: 'IndexedDB v6 migration successful'
    }
    
  } catch (error) {
    console.error('❌ Migration test failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'IndexedDB v6 migration failed'
    }
  }
}

/**
 * Función para probar inserción de datos en los nuevos stores
 */
export async function testNewStoresData() {
  console.log('🧪 Testing data insertion in new stores...')
  
  try {
    const db = await getDB()
    
    // Test data para pedido
    const testPedido = {
      almcnt: 2033,
      ctecve: 12345,
      client_name: 'Cliente Test',
      created_at: Date.now(),
      status: 'CREADO',
      sync_status: 'PENDING',
      total_amount: 150.00,
      total_items: 2
    }
    
    // Test data para pedido_items
    const testPedidoItems = [
      {
        pedido_id: 1, // Se asignará automáticamente
        product_id: 'PROD001',
        product_name: 'Producto Test 1',
        quantity: 2,
        unit_price: 50.00,
        total_price: 100.00
      },
      {
        pedido_id: 1, // Se asignará automáticamente
        product_id: 'PROD002',
        product_name: 'Producto Test 2',
        quantity: 1,
        unit_price: 50.00,
        total_price: 50.00
      }
    ]
    
    // 1. Insertar pedido
    const tx1 = db.transaction(STORES.PEDIDOS, 'readwrite')
    const pedidosStore = tx1.objectStore(STORES.PEDIDOS)
    const pedidoId = await pedidosStore.add(testPedido)
    await tx1.done
    
    console.log('✅ Pedido inserted with ID:', pedidoId)
    
    // 2. Insertar items del pedido
    const tx2 = db.transaction(STORES.PEDIDOS_ITEMS, 'readwrite')
    const itemsStore = tx2.objectStore(STORES.PEDIDOS_ITEMS)
    
    for (const item of testPedidoItems) {
      item.pedido_id = pedidoId // Asignar el ID del pedido
      const itemId = await itemsStore.add(item)
      console.log('✅ Pedido item inserted with ID:', itemId)
    }
    
    await tx2.done
    
    // 3. Verificar datos insertados
    const tx3 = db.transaction([STORES.PEDIDOS, STORES.PEDIDOS_ITEMS], 'readonly')
    
    const pedido = await tx3.objectStore(STORES.PEDIDOS).get(pedidoId)
    const items = await tx3.objectStore(STORES.PEDIDOS_ITEMS).index('by-pedido').getAll(pedidoId)
    
    console.log('📦 Retrieved pedido:', pedido)
    console.log('📦 Retrieved items:', items)
    
    await tx3.done
    
    console.log('🎉 Data insertion test completed successfully!')
    return {
      success: true,
      pedidoId,
      itemsCount: items.length,
      message: 'Data insertion test successful'
    }
    
  } catch (error) {
    console.error('❌ Data insertion test failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'Data insertion test failed'
    }
  }
}

// Función para ejecutar ambos tests
export async function runAllTests() {
  console.log('🚀 Running all IndexedDB v6 tests...')
  
  const migrationResult = await testDBMigration()
  const dataResult = await testNewStoresData()
  
  return {
    migration: migrationResult,
    dataInsertion: dataResult,
    overall: migrationResult.success && dataResult.success
  }
} 