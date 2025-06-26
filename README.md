# 📦 Pedidos App - PWA Offline First

Aplicación Progressive Web App (PWA) para gestión de pedidos con funcionalidad offline completa y sincronización automática con Supabase.

## 🎯 Características Principales

- **🔴 100% Funcionalidad Offline**: Crear, editar y gestionar pedidos sin conexión a internet
- **🔄 Sincronización Automática**: Sync inteligente al recuperar conexión
- **📱 Mobile-First Design**: Optimizado para dispositivos móviles con touch-friendly controls
- **🗄️ IndexedDB Local**: Almacenamiento robusto y persistente
- **☁️ Supabase Integration**: Backend en la nube con sync bidireccional
- **🎨 Modern UX**: Sistema de diseño consistente y accesible

## 🏗️ Arquitectura del Sistema

### Pedidos Offline → Supabase

El sistema implementa un flujo robusto de trabajo offline con sincronización inteligente:

#### 🔴 **Flujo Offline**
```
Usuario → Productos → Carrito → Checkout → Pedido Local
                                              ↓
                                        IndexedDB
                                       (status: pending)
```

#### 🟢 **Flujo Online Sync**
```
IndexedDB → Hook useSyncPedidos → Supabase → IndexedDB Updated
(pending)                        (orders)    (status: processed)
                                               (remote_id: assigned)
```

#### 🔄 **Ciclo Completo**
1. **Offline**: Usuario crea pedidos que se almacenan en IndexedDB
2. **Online**: Hook detecta conexión y sincroniza automáticamente
3. **Sync**: Pedidos se envían a Supabase y reciben `remote_id`
4. **Update**: Status local cambia a `processed` con referencia remota
5. **Idempotencia**: `remote_id` previene duplicados en reintentos

### 🗄️ **Estructura de Datos**

#### IndexedDB Stores
- `pedidos`: Headers de pedidos con metadata
- `pedidos_items`: Items individuales de cada pedido
- `productos`: Catálogo de productos para offline
- `carrito_items`: Items temporales del carrito
- `clientes`: Base de datos local de clientes
- `session_store`: Datos de sesión del usuario

#### Supabase Tables
- `orders`: Pedidos sincronizados desde IndexedDB
- `order_items`: Items de pedidos con referencias
- `products`: Catálogo maestro de productos
- `clients`: Base de datos central de clientes

### 🔐 **Estados y Transiciones**

#### Estados de Pedidos
```javascript
'pending' → 'processed' → 'completed'
   ↓            ↓            ↓
 Local      Synced      Delivered
(editable) (readonly)   (archived)
```

#### Sync Status
```javascript
'local' → 'syncing' → 'synced' → 'error'
```

## 🚀 Instalación y Setup

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta Supabase
- Browser moderno con soporte IndexedDB

### Configuración

1. **Clonar el repositorio**
```bash
git clone [repository-url]
cd pedidos-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Supabase**
```bash
# Crear archivo .env.local
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Build para producción**
```bash
npm run build
```

## 📱 Uso de la Aplicación

### Flujo Básico
1. **Login**: Autenticación con almacén asignado
2. **Catálogo**: Navegación y búsqueda de productos
3. **Carrito**: Agregar productos con selector unidades/piezas
4. **Checkout**: Selección de cliente y creación de pedido
5. **Gestión**: Lista y edición de pedidos offline
6. **Sync**: Sincronización automática al volver online

### Características Offline
- ✅ Crear pedidos sin internet
- ✅ Editar pedidos pendientes
- ✅ Buscar productos en catálogo local
- ✅ Gestionar carrito completamente
- ✅ Persistencia entre recargas de página

### Características Online
- ✅ Sincronización automática al conectar
- ✅ Actualizaciones de catálogo en tiempo real
- ✅ Backup en la nube de todos los pedidos
- ✅ Prevención de duplicados con `remote_id`

## 🧪 Testing y Validación

### Testing Manual Integrado
La aplicación incluye un sistema completo de testing manual:

```javascript
// Activar dashboard de testing
showTestDashboard()

// Ejecutar suite completa
testManualSuite.runAllTests()

// Simular condiciones de red
simulateOffline()  // Modo offline
simulateOnline()   // Modo online

// Inspeccionar datos
inspectDB()        // Ver IndexedDB
checkDataIntegrity() // Verificar consistencia
```

### Flujos de Prueba
1. **🔴 Offline Flow**: Crear pedidos sin internet
2. **🟢 Online Sync**: Verificar sincronización automática
3. **✏️ Editing**: Validar edición diferencial (pending vs processed)
4. **🔄 Idempotency**: Probar robustez con red inestable

Ver [FASE_5_TESTING_MANUAL.md](./FASE_5_TESTING_MANUAL.md) para guía completa.

## 🎨 Design System

### Mobile-First UX
- **Cards**: max-width 340px, border-radius 8px, shadow-sm
- **Botones primarios**: `#235b4e` (verde corporativo)
- **Botones secundarios**: `#bc955c` (dorado corporativo)
- **Touch targets**: 48px mínimo para accesibilidad móvil
- **Number steppers**: Controles touch-friendly para cantidades

### Componentes Principales
- `NumberStepper`: Control numérico accesible
- `ProductCard`: Card de producto con selector unidades/piezas
- `CarritoModal`: Modal de carrito con checkout integrado
- `OrdersPage`: Lista de pedidos con filtros por estado
- `OrderDetail`: Detalle en dialog fullscreen (patrón Android)

## 🔧 Arquitectura Técnica

### Frontend Stack
- **React 18**: Library principal
- **Vite**: Build tool y dev server
- **React Router**: Routing SPA
- **IndexedDB**: Base de datos local
- **Service Worker**: Cache y offline capabilities

### Backend Stack
- **Supabase**: Backend as a Service
- **PostgreSQL**: Base de datos relacional
- **Real-time subscriptions**: Updates en tiempo real
- **Row Level Security**: Seguridad por almacén

### Patterns Implementados
- **Offline-First**: Prioridad a funcionalidad local
- **Progressive Enhancement**: Mejoras graduales online
- **Optimistic UI**: Updates inmediatos con rollback
- **Event Sourcing**: Tracking de cambios y sync
- **CQRS**: Separación command/query para performance

## 📊 Performance y Optimización

### Métricas Objetivo
- **Time to Interactive**: < 3 segundos
- **First Contentful Paint**: < 1.5 segundos
- **Offline Functionality**: 100% feature parity
- **Sync Performance**: < 5 segundos para 50 pedidos

### Optimizaciones Implementadas
- Lazy loading de componentes
- Virtual scrolling para listas largas
- Debounce en búsquedas
- Cache inteligente de imágenes
- Compression de datos en IndexedDB

## 🔒 Seguridad

### Medidas Implementadas
- Row Level Security en Supabase
- Validación de almacén por usuario
- Sanitización de inputs
- HTTPS obligatorio en producción
- Token refresh automático

## 🚀 Deployment

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Manual
```bash
npm run build
# Subir carpeta dist/ a hosting estático
```

### PWA Installation
La aplicación es instalable como PWA:
1. Abrir en Chrome/Edge/Safari
2. Menú → "Instalar aplicación"
3. Funciona offline una vez instalada

## 📝 Documentación Adicional

- [FASE_1_COMPLETADA.md](./FASE_1_COMPLETADA.md): Funcionalidades base
- [FASE_5_TESTING_MANUAL.md](./FASE_5_TESTING_MANUAL.md): Guía de testing
- [CLIENT_PERSISTENCE_README.md](./CLIENT_PERSISTENCE_README.md): Persistencia de datos
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md): Resumen técnico

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Para soporte técnico:
1. Revisar [Issues](../../issues) existentes
2. Crear nuevo issue con template apropiado
3. Incluir logs de consola y pasos para reproducir

---

**Desarrollado con ❤️ para funcionalidad offline robusta y experiencia de usuario excepcional.**
