/**
 * FASE 5 - Verificación de Integridad
 * Scripts para validar integridad de datos en IndexedDB y Supabase
 */

import { 
  getPedidosByStatus, 
  getPendingPedidosDeep,
  obtenerAlmcnt 
} from './indexedDB'
import { supabase } from '../supabaseClient'

/**
 * Verificador de integridad de datos
 */
class DataIntegrityChecker {
  constructor() {
    this.results = []
    this.errors = []
    this.warnings = []
  }

  /**
   * Ejecutar verificación completa
   */
  async runFullCheck() {
    console.log('🔍 === INICIANDO VERIFICACIÓN DE INTEGRIDAD ===')
    
    this.results = []
    this.errors = []
    this.warnings = []

    try {
      await this.checkIndexedDBStructure()
      await this.checkDataConsistency()
      await this.checkSupabaseSync()
      await this.checkBusinessRules()
      await this.checkPerformanceMetrics()
      
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Error en verificación de integridad:', error)
      this.errors.push(`Sistema: ${error.message}`)
      this.generateReport()
    }
  }

  /**
   * Verificar estructura de IndexedDB
   */
  async checkIndexedDBStructure() {
    console.log('🗄️ Verificando estructura IndexedDB...')
    
    try {
      // Verificar que las stores existen
      const dbRequest = indexedDB.open('PedidosDB')
      
      return new Promise((resolve, reject) => {
        dbRequest.onsuccess = (event) => {
          const db = event.target.result
          const expectedStores = [
            'productos', 'carrito_items', 'session_store', 
            'pedidos', 'pedidos_items', 'clientes'
          ]
          
          const actualStores = Array.from(db.objectStoreNames)
          const missingStores = expectedStores.filter(store => !actualStores.includes(store))
          
          if (missingStores.length > 0) {
            this.errors.push(`IndexedDB: Stores faltantes: ${missingStores.join(', ')}`)
          } else {
            this.results.push('✅ IndexedDB: Todas las stores están presentes')
          }
          
          db.close()
          resolve()
        }
        
        dbRequest.onerror = () => {
          this.errors.push('IndexedDB: No se pudo abrir la base de datos')
          reject(new Error('No se pudo abrir IndexedDB'))
        }
      })
      
    } catch (error) {
      this.errors.push(`IndexedDB estructura: ${error.message}`)
    }
  }

  /**
   * Verificar consistencia de datos
   */
  async checkDataConsistency() {
    console.log('📊 Verificando consistencia de datos...')
    
    try {
      const pending = await getPedidosByStatus('pending')
      const processed = await getPedidosByStatus('processed')
      const allOrders = [...pending, ...processed]
      
      // Verificar que pending no tengan remote_id
      const pendingWithRemoteId = pending.filter(p => p.remote_id)
      if (pendingWithRemoteId.length > 0) {
        this.errors.push(
          `Consistencia: ${pendingWithRemoteId.length} pedidos pending tienen remote_id`
        )
      } else {
        this.results.push('✅ Consistencia: Pedidos pending sin remote_id')
      }
      
      // Verificar que processed tengan remote_id
      const processedWithoutRemoteId = processed.filter(p => !p.remote_id)
      if (processedWithoutRemoteId.length > 0) {
        this.errors.push(
          `Consistencia: ${processedWithoutRemoteId.length} pedidos processed sin remote_id`
        )
      } else {
        this.results.push('✅ Consistencia: Pedidos processed con remote_id')
      }
      
      // Verificar totales
      for (const order of allOrders) {
        if (!order.total_amount || order.total_amount <= 0) {
          this.warnings.push(`Pedido ${order.id}: total_amount inválido (${order.total_amount})`)
        }
      }
      
      // Verificar timestamps
      const now = Date.now()
      const oldOrders = allOrders.filter(o => {
        const age = now - o.created_at
        return age > (7 * 24 * 60 * 60 * 1000) // 7 días
      })
      
      if (oldOrders.length > 0) {
        this.warnings.push(`${oldOrders.length} pedidos tienen más de 7 días`)
      }
      
      this.results.push(`📊 Total pedidos: ${allOrders.length} (${pending.length} pending, ${processed.length} processed)`)
      
    } catch (error) {
      this.errors.push(`Consistencia datos: ${error.message}`)
    }
  }

  /**
   * Verificar sincronización con Supabase
   */
  async checkSupabaseSync() {
    console.log('☁️ Verificando sincronización Supabase...')
    
    try {
      if (!navigator.onLine) {
        this.warnings.push('Supabase: Modo offline, no se puede verificar sync')
        return
      }
      
      const almcnt = await obtenerAlmcnt()
      if (!almcnt) {
        this.warnings.push('Supabase: No se pudo obtener almcnt')
        return
      }
      
      // Obtener pedidos processed locales
      const processed = await getPedidosByStatus('processed')
      const processedWithRemoteId = processed.filter(p => p.remote_id)
      
      if (processedWithRemoteId.length === 0) {
        this.results.push('✅ Supabase: No hay pedidos para verificar sync')
        return
      }
      
      // Verificar algunos pedidos en Supabase
      const sampleIds = processedWithRemoteId
        .slice(0, 5) // Solo verificar los primeros 5
        .map(p => p.remote_id)
      
      const { data: remoteOrders, error } = await supabase
        .from('orders')
        .select('id, local_id, almcnt')
        .in('id', sampleIds)
      
      if (error) {
        this.errors.push(`Supabase: Error consultando: ${error.message}`)
        return
      }
      
      // Verificar que existen en remoto
      const foundIds = remoteOrders.map(o => o.id)
      const missingIds = sampleIds.filter(id => !foundIds.includes(id))
      
      if (missingIds.length > 0) {
        this.errors.push(`Supabase: Pedidos no encontrados remotamente: ${missingIds.join(', ')}`)
      } else {
        this.results.push(`✅ Supabase: ${foundIds.length} pedidos verificados correctamente`)
      }
      
      // Verificar almcnt consistency
      const wrongAlmcnt = remoteOrders.filter(o => o.almcnt !== almcnt)
      if (wrongAlmcnt.length > 0) {
        this.warnings.push(`Supabase: ${wrongAlmcnt.length} pedidos con almcnt incorrecto`)
      }
      
    } catch (error) {
      this.errors.push(`Supabase sync: ${error.message}`)
    }
  }

  /**
   * Verificar reglas de negocio
   */
  async checkBusinessRules() {
    console.log('📋 Verificando reglas de negocio...')
    
    try {
      const allOrdersDeep = await getPendingPedidosDeep()
      
      for (const order of allOrdersDeep) {
        // Verificar que tiene items
        if (!order.items || order.items.length === 0) {
          this.errors.push(`Pedido ${order.id}: No tiene items`)
          continue
        }
        
        // Verificar cálculo de total
        const calculatedTotal = order.items.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price)
        }, 0)
        
        const storedTotal = parseFloat(order.total_amount)
        const diff = Math.abs(calculatedTotal - storedTotal)
        
        if (diff > 0.01) { // Tolerancia de 1 centavo
          this.errors.push(
            `Pedido ${order.id}: Total incorrecto. Calculado: ${calculatedTotal}, Almacenado: ${storedTotal}`
          )
        }
        
        // Verificar cantidades positivas
        const invalidItems = order.items.filter(item => 
          item.quantity <= 0 || item.unit_price < 0
        )
        
        if (invalidItems.length > 0) {
          this.errors.push(
            `Pedido ${order.id}: ${invalidItems.length} items con cantidad/precio inválido`
          )
        }
        
        // Verificar cliente
        if (!order.ctename || order.ctename.trim() === '') {
          this.warnings.push(`Pedido ${order.id}: Sin nombre de cliente`)
        }
      }
      
      this.results.push(`✅ Reglas de negocio: ${allOrdersDeep.length} pedidos verificados`)
      
    } catch (error) {
      this.errors.push(`Reglas de negocio: ${error.message}`)
    }
  }

  /**
   * Verificar métricas de performance
   */
  async checkPerformanceMetrics() {
    console.log('⚡ Verificando métricas de performance...')
    
    try {
      // Medir tiempo de carga de pedidos
      const startTime = performance.now()
      await getPedidosByStatus('pending')
      const loadTime = performance.now() - startTime
      
      if (loadTime > 1000) {
        this.warnings.push(`Performance: Carga de pedidos lenta (${loadTime.toFixed(2)}ms)`)
      } else {
        this.results.push(`✅ Performance: Carga rápida (${loadTime.toFixed(2)}ms)`)
      }
      
      // Verificar tamaño de IndexedDB
      if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usedMB = (estimate.usage / 1024 / 1024).toFixed(2)
        const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2)
        
        this.results.push(`📊 Storage: ${usedMB}MB usados de ${quotaMB}MB disponibles`)
        
        if (estimate.usage > estimate.quota * 0.8) {
          this.warnings.push('Storage: Cerca del límite de quota')
        }
      }
      
    } catch (error) {
      this.warnings.push(`Performance: No se pudieron obtener métricas - ${error.message}`)
    }
  }

  /**
   * Generar reporte final
   */
  generateReport() {
    console.log('\n📊 === REPORTE DE INTEGRIDAD ===')
    
    // Estadísticas
    const totalChecks = this.results.length + this.errors.length + this.warnings.length
    const successRate = ((this.results.length / totalChecks) * 100).toFixed(1)
    
    console.log(`📈 Estadísticas:`)
    console.log(`   ✅ Éxitos: ${this.results.length}`)
    console.log(`   ❌ Errores: ${this.errors.length}`)
    console.log(`   ⚠️  Advertencias: ${this.warnings.length}`)
    console.log(`   📊 Tasa de éxito: ${successRate}%`)
    
    // Resultados exitosos
    if (this.results.length > 0) {
      console.log('\n✅ VERIFICACIONES EXITOSAS:')
      this.results.forEach(result => console.log(`   ${result}`))
    }
    
    // Errores críticos
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORES CRÍTICOS:')
      this.errors.forEach(error => console.log(`   ${error}`))
    }
    
    // Advertencias
    if (this.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:')
      this.warnings.forEach(warning => console.log(`   ${warning}`))
    }
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:')
    if (this.errors.length > 0) {
      console.log('   - Resolver errores críticos antes de continuar')
      console.log('   - Verificar integridad de datos manualmente')
    }
    if (this.warnings.length > 0) {
      console.log('   - Revisar advertencias para optimizar sistema')
    }
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('   - Sistema funcionando correctamente ✅')
      console.log('   - Continuar con testing manual')
    }
    
    // Estado final
    const status = this.errors.length === 0 ? 'PASÓ' : 'FALLÓ'
    const emoji = this.errors.length === 0 ? '✅' : '❌'
    console.log(`\n${emoji} ESTADO FINAL: ${status}`)
    
    return {
      status,
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      successRate
    }
  }
}

/**
 * Comparador de datos local vs remoto
 */
class LocalRemoteComparator {
  /**
   * Comparar pedido específico entre local y remoto
   */
  static async compareOrder(orderId) {
    console.log(`🔍 Comparando pedido ${orderId} - Local vs Remoto`)
    
    try {
      // Obtener local
      const localOrders = await getPedidosByStatus('processed')
      const localOrder = localOrders.find(o => o.id === orderId)
      
      if (!localOrder) {
        console.log('❌ Pedido no encontrado localmente')
        return null
      }
      
      if (!localOrder.remote_id) {
        console.log('⚠️ Pedido no tiene remote_id, no sincronizado')
        return null
      }
      
      // Obtener remoto
      const { data: remoteOrder, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', localOrder.remote_id)
        .single()
      
      if (error) {
        console.log(`❌ Error obteniendo orden remota: ${error.message}`)
        return null
      }
      
      // Comparar campos
      const comparison = {
        local: localOrder,
        remote: remoteOrder,
        differences: []
      }
      
      // Comparar campos críticos
      const fieldsToCompare = ['total_amount', 'ctename', 'almcnt', 'notes']
      
      fieldsToCompare.forEach(field => {
        const localValue = localOrder[field]
        const remoteValue = remoteOrder[field]
        
        if (localValue !== remoteValue) {
          comparison.differences.push({
            field,
            local: localValue,
            remote: remoteValue
          })
        }
      })
      
      // Mostrar resultados
      if (comparison.differences.length === 0) {
        console.log('✅ Pedido sincronizado correctamente - Sin diferencias')
      } else {
        console.log(`⚠️ ${comparison.differences.length} diferencias encontradas:`)
        comparison.differences.forEach(diff => {
          console.log(`   ${diff.field}: Local="${diff.local}" vs Remoto="${diff.remote}"`)
        })
      }
      
      return comparison
      
    } catch (error) {
      console.error('❌ Error comparando pedido:', error)
      return null
    }
  }

  /**
   * Comparar todos los pedidos procesados
   */
  static async compareAllProcessed() {
    console.log('🔍 Comparando todos los pedidos procesados...')
    
    try {
      const processed = await getPedidosByStatus('processed')
      const withRemoteId = processed.filter(p => p.remote_id)
      
      console.log(`📊 Pedidos a verificar: ${withRemoteId.length}`)
      
      const results = []
      for (const order of withRemoteId) {
        const comparison = await this.compareOrder(order.id)
        if (comparison) {
          results.push(comparison)
        }
      }
      
      const withDifferences = results.filter(r => r.differences.length > 0)
      
      console.log(`\n📊 Resumen comparación:`)
      console.log(`   ✅ Sin diferencias: ${results.length - withDifferences.length}`)
      console.log(`   ⚠️  Con diferencias: ${withDifferences.length}`)
      
      return results
      
    } catch (error) {
      console.error('❌ Error comparando pedidos:', error)
      return []
    }
  }
}

// Crear instancia global
const integrityChecker = new DataIntegrityChecker()

// Exponer funciones globalmente
window.checkDataIntegrity = () => integrityChecker.runFullCheck()
window.compareOrder = (id) => LocalRemoteComparator.compareOrder(id)
window.compareAllOrders = () => LocalRemoteComparator.compareAllProcessed()
window.DataIntegrityChecker = DataIntegrityChecker
window.LocalRemoteComparator = LocalRemoteComparator

// Auto-ejecutar al cargar
if (typeof window !== 'undefined') {
  console.log('🔍 FASE 5 Integrity Checker Loaded')
  console.log('📊 Ejecuta: checkDataIntegrity()')
  console.log('🔍 Ejecuta: compareAllOrders()')
}

export {
  DataIntegrityChecker,
  LocalRemoteComparator
} 