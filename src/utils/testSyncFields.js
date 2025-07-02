/**
 * PRUEBA DE SINCRONIZACIÓN - Validación de campos
 * Ejecutar desde DevTools para probar la sincronización antes de habilitar
 */

import { supabase } from '../supabaseClient'
import { getPendingPedidosDeep } from './indexedDB'
import { 
  mapPedidoToSupabase, 
  mapItemsToSupabase, 
  validatePedidoForSync,
  debugFieldMapping 
} from './supabaseFieldMapping'

/**
 * Prueba la conexión y validación de campos sin insertar datos reales
 */
export async function testSyncFields() {
  console.log('🧪 INICIANDO PRUEBA DE SINCRONIZACIÓN...')
  
  try {
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return false
    }
    console.log('✅ Usuario autenticado:', user.id)

    // 2. Verificar conectividad con Supabase
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count(*)')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error conectando con Supabase:', testError)
      return false
    }
    console.log('✅ Conexión con Supabase OK')

    // 3. Obtener pedidos locales pending
    const pendingPedidos = await getPendingPedidosDeep()
    console.log(`📋 Pedidos locales pending: ${pendingPedidos.length}`)

    if (pendingPedidos.length === 0) {
      console.log('⚠️ No hay pedidos para probar. Crea un pedido primero.')
      return true
    }

    // 4. Probar validación y mapeo con el primer pedido
    const pedidoPrueba = pendingPedidos[0]
    console.log('🔍 Probando con pedido:', pedidoPrueba.id)

    // Validar
    const validation = validatePedidoForSync(pedidoPrueba)
    console.log('📝 Validación:', validation)

    if (!validation.isValid) {
      console.error('❌ Pedido inválido:', validation.errors)
      return false
    }

    // Mapear campos
    const supabaseOrder = mapPedidoToSupabase(pedidoPrueba, user.id)
    const supabaseItems = mapItemsToSupabase(pedidoPrueba.items, 999) // ID temporal

    console.log('📤 Datos mapeados para orders:', supabaseOrder)
    console.log('📤 Datos mapeados para order_items:', supabaseItems)

    // ⭐ VERIFICACIÓN ESPECÍFICA DEL CUSTOMER_ID
    console.log('\n🆔 VERIFICACIÓN CUSTOMER_ID:')
    console.log(`   📥 IndexedDB: pedido.customer_id = ${pedidoPrueba.customer_id}`)
    console.log(`   📤 Supabase: orders.customer_id = ${supabaseOrder.customer_id}`)
    console.log(`   ✅ Coinciden: ${pedidoPrueba.customer_id === supabaseOrder.customer_id}`)

    // Mostrar comparación completa
    debugFieldMapping(pedidoPrueba, user.id)

    console.log('✅ PRUEBA EXITOSA - Los campos están correctamente mapeados')
    console.log('💡 Para habilitar sync real, cambia DISABLE_SYNC_FOR_TESTING a false en useSyncPedidos.js')
    
    return true

  } catch (error) {
    console.error('❌ Error en prueba:', error)
    return false
  }
}

/**
 * Prueba de inserción real (SOLO para testing)
 * ⚠️ CUIDADO: Esto inserta datos reales en Supabase
 */
export async function testRealInsert() {
  console.log('⚠️ PRUEBA REAL - Esto insertará datos en Supabase')
  
  const confirmed = confirm('¿Estás seguro de que quieres insertar un pedido real en Supabase?')
  if (!confirmed) {
    console.log('❌ Prueba cancelada por el usuario')
    return false
  }

  try {
    // Obtener primer pedido pending
    const pendingPedidos = await getPendingPedidosDeep()
    if (pendingPedidos.length === 0) {
      console.log('❌ No hay pedidos para probar')
      return false
    }

    const pedido = pendingPedidos[0]
    const { data: { user } } = await supabase.auth.getUser()
    
    // Mapear datos
    const supabaseOrder = mapPedidoToSupabase(pedido, user.id)
    
    console.log('📤 Insertando order:', supabaseOrder)
    
    // Insertar order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([supabaseOrder])
      .select('id')
      .single()

    if (orderError) {
      console.error('❌ Error insertando order:', orderError)
      return false
    }

    console.log('✅ Order insertado con ID:', orderData.id)

    // Insertar items
    const supabaseItems = mapItemsToSupabase(pedido.items, orderData.id)
    console.log('📤 Insertando items:', supabaseItems)

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(supabaseItems)
      .select('id')

    if (itemsError) {
      console.error('❌ Error insertando items:', itemsError)
      return false
    }

    console.log('✅ Items insertados:', itemsData)
    console.log('🎉 PRUEBA REAL EXITOSA - Pedido sincronizado correctamente')
    
    return true

  } catch (error) {
    console.error('❌ Error en prueba real:', error)
    return false
  }
}

// Exportar funciones para usar desde DevTools
window.testSyncFields = testSyncFields
window.testRealInsert = testRealInsert

console.log('🧪 Funciones de prueba disponibles:')
console.log('  • testSyncFields() - Valida campos sin insertar')
console.log('  • testRealInsert() - Inserta datos reales (CUIDADO)') 