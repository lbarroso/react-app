/**
 * TESTING - Verificar que el marcado como procesado funcione en IndexedDB y Supabase
 */

import { markPedidoProcessed, getPendingPedidosDeep } from './indexedDB'
import { supabase } from '../supabaseClient'

/**
 * Test completo del marcado como procesado
 * @param {number} localPedidoId - ID del pedido local a marcar como procesado
 * @param {number} remoteOrderId - ID del pedido en Supabase (orders.id)
 */
export async function testMarkProcessed(localPedidoId, remoteOrderId) {
  console.log('🧪 TESTING: Marcado como procesado')
  console.log(`   Pedido local: ${localPedidoId}`)
  console.log(`   Order remota: ${remoteOrderId}`)
  
  try {
    // 1. Verificar estado ANTES del marcado
    console.log('\n🔍 ESTADO ANTES:')
    
    // IndexedDB antes
    const pedidos = await getPendingPedidosDeep()
    const pedidoLocal = pedidos.find(p => p.id === localPedidoId)
    if (!pedidoLocal) {
      throw new Error(`Pedido local ${localPedidoId} no encontrado`)
    }
    console.log(`   IndexedDB: status="${pedidoLocal.status}", sync_status="${pedidoLocal.sync_status}"`)
    
    // Supabase antes
    const { data: orderAntes, error: errorAntes } = await supabase
      .from('orders')
      .select('id, status, processed_at')
      .eq('id', remoteOrderId)
      .single()
    
    if (errorAntes) {
      throw new Error(`Error obteniendo order de Supabase: ${errorAntes.message}`)
    }
    console.log(`   Supabase: status="${orderAntes.status}", processed_at="${orderAntes.processed_at}"`)
    
    // 2. Ejecutar marcado como procesado
    console.log('\n🔄 EJECUTANDO markPedidoProcessed...')
    await markPedidoProcessed(localPedidoId, remoteOrderId)
    
    // 3. Verificar estado DESPUÉS del marcado
    console.log('\n✅ ESTADO DESPUÉS:')
    
    // IndexedDB después
    const pedidosDespues = await getPendingPedidosDeep()
    const pedidoLocalDespues = pedidosDespues.find(p => p.id === localPedidoId)
    console.log(`   IndexedDB: status="${pedidoLocalDespues?.status}", sync_status="${pedidoLocalDespues?.sync_status}"`)
    console.log(`   IndexedDB: remote_id="${pedidoLocalDespues?.remote_id}", synced_at="${pedidoLocalDespues?.synced_at}"`)
    
    // Supabase después
    const { data: orderDespues, error: errorDespues } = await supabase
      .from('orders')
      .select('id, status, processed_at')
      .eq('id', remoteOrderId)
      .single()
    
    if (errorDespues) {
      throw new Error(`Error obteniendo order después: ${errorDespues.message}`)
    }
    console.log(`   Supabase: status="${orderDespues.status}", processed_at="${orderDespues.processed_at}"`)
    
    // 4. Validar resultados
    console.log('\n📊 VALIDACIÓN:')
    const validacion = {
      indexedDB_status_correcto: pedidoLocalDespues?.status === 'processed',
      indexedDB_sync_correcto: pedidoLocalDespues?.sync_status === 'synced',
      indexedDB_remote_id_correcto: pedidoLocalDespues?.remote_id === remoteOrderId,
      supabase_status_correcto: orderDespues.status === 'processed',
      supabase_processed_at_existe: !!orderDespues.processed_at
    }
    
    console.log('   Validaciones:', validacion)
    
    const todoOK = Object.values(validacion).every(v => v === true)
    
    if (todoOK) {
      console.log('🎉 ¡TEST EXITOSO! El marcado como procesado funciona correctamente en ambas bases de datos')
      return { success: true, validacion }
    } else {
      console.warn('⚠️ Algunas validaciones fallaron')
      return { success: false, validacion, message: 'Validaciones fallidas' }
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Lista pedidos que pueden ser marcados como procesados
 * (que ya tienen remote_id pero status != 'processed')
 */
export async function listPedidosParaMarcarProcesados() {
  console.log('📋 PEDIDOS QUE PUEDEN SER MARCADOS COMO PROCESADOS:')
  
  try {
    const pedidos = await getPendingPedidosDeep()
    
    const candidatos = pedidos.filter(p => 
      p.remote_id && 
      p.status !== 'processed' && 
      p.sync_status === 'synced'
    )
    
    if (candidatos.length === 0) {
      console.log('   🚫 No hay pedidos candidatos')
      console.log('   💡 Los pedidos deben tener remote_id y no estar marcados como procesados')
      return []
    }
    
    candidatos.forEach(pedido => {
      console.log(`   📦 Pedido ${pedido.id}:`)
      console.log(`      - Remote ID: ${pedido.remote_id}`)
      console.log(`      - Status: ${pedido.status}`)
      console.log(`      - Sync Status: ${pedido.sync_status}`)
      console.log(`      - Cliente: ${pedido.ctename}`)
      console.log(`      - Total: $${pedido.total_amount}`)
      console.log()
    })
    
    console.log(`💡 Para testear, usa: testMarkProcessed(${candidatos[0]?.id}, ${candidatos[0]?.remote_id})`)
    
    return candidatos
    
  } catch (error) {
    console.error('❌ Error listando candidatos:', error)
    return []
  }
}

/**
 * Fuerza el marcado como procesado de todos los pedidos sincronizados
 * ⚠️ Solo usar en testing/development
 */
export async function forceMarkAllSyncedAsProcessed() {
  const confirmed = confirm('⚠️ ¿Marcar TODOS los pedidos sincronizados como procesados? Esto es solo para testing.')
  
  if (!confirmed) {
    console.log('❌ Operación cancelada')
    return { success: false, reason: 'Cancelado por usuario' }
  }
  
  try {
    const candidatos = await listPedidosParaMarcarProcesados()
    
    if (candidatos.length === 0) {
      console.log('✅ No hay pedidos para marcar')
      return { success: true, processed: 0 }
    }
    
    let processed = 0
    let errors = 0
    
    for (const pedido of candidatos) {
      try {
        console.log(`🔄 Marcando pedido ${pedido.id} como procesado...`)
        await markPedidoProcessed(pedido.id, pedido.remote_id)
        processed++
        console.log(`✅ Pedido ${pedido.id} marcado exitosamente`)
      } catch (error) {
        console.error(`❌ Error marcando pedido ${pedido.id}:`, error)
        errors++
      }
    }
    
    console.log(`\n📊 RESULTADO: ${processed} procesados, ${errors} errores`)
    return { success: true, processed, errors }
    
  } catch (error) {
    console.error('❌ Error en operación masiva:', error)
    return { success: false, error: error.message }
  }
}

// Hacer funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  window.testMarkProcessed = testMarkProcessed
  window.listPedidosParaMarcarProcesados = listPedidosParaMarcarProcesados
  window.forceMarkAllSyncedAsProcessed = forceMarkAllSyncedAsProcessed
  
  console.log('🧪 Funciones de testing marcado como procesado disponibles:')
  console.log('  • listPedidosParaMarcarProcesados() - Lista candidatos')
  console.log('  • testMarkProcessed(localId, remoteId) - Testa el marcado')
  console.log('  • forceMarkAllSyncedAsProcessed() - Marca todos como procesados')
} 