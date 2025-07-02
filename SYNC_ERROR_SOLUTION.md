# SOLUCIÓN - Error de Sincronización con Supabase

## 🔍 Problema Identificado

El error de sincronización ocurría por **discrepancias entre los campos de la base de datos local (IndexedDB) y la estructura de Supabase**.

### Campos en Supabase (según imagen):

**Tabla `orders`:**
- `id` (int8)
- `customer_id` (int8) 
- `status` (varchar)
- `total_amount` (numeric)
- `order_date` (timestamp)
- `sync_date` (timestamp)
- `notes` (text)
- `is_synced` (bool)
- `almcnt` (int4)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `user_id` (uuid)

**Tabla `order_items`:**
- `id` (int8)
- `order_id` (int8)
- `product_id` (int8)
- `quantity` (int4)
- `unit_price` (numeric)
- `total_price` (numeric)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## ✅ Solución Implementada

### 1. **Sincronización DESHABILITADA temporalmente**
- Modificado `useSyncPedidos.js` con flag `DISABLE_SYNC_FOR_TESTING = true`
- Esto permite seguir creando pedidos sin errores de sync

### 2. **Sistema de mapeo de campos**
- Creado `supabaseFieldMapping.js` que mapea correctamente:
  - Campos locales → Campos Supabase
  - Filtro de campos que NO van a Supabase
  - Validación de datos antes de sync

### 3. **Mejoras en debugging**
- Funciones de validación y debug
- Logs detallados de errores
- Herramientas de prueba

### 4. **Herramientas de Testing**
- `testSyncFields.js` para probar sin insertar datos
- Funciones disponibles en DevTools para testing

## 🧪 Cómo Probar

### Opción 1: Validar campos (SIN insertar)
```javascript
// En DevTools Console:
testSyncFields()
```

### Opción 2: Probar inserción real (CUIDADO)
```javascript
// En DevTools Console:
testRealInsert()
```

## 🔧 Cómo Habilitar la Sincronización

Cuando estés listo para habilitar la sincronización real:

1. **Ejecutar pruebas primero:**
   ```javascript
   testSyncFields() // Debe pasar sin errores
   ```

2. **Cambiar flag en `useSyncPedidos.js`:**
   ```javascript
   const DISABLE_SYNC_FOR_TESTING = false // Cambiar a false
   ```

3. **Crear un pedido de prueba y verificar que se sincroniza correctamente**

## 📋 Archivos Modificados

- ✅ `src/hooks/useSyncPedidos.js` - Deshabilitado temporalmente
- ✅ `src/utils/supabaseSync.js` - Usa mapeo correcto de campos
- ✅ `src/utils/supabaseFieldMapping.js` - **NUEVO** - Mapeo de campos
- ✅ `src/utils/testSyncFields.js` - **NUEVO** - Herramientas de prueba
- ✅ `src/App.jsx` - Importa herramientas de prueba

## 🎯 Estado Actual

✅ **App funcional** - Puedes crear pedidos sin errores  
⏸️ **Sync pausado** - Para evitar errores de campos  
🧪 **Testing listo** - Herramientas para validar antes de habilitar  

## 🚨 Próximos Pasos

1. **Crear un pedido** para tener datos de prueba
2. **Ejecutar `testSyncFields()`** en DevTools para validar
3. **Si todo está OK**, cambiar `DISABLE_SYNC_FOR_TESTING = false`
4. **Probar sync real** con un pedido

## 💡 Notas Importantes

- El mapeo filtra campos locales que NO existen en Supabase
- Se validan datos antes de intentar sincronizar
- Los timestamps se convierten al formato ISO correcto
- Se maneja correctamente el `user_id` del usuario autenticado 