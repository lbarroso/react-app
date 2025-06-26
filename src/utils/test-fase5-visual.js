/**
 * FASE 5 - Testing Visual Manual
 * Helpers para pruebas visuales y validación manual con indicadores UI
 */

/**
 * Creador de notificaciones para testing
 */
class TestNotification {
  constructor() {
    this.container = null
    this.init()
  }

  init() {
    // Crear contenedor de notificaciones si no existe
    if (!document.getElementById('test-notifications')) {
      this.container = document.createElement('div')
      this.container.id = 'test-notifications'
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      `
      document.body.appendChild(this.container)
    } else {
      this.container = document.getElementById('test-notifications')
    }
  }

  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div')
    notification.style.cssText = `
      margin-bottom: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background-color: ${this.getColor(type)};
    `
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${this.getIcon(type)}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
          opacity: 0.7;
          font-size: 16px;
        ">×</button>
      </div>
    `
    
    this.container.appendChild(notification)
    
    // Auto-remove después del duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, duration)
    }
    
    return notification
  }

  getColor(type) {
    const colors = {
      success: '#059669',
      warning: '#f59e0b',
      error: '#dc2626',
      info: '#3b82f6',
      test: '#8b5cf6'
    }
    return colors[type] || colors.info
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
      test: '🧪'
    }
    return icons[type] || icons.info
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}

/**
 * Dashboard de testing visual
 */
class TestDashboard {
  constructor() {
    this.notification = new TestNotification()
    this.dashboard = null
    this.isVisible = false
  }

  create() {
    if (this.dashboard) {
      this.dashboard.remove()
    }

    this.dashboard = document.createElement('div')
    this.dashboard.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 9999;
      min-width: 320px;
      max-width: 400px;
      border: 1px solid #e5e7eb;
    `

    this.dashboard.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #235b4e; font-size: 16px;">🧪 Test Dashboard</h3>
          <button onclick="window.testDashboard.hide()" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>
      </div>
      
      <div style="padding: 16px;">
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">📱 Network Status</h4>
          <div id="network-status" style="
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
          ">Checking...</div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">🗄️ IndexedDB Status</h4>
          <div id="db-status" style="
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            background: #f3f4f6;
            color: #374151;
          ">Loading...</div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">🚀 Quick Actions</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button onclick="window.simulateOffline()" style="
              padding: 8px;
              border: 1px solid #dc2626;
              background: white;
              color: #dc2626;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
            ">🔴 Go Offline</button>
            
            <button onclick="window.simulateOnline()" style="
              padding: 8px;
              border: 1px solid #059669;
              background: white;
              color: #059669;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
            ">🟢 Go Online</button>
            
            <button onclick="window.createTestOrder('MANUAL')" style="
              padding: 8px;
              border: 1px solid #3b82f6;
              background: white;
              color: #3b82f6;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
            ">📝 Create Order</button>
            
            <button onclick="window.inspectDB()" style="
              padding: 8px;
              border: 1px solid #8b5cf6;
              background: white;
              color: #8b5cf6;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
            ">🔍 Inspect DB</button>
          </div>
        </div>
        
        <div>
          <button onclick="window.testManualSuite.runAllTests()" style="
            width: 100%;
            padding: 12px;
            background: #235b4e;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
          ">🧪 Run All Tests</button>
        </div>
      </div>
    `

    document.body.appendChild(this.dashboard)
    this.updateStatus()
    this.isVisible = true

    // Update status cada 3 segundos
    this.statusInterval = setInterval(() => {
      this.updateStatus()
    }, 3000)
  }

  async updateStatus() {
    if (!this.dashboard) return

    // Network status
    const networkStatus = document.getElementById('network-status')
    if (networkStatus) {
      const isOnline = navigator.onLine
      networkStatus.textContent = isOnline ? '🟢 Online' : '🔴 Offline'
      networkStatus.style.background = isOnline ? '#d1fae5' : '#fee2e2'
      networkStatus.style.color = isOnline ? '#065f46' : '#991b1b'
    }

    // DB status
    const dbStatus = document.getElementById('db-status')
    if (dbStatus) {
      try {
        const { pending, processed } = await window.inspectDB()
        dbStatus.innerHTML = `
          📋 Pending: ${pending.length}<br>
          ✅ Processed: ${processed.length}
        `
      } catch (error) {
        dbStatus.textContent = '❌ Error loading DB'
        dbStatus.style.background = '#fee2e2'
        dbStatus.style.color = '#991b1b'
      }
    }
  }

  show() {
    if (!this.isVisible) {
      this.create()
    }
  }

  hide() {
    if (this.dashboard) {
      this.dashboard.remove()
      this.dashboard = null
      this.isVisible = false
      
      if (this.statusInterval) {
        clearInterval(this.statusInterval)
      }
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
}

/**
 * Validador de flujo manual con UI
 */
class ManualFlowValidator {
  constructor() {
    this.notification = new TestNotification()
    this.currentStep = 0
    this.steps = []
  }

  /**
   * Iniciar validación de flujo offline
   */
  startOfflineFlow() {
    this.notification.clear()
    this.currentStep = 0
    this.steps = [
      {
        title: '1. Ir Offline',
        instruction: 'DevTools → Network → Check "Offline"',
        validation: () => !navigator.onLine,
        successMsg: 'Modo offline activado ✅'
      },
      {
        title: '2. Crear Pedido',
        instruction: 'Ir a productos → Agregar al carrito → Checkout',
        validation: 'manual',
        successMsg: 'Pedido creado en modo offline ✅'
      },
      {
        title: '3. Verificar IndexedDB',
        instruction: 'DevTools → Application → IndexedDB → PedidosDB',
        validation: 'manual',
        successMsg: 'Pedido guardado en IndexedDB ✅'
      },
      {
        title: '4. Recargar Página',
        instruction: 'F5 o Ctrl+R para recargar',
        validation: 'manual',
        successMsg: 'Página recargada ✅'
      },
      {
        title: '5. Verificar Persistencia',
        instruction: 'Ir a Pedidos → Verificar que aparece el pedido',
        validation: 'manual',
        successMsg: 'Pedido persiste después de recarga ✅'
      }
    ]

    this.showCurrentStep()
  }

  /**
   * Iniciar validación de flujo online
   */
  startOnlineFlow() {
    this.notification.clear()
    this.currentStep = 0
    this.steps = [
      {
        title: '1. Volver Online',
        instruction: 'DevTools → Network → Uncheck "Offline"',
        validation: () => navigator.onLine,
        successMsg: 'Modo online activado ✅'
      },
      {
        title: '2. Esperar Sync',
        instruction: 'Esperar 5-10 segundos para sync automático',
        validation: 'manual',
        successMsg: 'Sync automático detectado ✅'
      },
      {
        title: '3. Verificar Status',
        instruction: 'Ir a Pedidos → Verificar status "Processed"',
        validation: 'manual',
        successMsg: 'Pedido sincronizado correctamente ✅'
      },
      {
        title: '4. Intentar Editar',
        instruction: 'Click en pedido processed → Verificar que no se puede editar',
        validation: 'manual',
        successMsg: 'Edición bloqueada correctamente ✅'
      }
    ]

    this.showCurrentStep()
  }

  showCurrentStep() {
    if (this.currentStep >= this.steps.length) {
      this.notification.show('🎉 Flujo de validación completado!', 'success', 0)
      return
    }

    const step = this.steps[this.currentStep]
    const notification = this.notification.show(
      `<strong>${step.title}</strong><br>${step.instruction}`,
      'test',
      0
    )

    // Agregar botones de control
    const controls = document.createElement('div')
    controls.style.cssText = 'margin-top: 8px; display: flex; gap: 8px;'
    
    if (step.validation === 'manual') {
      controls.innerHTML = `
        <button onclick="window.manualValidator.nextStep()" style="
          padding: 4px 8px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">✅ Done</button>
        <button onclick="window.manualValidator.skipStep()" style="
          padding: 4px 8px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">⏭️ Skip</button>
      `
    } else {
      controls.innerHTML = `
        <button onclick="window.manualValidator.checkValidation()" style="
          padding: 4px 8px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">🔍 Check</button>
      `
    }

    notification.appendChild(controls)
  }

  checkValidation() {
    const step = this.steps[this.currentStep]
    if (typeof step.validation === 'function') {
      if (step.validation()) {
        this.notification.show(step.successMsg, 'success')
        this.nextStep()
      } else {
        this.notification.show('❌ Validación falló. Inténtalo de nuevo.', 'error')
      }
    }
  }

  nextStep() {
    this.currentStep++
    setTimeout(() => this.showCurrentStep(), 500)
  }

  skipStep() {
    this.notification.show('⏭️ Paso omitido', 'warning')
    this.nextStep()
  }
}

/**
 * Monitor de sync en tiempo real
 */
class SyncMonitor {
  constructor() {
    this.notification = new TestNotification()
    this.isMonitoring = false
    this.lastSyncState = null
  }

  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.notification.show('🔄 Monitor de sync iniciado', 'info')

    this.monitorInterval = setInterval(() => {
      this.checkSyncState()
    }, 2000)
  }

  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
    }
    this.notification.show('⏹️ Monitor de sync detenido', 'info')
  }

  async checkSyncState() {
    try {
      // Obtener estado actual de sync
      const syncState = window.syncState?.syncStats || {}
      const currentStats = {
        pending: syncState.pendingCount || 0,
        syncing: syncState.isSyncing || false,
        lastSync: syncState.lastSync
      }

      // Comparar con estado anterior
      if (this.lastSyncState) {
        if (currentStats.pending < this.lastSyncState.pending) {
          const synced = this.lastSyncState.pending - currentStats.pending
          this.notification.show(`📤 ${synced} pedido(s) sincronizado(s)`, 'success')
        }

        if (currentStats.syncing && !this.lastSyncState.syncing) {
          this.notification.show('🔄 Sincronización iniciada...', 'info')
        }

        if (!currentStats.syncing && this.lastSyncState.syncing) {
          this.notification.show('✅ Sincronización completada', 'success')
        }
      }

      this.lastSyncState = currentStats
    } catch (error) {
      console.error('Error monitoring sync:', error)
    }
  }

  toggle() {
    if (this.isMonitoring) {
      this.stop()
    } else {
      this.start()
    }
  }
}

// Crear instancias globales
const testDashboard = new TestDashboard()
const manualValidator = new ManualFlowValidator()
const syncMonitor = new SyncMonitor()

// Agregar CSS para animaciones
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`
document.head.appendChild(style)

// Exponer funciones globalmente
window.testDashboard = testDashboard
window.manualValidator = manualValidator
window.syncMonitor = syncMonitor

// Funciones de conveniencia
window.showTestDashboard = () => testDashboard.show()
window.hideTestDashboard = () => testDashboard.hide()
window.startOfflineTest = () => manualValidator.startOfflineFlow()
window.startOnlineTest = () => manualValidator.startOnlineFlow()
window.startSyncMonitor = () => syncMonitor.start()
window.stopSyncMonitor = () => syncMonitor.stop()

// Auto-ejecutar al cargar
if (typeof window !== 'undefined') {
  console.log('🎨 FASE 5 Visual Testing Loaded')
  console.log('📱 Ejecuta: showTestDashboard()')
  console.log('🧪 Ejecuta: startOfflineTest()')
  console.log('📤 Ejecuta: startSyncMonitor()')
}

export {
  TestDashboard,
  ManualFlowValidator,
  SyncMonitor,
  TestNotification
} 