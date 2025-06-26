# FASE 5 - Manual Testing Documentation

## 🎯 Objetivo
Validar el flujo completo offline/online de la aplicación PWA, verificando robustez, persistencia de datos y sincronización correcta.

## 🧪 Herramientas de Testing Disponibles

### 📱 Dashboard Visual
```javascript
showTestDashboard()     // Mostrar panel de control
hideTestDashboard()     // Ocultar panel
```

### 🔴 Simulación de Red
```javascript
simulateOffline()       // Activar modo offline
simulateOnline()        // Activar modo online
```

### 🗄️ Inspección de Datos
```javascript
inspectDB()             // Ver estado IndexedDB
checkDataIntegrity()    // Verificar integridad completa
compareAllOrders()      // Comparar local vs remoto
```

### 🧭 Guías Paso a Paso
```javascript
startOfflineTest()      // Guía flujo offline
startOnlineTest()       // Guía flujo online
showDevToolsGuide()     // Guía completa DevTools
```

### 📊 Monitoreo en Tiempo Real
```javascript
startSyncMonitor()      // Activar monitor de sync
stopSyncMonitor()       // Detener monitor
```

## 🔴 PRUEBA 1: Flujo Offline

### Objetivo
Verificar que la aplicación funciona completamente sin conexión a internet.

### Pasos
1. **Preparación**
   ```bash
   # En DevTools
   F12 → Network tab → Check "Offline"
   ```

2. **Crear Pedido Offline**
   - Ir a Dashboard
   - Agregar productos al carrito
   - Proceder a checkout
   - Crear pedido exitosamente

3. **Verificación IndexedDB**
   ```bash
   # En DevTools
   Application → IndexedDB → PedidosDB → pedidos
   ```
   
   **Campos a verificar:**
   - `status: 'pending'`
   - `remote_id: null`
   - `sync_status: 'local'`
   - `total_amount: [correcto]`

4. **Test de Persistencia**
   - Recargar página (F5)
   - Ir a "📋 Pedidos"
   - Verificar que aparece el pedido
   - Status debe ser "🕓 Pendiente"

### Resultado Esperado
✅ Pedido creado y persistido offline  
✅ Datos guardados en IndexedDB  
✅ UI indica modo offline claramente  
✅ Funcionalidad completa sin internet  

## 🟢 PRUEBA 2: Flujo Online y Sync

### Objetivo
Verificar sincronización automática al restaurar conexión.

### Pasos
1. **Volver Online**
   ```bash
   # En DevTools
   Network tab → Uncheck "Offline"
   ```

2. **Observar Sync Automático**
   - Esperar 5-10 segundos
   - Observar consola del navegador
   - Buscar mensajes: "📤 Syncing orders..."

3. **Verificar Cambios**
   - Ir a "📋 Pedidos"
   - Status debe cambiar a "✅ Sincronizado"
   - Badge pending debe disminuir

4. **Verificar IndexedDB Actualizada**
   ```bash
   Application → IndexedDB → PedidosDB → pedidos
   ```
   
   **Campos actualizados:**
   - `status: 'processed'`
   - `remote_id: [número > 0]`
   - `sync_status: 'synced'`

### Resultado Esperado
✅ Sync automático al volver online  
✅ Status cambia a 'processed'  
✅ remote_id asignado correctamente  
✅ UI actualizada en tiempo real  

## ✏️ PRUEBA 3: Edición Antes y Después de Sync

### Objetivo
Verificar que edición funciona en pending y se bloquea en processed.

### Pasos
1. **Editar Pedido Pending**
   - Crear pedido offline
   - Click en pedido → debe mostrar "✏️ Editar"
   - Cambiar cantidad de algún item
   - Verificar recálculo automático de total
   - Guardar cambios

2. **Verificar Cambios Persistidos**
   - Volver a la lista
   - Reabrir pedido
   - Verificar que cambios persisten

3. **Sincronizar Pedido**
   - Volver online
   - Esperar sync automático
   - Verificar status → "✅ Sincronizado"

4. **Intentar Editar Post-Sync**
   - Click en pedido processed
   - NO debe aparecer botón "✏️ Editar"
   - Campos deben estar en solo lectura

### Resultado Esperado
✅ Pending: Totalmente editable  
✅ Processed: Solo lectura  
✅ Cambios persisten después de sync  
✅ UI bloquea edición correctamente  

## 🔄 PRUEBA 4: Idempotencia con Red Inestable

### Objetivo
Verificar que remote_id previene duplicados en condiciones adversas.

### Pasos
1. **Simular Red Inestable**
   ```javascript
   // En consola
   const net = new NetworkSimulator()
   net.simulateUnstableNetwork()
   ```

2. **Crear Pedido y Intentar Sync**
   - Crear pedido offline
   - Volver "online" (red inestable activa)
   - Observar reintentos en consola:
     ```
     ⚠️ Red inestable - Intento 1 FALLO
     ⚠️ Red inestable - Intento 2 FALLO  
     ✅ Red inestable - Intento 3 ÉXITO
     ```

3. **Verificar No Hay Duplicados**
   - Ir a Supabase Dashboard
   - Verificar tabla 'orders'
   - Debe haber solo 1 registro por pedido
   - remote_id debe ser único

### Resultado Esperado
✅ Múltiples reintentos no crean duplicados  
✅ Eventual éxito del sync  
✅ remote_id garantiza idempotencia  
✅ Integridad de datos mantenida  

## 🔍 Verificaciones Adicionales

### IndexedDB Inspector
```javascript
// Inspeccionar todos los pedidos
inspectDB()

// Ver pedido específico en detalle
IndexedDBInspector.inspectPedidoDetailed(1)

// Verificar integridad completa
checkDataIntegrity()
```

### Comparación Local vs Remoto
```javascript
// Comparar pedido específico
compareOrder(1)

// Comparar todos los pedidos procesados
compareAllOrders()
```

### Monitor de Sync en Tiempo Real
```javascript
// Activar monitor
startSyncMonitor()

// Ver notificaciones de sync en tiempo real
// Detener cuando termine
stopSyncMonitor()
```

## ☑️ Checklist de Validación

### 🔴 Offline
- [ ] DevTools modo offline funciona
- [ ] Crear pedido sin internet exitoso
- [ ] IndexedDB guarda datos correctamente
- [ ] Recarga preserva datos
- [ ] UI indica estado offline

### 🟢 Online/Sync
- [ ] Desactivar offline restaura conexión
- [ ] Sync automático se ejecuta
- [ ] Status cambia pending → processed
- [ ] remote_id se asigna
- [ ] UI se actualiza en tiempo real

### ✏️ Edición
- [ ] Pending orders son editables
- [ ] Processed orders están bloqueados
- [ ] Cambios persisten offline
- [ ] Recálculos automáticos funcionan

### 🔄 Robustez
- [ ] Red inestable no causa duplicados
- [ ] Reintentos eventuales son exitosos
- [ ] Integridad de datos mantenida
- [ ] Performance aceptable

### 🗄️ Integridad
- [ ] Todos processed tienen remote_id
- [ ] Todos pending NO tienen remote_id
- [ ] Totales calculados correctamente
- [ ] Referencias intactas

## 🚨 Indicadores de Problemas

### ❌ Errores Críticos
- Pedidos no se guardan offline
- Sync no ocurre al volver online
- Duplicados en Supabase
- Pérdida de datos al recargar
- Errores JavaScript en consola

### ⚠️ Advertencias
- Sync lento (>10 segundos)
- Warnings en consola
- Performance degradada
- UI inconsistente

## 💡 Tips de Debugging

### DevTools Útiles
- **Network**: Simular offline, ver requests
- **Application**: IndexedDB, LocalStorage, Cache
- **Console**: Logs, errores, testing functions
- **Performance**: Memory leaks, rendering

### Comandos Útiles
```javascript
// Ver estado sync actual
window.syncState

// Ver estadísticas
window.syncState.syncStats

// Limpiar datos de prueba
// (¡CUIDADO! Borra todo)
indexedDB.deleteDatabase('PedidosDB')
```

## 🎯 Criterios de Éxito Final

Para considerar FASE 5 exitosa:

1. **✅ 100% Funcionalidad Offline**
   - Crear, ver, editar pedidos sin internet
   - Datos persisten entre recargas
   - UI coherente en modo offline

2. **✅ Sync Automático Robusto**
   - Sincronización inmediata al volver online
   - Manejo de errores de red
   - Reintentos automáticos

3. **✅ Integridad de Datos**
   - Zero pérdida de información
   - Consistencia local-remoto
   - Prevención de duplicados

4. **✅ Experiencia de Usuario**
   - Indicadores visuales claros
   - Performance aceptable
   - Transiciones suaves entre estados

**Si todos los criterios se cumplen: ✅ FASE 5 COMPLETADA** 