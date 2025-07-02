/**
 * MIGRACIÓN - Arreglar pedidos viejos sin customer_id
 * Ejecutar desde DevTools para actualizar pedidos creados antes de implementar customer_id
 */

import { getPendingPedidosDeep, updatePedidoHeader } from './indexedDB'
import { findClientByCode } from './indexedDB'

/**
 * Arregla pedidos que no tienen customer_id
 * Busca el cliente por almcnt+ctecve y asigna el customer_id correcto
 */
export async function fixOldPedidosSinCustomerId() {
  console.log('🔧 INICIANDO REPARACIÓN DE PEDIDOS SIN CUSTOMER_ID...')
  
  try {
    // 1. Obtener todos los pedidos pending
    const pedidos = await getPendingPedidosDeep()
    console.log(`📋 Total pedidos pending: ${pedidos.length}`)
    
    let fixed = 0
    let errors = 0
    
    for (const pedido of pedidos) {
      console.log(`\n🔍 Analizando pedido ${pedido.id}:`)
      console.log(`   customer_id actual: ${pedido.customer_id}`)
      console.log(`   almcnt: ${pedido.almcnt}, ctecve: ${pedido.ctecve}`)
      
      // Si ya tiene customer_id, saltar
      if (pedido.customer_id && typeof pedido.customer_id === 'number') {
        console.log('✅ Ya tiene customer_id válido - saltando')
        continue
      }
      
      // Si no tiene almcnt o ctecve, no se puede arreglar
      if (!pedido.almcnt || !pedido.ctecve) {
        console.log('❌ Faltan almcnt o ctecve - no se puede arreglar')
        errors++
        continue
      }
      
      // Buscar el cliente por almcnt + ctecve
      console.log(`🔍 Buscando cliente: almcnt=${pedido.almcnt}, ctecve=${pedido.ctecve}`)
      const cliente = await findClientByCode(pedido.almcnt, pedido.ctecve)
      
      if (!cliente) {
        console.log('❌ Cliente no encontrado - no se puede arreglar')
        errors++
        continue
      }
      
      if (!cliente.id) {
        console.log('❌ Cliente encontrado pero sin ID de Supabase - no se puede arreglar')
        errors++
        continue
      }
      
      // Actualizar el pedido con el customer_id correcto
      console.log(`🔧 Actualizando pedido ${pedido.id} con customer_id: ${cliente.id}`)
      await updatePedidoHeader(pedido.id, {
        customer_id: cliente.id
      })
      
      console.log('✅ Pedido actualizado exitosamente')
      fixed++
    }
    
    const result = {
      success: true,
      totalPedidos: pedidos.length,
      fixed,
      errors,
      message: `Reparación completada: ${fixed} pedidos arreglados, ${errors} errores`
    }
    
    console.log('\n📊 RESULTADO FINAL:', result)
    return result
    
  } catch (error) {
    console.error('❌ Error en reparación:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Función para eliminar pedidos que no se pueden arreglar
 * ⚠️ CUIDADO: Esto elimina datos permanentemente
 */
export async function deleteUnfixablePedidos() {
  const confirmed = confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR los pedidos que no tienen customer_id? Esta acción no se puede deshacer.')
  
  if (!confirmed) {
    console.log('❌ Operación cancelada por el usuario')
    return { success: false, reason: 'Cancelado por usuario' }
  }
  
  // TODO: Implementar eliminación si es necesario
  console.log('⚠️ Función de eliminación no implementada por seguridad')
  return { success: false, reason: 'No implementado' }
}

/**
 * Diagnóstico detallado de pedidos
 */
export async function diagnosticarPedidos() {
  console.log('🔍 DIAGNÓSTICO DETALLADO DE PEDIDOS:')
  
  try {
    const pedidos = await getPendingPedidosDeep()
    console.log(`📋 Total pedidos: ${pedidos.length}`)
    
    let conCustomerId = 0
    let sinCustomerId = 0
    let problematicos = 0
    
    for (const pedido of pedidos) {
      console.log(`\n📦 Pedido ${pedido.id}:`)
      console.log(`   customer_id: ${pedido.customer_id} (${typeof pedido.customer_id})`)
      console.log(`   almcnt: ${pedido.almcnt}`)
      console.log(`   ctecve: ${pedido.ctecve}`)
      console.log(`   ctename: ${pedido.ctename}`)
      console.log(`   total_amount: ${pedido.total_amount}`)
      
      if (pedido.customer_id && typeof pedido.customer_id === 'number') {
        console.log('   ✅ Estado: LISTO PARA SYNC')
        conCustomerId++
      } else if (pedido.almcnt && pedido.ctecve) {
        console.log('   ⚠️ Estado: NECESITA REPARACIÓN')
        sinCustomerId++
      } else {
        console.log('   ❌ Estado: PROBLEMÁTICO (faltan datos)')
        problematicos++
      }
    }
    
    console.log('\n📊 RESUMEN:')
    console.log(`✅ Con customer_id: ${conCustomerId}`)
    console.log(`⚠️ Sin customer_id (reparables): ${sinCustomerId}`)
    console.log(`❌ Problemáticos: ${problematicos}`)
    
    return {
      total: pedidos.length,
      conCustomerId,
      sinCustomerId,
      problematicos
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    return { error: error.message }
  }
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.fixOldPedidosSinCustomerId = fixOldPedidosSinCustomerId
  window.diagnosticarPedidos = diagnosticarPedidos
  window.deleteUnfixablePedidos = deleteUnfixablePedidos
  
  console.log('🧰 Funciones de reparación disponibles:')
  console.log('  • diagnosticarPedidos() - Analiza estado de pedidos')
  console.log('  • fixOldPedidosSinCustomerId() - Repara pedidos sin customer_id')
  console.log('  • deleteUnfixablePedidos() - Elimina pedidos problemáticos (CUIDADO)')
} 