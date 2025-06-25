# 🗂️ Persistencia de Clientes en IndexedDB

Este documento explica la implementación de la funcionalidad de persistencia de clientes en IndexedDB después del login.

## 📋 Resumen de Funcionalidad

Al iniciar sesión, la aplicación:

1. **Conecta con Supabase** y descarga de la tabla `customers` los campos `almcnt`, `ctecve`, `name` para el almacén del usuario
2. **Crea en IndexedDB** (DB "PedidosDB" v5) el store `clientes` con clave compuesta y índices
3. **Guarda/actualiza masivamente** los clientes para persistencia offline
4. **Proporciona funciones** para leer clientes offline

## 🗃️ Estructura de IndexedDB

### Store: `clientes`
- **Clave compuesta**: `['almcnt', 'ctecve']`
- **Índices**:
  - `by-almcnt` sobre `almcnt`
  - `by-name` sobre `name`

### Esquema de datos:
```javascript
{
  almcnt: number,  // Número de almacén
  ctecve: number,  // Código de cliente
  name: string     // Nombre del cliente
}
```

## 📁 Archivos Modificados/Creados

### 1. `src/utils/getDB.js`
- ✅ Actualizado DB_VERSION a 5
- ✅ Agregado store `clientes` con clave compuesta
- ✅ Agregados índices `by-almcnt` y `by-name`

### 2. `src/utils/indexedDB.js`
- ✅ Agregada función `cacheClients(clientes)` - Guarda/actualiza clientes
- ✅ Agregada función `getClientsLocal(almcnt)` - Obtiene clientes offline

### 3. `src/utils/client-operations.js` (Nuevo)
- ✅ `downloadAndCacheClients(almcnt)` - Descarga desde Supabase y cachea
- ✅ `getClients(almcnt)` - Obtiene clientes desde IndexedDB
- ✅ `findClientByCode(almcnt, ctecve)` - Busca cliente específico
- ✅ `searchClientsByName(almcnt, searchTerm)` - Búsqueda por nombre

### 4. `src/pages/Login.jsx`
- ✅ Agregada descarga y cacheo de clientes después del login
- ✅ Implementado antes de navegar al dashboard

### 5. `src/components/ClientSelector.jsx` (Nuevo)
- ✅ Componente de ejemplo para mostrar uso de la funcionalidad
- ✅ Incluye búsqueda y selección de clientes

### 6. `src/components/ClientSelector.css` (Nuevo)
- ✅ Estilos para el componente ClientSelector

## 🚀 Uso de las Funciones

### Obtener clientes offline:
```javascript
import { getClients } from '../utils/client-operations'

const clientes = await getClients(almcnt)
```

### Buscar cliente por código:
```javascript
import { findClientByCode } from '../utils/client-operations'

const cliente = await findClientByCode(almcnt, ctecve)
```

### Buscar clientes por nombre:
```javascript
import { searchClientsByName } from '../utils/client-operations'

const clientesFiltrados = await searchClientsByName(almcnt, 'Juan')
```

### Usar el componente selector:
```javascript
import ClientSelector from '../components/ClientSelector'

function MiComponente() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  return (
    <ClientSelector 
      onClientSelect={setClienteSeleccionado}
      selectedClient={clienteSeleccionado}
    />
  )
}
```

## 🔄 Flujo de Autenticación

1. Usuario ingresa credenciales en `Login.jsx`
2. Se autentica con Supabase
3. Se obtiene `almcnt` desde tabla `users`
4. Se actualiza `user_metadata` con `almcnt`
5. **Se descargan clientes desde Supabase** (tabla `customers`)
6. **Se cachean en IndexedDB** para uso offline
7. Se navega al dashboard

## 📊 Diagrama de Flujo

```
Login → Auth → Get almcnt → Download Customers → Cache in IndexedDB → Dashboard
                    ↓
            Offline Access Available
```

## 🛠️ Funciones Disponibles

| Función | Descripción | Parámetros | Retorna |
|---------|-------------|------------|---------|
| `downloadAndCacheClients()` | Descarga desde Supabase y cachea | `almcnt` | `Array<Cliente>` |
| `getClients()` | Obtiene clientes offline | `almcnt` | `Array<Cliente>` |
| `findClientByCode()` | Busca cliente específico | `almcnt, ctecve` | `Cliente \| null` |
| `searchClientsByName()` | Búsqueda por nombre | `almcnt, searchTerm` | `Array<Cliente>` |
| `cacheClients()` | Cachea lista de clientes | `Array<Cliente>` | `void` |
| `getClientsLocal()` | Acceso directo a IndexedDB | `almcnt` | `Array<Cliente>` |

## ✅ Beneficios

- **🔌 Funcionalidad Offline**: Los clientes están disponibles sin conexión
- **⚡ Rendimiento**: Acceso rápido desde IndexedDB
- **🔄 Sincronización**: Se actualiza en cada login
- **🔍 Búsqueda**: Índices para búsquedas eficientes
- **🎯 Tipo de Datos**: TypeScript-friendly con JSDoc

## 🧪 Testing

Para probar la funcionalidad:

1. Hacer login con usuario válido
2. Verificar en DevTools > Application > IndexedDB > PedidosDB > clientes
3. Usar las funciones de búsqueda en componentes
4. Probar funcionalidad offline desconectando red

## 🔧 Consideraciones Técnicas

- **Versión DB**: Actualizada a v5 para agregar store clientes
- **Clave Compuesta**: Permite múltiples almacenes por cliente
- **Índices**: Optimizan búsquedas por almacén y nombre  
- **Manejo de Errores**: Todas las funciones incluyen try/catch
- **Performance**: Upsert masivo para eficiencia
- **Escalabilidad**: Estructura preparada para grandes volúmenes

---

**✨ La funcionalidad está lista para usar y proporciona una base sólida para el manejo offline de clientes.** 