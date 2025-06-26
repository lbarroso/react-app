/**
 * FASE 5 - Guía Completa DevTools
 * Instrucciones paso a paso para testing manual con DevTools
 */

/**
 * Guía interactiva para DevTools
 */
class DevToolsGuide {
  constructor() {
    this.currentGuide = null
  }

  /**
   * Mostrar guía de testing offline
   */
  showOfflineGuide() {
    this.currentGuide = 'offline'
    
    const guide = `
🔴 === GUÍA: TESTING MODO OFFLINE ===

📋 PREPARACIÓN:
1. Abrir DevTools (F12)
2. Ir a la pestaña "Network"
3. Localizar checkbox "Offline" (parte superior)

⚠️ IMPORTANTE: 
- NO usar "Disable cache" durante estas pruebas
- Asegúrate de tener productos cargados previamente

🔴 PASO 1: ACTIVAR MODO OFFLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Marcar checkbox "Offline" en Network tab
✅ Verificar que aparece "🔴 Offline" en la navbar
✅ Opcional: También puedes usar "Throttling" → "Offline"

🛒 PASO 2: CREAR PEDIDO OFFLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ir a la página principal (Dashboard)
✅ Buscar productos y agregar al carrito
✅ Click en "🛒 Carrito" 
✅ Click en "Proceder a checkout"
✅ Seleccionar cliente o usar "Cliente genérico"
✅ Click en "Crear Pedido"
✅ Verificar mensaje de confirmación

🗄️ PASO 3: VERIFICAR INDEXEDDB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ En DevTools → "Application" tab
✅ Sidebar izquierdo → "Storage" → "IndexedDB"
✅ Expandir "PedidosDB"
✅ Click en "pedidos" store
✅ Verificar que aparece el nuevo pedido
✅ Verificar campos: status='pending', remote_id=null

📋 VALORES A VERIFICAR EN INDEXEDDB:
- id: Número entero (ej: 1, 2, 3...)
- status: 'pending'
- sync_status: 'local'
- remote_id: null
- created_at: timestamp actual
- total_amount: suma correcta de items

🔄 PASO 4: TEST DE PERSISTENCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Recargar la página (F5 o Ctrl+R)
✅ Ir a "📋 Pedidos"
✅ Verificar que el pedido aparece en la lista
✅ Verificar status "🕓 Pendiente"
✅ Click en el pedido para ver detalles
✅ Verificar que se puede editar (status pending)

💡 SI ALGO FALLA:
- Revisar consola por errores JavaScript
- Verificar que IndexedDB no esté bloqueado
- Intentar en modo incógnito si hay problemas de cache
    `
    
    this.displayGuide(guide)
  }

  /**
   * Mostrar guía de testing online
   */
  showOnlineGuide() {
    this.currentGuide = 'online'
    
    const guide = `
🟢 === GUÍA: TESTING MODO ONLINE ===

⚠️ PRERREQUISITOS:
- Tener al menos 1 pedido en status 'pending'
- Conexión a Supabase funcionando
- Hook useSyncPedidos activo

🟢 PASO 1: ACTIVAR MODO ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ En DevTools → Network tab
✅ Desmarcar checkbox "Offline" 
✅ O cambiar Throttling de "Offline" a "Online"
✅ Verificar que aparece "🟢 Online" en la navbar
✅ Verificar conexión: abrir una nueva pestaña y navegar

📤 PASO 2: OBSERVAR SYNC AUTOMÁTICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Esperar 5-10 segundos (hook se ejecuta automáticamente)
✅ Observar la consola del navegador
✅ Buscar mensajes de sync: "📤 Syncing orders..."
✅ Verificar requests en Network tab (filtrar por 'supabase')

🔍 PASO 3: VERIFICAR CAMBIO DE STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ir a "📋 Pedidos"
✅ Verificar que pedidos antes 'pending' ahora son 'processed'
✅ Badge debe cambiar de "🕓 Pendiente" a "✅ Sincronizado"
✅ Contador de pending en navbar debe disminuir

🗄️ PASO 4: VERIFICAR INDEXEDDB ACTUALIZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DevTools → Application → IndexedDB → PedidosDB → pedidos
✅ Verificar campos actualizados:
   - status: 'processed'
   - sync_status: 'synced'
   - remote_id: valor numérico (ej: 123)
   - updated_at: timestamp actual

🔒 PASO 5: VERIFICAR BLOQUEO DE EDICIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Click en un pedido 'processed'
✅ Verificar que NO aparece botón "✏️ Editar"
✅ Verificar que campos están en modo solo lectura
✅ Intentar editar → debe estar bloqueado

📊 MONITOREO EN TIEMPO REAL:
- Ejecutar: startSyncMonitor()
- Observar notificaciones de sync en tiempo real
- stopSyncMonitor() para detener

💡 TROUBLESHOOTING:
- Si sync no ocurre: verificar conexión a Supabase
- Si hay errores: revisar tabla 'orders' en Supabase
- Si remote_id es null: verificar que el insert fue exitoso
    `
    
    this.displayGuide(guide)
  }

  /**
   * Mostrar guía de testing de edición
   */
  showEditingGuide() {
    this.currentGuide = 'editing'
    
    const guide = `
✏️ === GUÍA: TESTING FLUJO DE EDICIÓN ===

🎯 OBJETIVO: Verificar que edición funciona antes del sync
y se bloquea después del sync

📋 PREPARACIÓN:
✅ Crear pedido en modo offline (usar guía offline)
✅ Mantener modo offline para las primeras pruebas

✏️ PASO 1: EDITAR PEDIDO PENDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ir a "📋 Pedidos"
✅ Click en pedido con status "🕓 Pendiente"
✅ Verificar que aparece botón "✏️ Editar"
✅ Click en "✏️ Editar"
✅ Cambiar cantidad en algún item
✅ Verificar que total se recalcula automáticamente
✅ Click en "Guardar"
✅ Verificar mensaje de confirmación

🔍 VERIFICAR CAMBIOS GUARDADOS:
✅ Volver a la lista de pedidos
✅ Click nuevamente en el pedido editado
✅ Verificar que los cambios persisten
✅ Verificar nuevo total amount

🟢 PASO 2: SINCRONIZAR PEDIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Volver online (desmarcar "Offline")
✅ Esperar sync automático (5-10 segundos)
✅ Verificar que status cambia a "✅ Sincronizado"

🔒 PASO 3: VERIFICAR BLOQUEO POST-SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Click en el pedido ahora 'processed'
✅ Verificar que NO aparece botón "✏️ Editar"
✅ Verificar que los campos están en modo solo lectura
✅ Verificar mensaje si se intenta editar

🧪 CASOS DE PRUEBA:
1. Editar cantidad de items
2. Cambiar notas del pedido
3. Cambiar cliente (si está implementado)
4. Intentar editar después de sync (debe fallar)

🎯 RESULTADOS ESPERADOS:
✅ Pending orders: Totalmente editables
✅ Processed orders: Solo lectura
✅ Cambios persisten después de recarga
✅ Sync respeta las ediciones hechas offline
    `
    
    this.displayGuide(guide)
  }

  /**
   * Mostrar guía de testing de idempotencia
   */
  showIdempotencyGuide() {
    this.currentGuide = 'idempotency'
    
    const guide = `
🔄 === GUÍA: TESTING IDEMPOTENCIA ===

🎯 OBJETIVO: Verificar que remote_id previene duplicados
en escenarios de red inestable

⚠️ SETUP AVANZADO REQUERIDO:
Este test requiere simular condiciones de red inestable

🛠️ PASO 1: PREPARAR AMBIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Crear pedido en modo offline
✅ Abrir DevTools → Console
✅ Ejecutar: simulateUnstableNetwork()
✅ Esto simula fallos de red intermitentes

📤 PASO 2: SIMULAR SYNC CON FALLOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ir online (red inestable activa)
✅ Observar en consola los reintentos:
   - "⚠️ Red inestable - Intento 1 FALLO"
   - "⚠️ Red inestable - Intento 2 FALLO"  
   - "✅ Red inestable - Intento 3 ÉXITO"
✅ Verificar que al final el pedido se sync correctamente

🔍 PASO 3: VERIFICAR NO HAY DUPLICADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ir a Supabase Dashboard
✅ Verificar tabla 'orders'
✅ Verificar que solo hay 1 registro por pedido
✅ Verificar que remote_id es único
✅ No debe haber duplicados por los reintentos

🗄️ PASO 4: VERIFICAR INDEXEDDB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DevTools → Application → IndexedDB
✅ Verificar que solo hay 1 registro local
✅ Verificar que remote_id coincide con Supabase
✅ Verificar status 'processed'

🧪 PASO 5: TEST MÚLTIPLES REINTENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Crear varios pedidos offline
✅ Activar red inestable
✅ Ir online y observar sync masivo
✅ Verificar que todos se syncean sin duplicados

🎯 MECANISMO DE IDEMPOTENCIA:
- Cada pedido local tiene un ID único
- Al syncar, se envía este ID como referencia  
- Servidor verifica si ya existe antes de crear
- remote_id se usa como clave de idempotencia
- Reintentos no crean duplicados

💡 INDICADORES DE ÉXITO:
✅ Múltiples reintentos → 1 solo registro remoto
✅ remote_id único por pedido
✅ No hay duplicados en Supabase
✅ Sync eventualmente exitoso
    `
    
    this.displayGuide(guide)
  }

  /**
   * Mostrar checklist completo
   */
  showCompleteChecklist() {
    this.currentGuide = 'checklist'
    
    const checklist = `
☑️ === CHECKLIST COMPLETO FASE 5 ===

🔴 FLUJO OFFLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ DevTools → Network → Offline activado
□ Crear pedido desde UI funciona
□ Pedido se guarda en IndexedDB
□ Status = 'pending', remote_id = null
□ Recarga de página preserva datos
□ Pedido aparece en lista después de recarga
□ UI muestra correctamente "🔴 Offline"

🟢 FLUJO ONLINE 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Desactivar modo offline
□ Hook useSyncPedidos se ejecuta automáticamente
□ Status cambia de 'pending' a 'processed'
□ remote_id se asigna (número > 0)
□ UI muestra "✅ Sincronizado"
□ Badge pending count se actualiza
□ Network tab muestra requests a Supabase

✏️ EDICIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Pedidos 'pending' muestran botón "✏️ Editar"
□ Edición de cantidades funciona
□ Total amount se recalcula automáticamente
□ Cambios se guardan en IndexedDB
□ Pedidos 'processed' NO se pueden editar
□ UI bloquea edición post-sync
□ Cambios persisten después de recarga

🔄 IDEMPOTENCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Red inestable no crea duplicados
□ remote_id previene registros múltiples
□ Reintentos eventuales son exitosos
□ Solo 1 registro en Supabase por pedido
□ IndexedDB y Supabase sincronizados
□ Múltiples pedidos sync sin conflictos

🗄️ INTEGRIDAD DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Todos los processed tienen remote_id
□ Todos los pending NO tienen remote_id  
□ Totales calculados correctamente
□ Timestamps válidos (created_at, updated_at)
□ Referencias producto-pedido intactas
□ Almacén (almcnt) correcto en todos los pedidos

🎯 EXPERIENCIA DE USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Indicadores visuales claros (online/offline)
□ Feedback inmediato en operaciones
□ Estados de carga durante sync
□ Mensajes de error comprensibles
□ Navegación fluida entre páginas
□ Performance aceptable offline

🧪 TESTING TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ testManualSuite.runAllTests() ejecuta
□ showTestDashboard() funciona
□ simulateOffline()/simulateOnline() funcional
□ inspectDB() muestra datos correctos
□ Notificaciones visuales aparecen
□ Monitor de sync funciona

🔧 HERRAMIENTAS DEVTOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Network tab simula offline correctamente
□ Application → IndexedDB accesible
□ Console sin errores críticos
□ Performance tab sin memory leaks
□ Sources para debugging disponible

💯 CRITERIOS DE ÉXITO FINAL:
✅ Usuario puede trabajar 100% offline
✅ Sync automático al volver online
✅ Zero pérdida de datos
✅ UI coherente en todos los estados
✅ Performance aceptable
✅ Robustez ante fallos de red
    `
    
    this.displayGuide(checklist)
  }

  /**
   * Mostrar guía rápida de funciones
   */
  showQuickReference() {
    this.currentGuide = 'quick'
    
    const reference = `
⚡ === REFERENCIA RÁPIDA ===

🧪 FUNCIONES DE TESTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
testManualSuite.runAllTests()    // Ejecutar toda la suite
testOfflineOnly()                // Solo test offline
inspectDB()                      // Mostrar estado IndexedDB
createTestOrder('DEMO')          // Crear pedido de prueba
simulateOffline()                // Simular modo offline
simulateOnline()                 // Simular modo online

🎨 FUNCIONES VISUALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
showTestDashboard()              // Dashboard de testing
hideTestDashboard()              // Ocultar dashboard
startOfflineTest()               // Guía offline paso a paso
startOnlineTest()                // Guía online paso a paso
startSyncMonitor()               // Monitor de sync tiempo real
stopSyncMonitor()                // Detener monitor

📖 GUÍAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
devGuide.showOfflineGuide()     // Guía modo offline
devGuide.showOnlineGuide()       // Guía modo online  
devGuide.showEditingGuide()      // Guía de edición
devGuide.showIdempotencyGuide()  // Guía idempotencia
devGuide.showCompleteChecklist() // Checklist completo

🔍 INSPECCIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IndexedDBInspector.inspectPedidos()           // Ver todos los pedidos
IndexedDBInspector.inspectPedidoDetailed(id)  // Ver pedido específico
IndexedDBInspector.verifyDataIntegrity()      // Verificar integridad

🌐 SIMULACIÓN DE RED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const net = new NetworkSimulator()
net.goOffline()                  // Modo offline
net.goOnline()                   // Modo online
net.simulateUnstableNetwork()    // Red inestable
net.restore()                    // Restaurar estado

⚠️ DEVTOOLS QUICK TIPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F12                              // Abrir DevTools
Ctrl+Shift+I                     // Abrir DevTools (alt)
Ctrl+Shift+C                     // Inspector de elementos
Ctrl+Shift+J                     // Console directa
Ctrl+Shift+Delete                // Limpiar storage

🎯 TESTING WORKFLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. showTestDashboard()           // Abrir dashboard
2. startOfflineTest()            // Seguir guía offline
3. startSyncMonitor()            // Activar monitor
4. startOnlineTest()             // Seguir guía online
5. devGuide.showCompleteChecklist() // Verificar todo
    `
    
    this.displayGuide(reference)
  }

  /**
   * Mostrar guía en modal
   */
  displayGuide(content) {
    // Crear modal si no existe
    let modal = document.getElementById('devtools-guide-modal')
    if (!modal) {
      modal = document.createElement('dialog')
      modal.id = 'devtools-guide-modal'
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: white;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        overflow: hidden;
      `
      document.body.appendChild(modal)
    }

    modal.innerHTML = `
      <div style="
        padding: 20px;
        background: #235b4e;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h2 style="margin: 0; font-size: 18px;">📖 DevTools Testing Guide</h2>
        <button onclick="this.closest('dialog').close()" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 5px;
        ">×</button>
      </div>
      
      <div style="padding: 20px; overflow-y: auto; max-height: 60vh;">
        <pre style="
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #374151;
          margin: 0;
        ">${content}</pre>
      </div>
      
      <div style="
        padding: 15px 20px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      ">
        <button onclick="window.devGuide.showOfflineGuide()" style="
          padding: 8px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        ">🔴 Offline Guide</button>
        
        <button onclick="window.devGuide.showOnlineGuide()" style="
          padding: 8px 12px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        ">🟢 Online Guide</button>
        
        <button onclick="window.devGuide.showEditingGuide()" style="
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        ">✏️ Editing Guide</button>
        
        <button onclick="window.devGuide.showCompleteChecklist()" style="
          padding: 8px 12px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        ">☑️ Checklist</button>
        
        <button onclick="window.devGuide.showQuickReference()" style="
          padding: 8px 12px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        ">⚡ Quick Ref</button>
      </div>
    `

    modal.showModal()
  }

  /**
   * Cerrar guía
   */
  close() {
    const modal = document.getElementById('devtools-guide-modal')
    if (modal) {
      modal.close()
    }
  }
}

// Crear instancia global
const devGuide = new DevToolsGuide()

// Exponer globalmente
window.devGuide = devGuide
window.showDevToolsGuide = () => devGuide.showOfflineGuide()

// Auto-ejecutar al cargar
if (typeof window !== 'undefined') {
  console.log('📖 FASE 5 DevTools Guide Loaded')
  console.log('📋 Ejecuta: showDevToolsGuide()')
  console.log('📚 Ejecuta: devGuide.showCompleteChecklist()')
}

export { DevToolsGuide } 