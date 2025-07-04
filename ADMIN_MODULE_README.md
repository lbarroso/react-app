# Módulo Administrativo - Subir CSV

## 📋 Descripción
Módulo integrado para sincronizar productos desde archivos CSV a la base de datos Supabase. Implementa la regla de negocio UPSERT basada en la combinación única `(code, almcnt)`.

## 🚀 Características Implementadas

### ✅ Estructura de Archivos
```
src/admin/
├── pages/
│   ├── AdminDashboard.jsx     # Panel principal con grid de opciones
│   └── CsvUpload.jsx          # Página de carga de CSV
└── components/
    └── CsvUploader.jsx        # Componente principal de procesamiento
```

### ✅ Funcionalidades

#### 1. **Panel Administrativo** (`/admin`)
- Grid responsive con 4 cards de opciones
- Solo "Subir CSV" está habilitado
- Navegación desde el header del Dashboard (botón "⚙️ Admin")
- Diseño moderno con Tailwind CSS

#### 2. **Carga de CSV** (`/admin/upload-csv`)
- Interfaz drag-and-drop para archivos CSV
- Validación de formato de archivo
- Tabla de referencia con campos requeridos
- Información contextual sobre el proceso

#### 3. **Procesamiento CSV**
- **Parser**: PapaParse con configuración UTF-8
- **Validaciones**: Campos requeridos (code, almcnt)
- **Upsert**: Supabase con `onConflict: ['code', 'almcnt']`
- **Logging**: Sistema de logs en tiempo real
- **Contadores**: Éxitos y errores

## 🔧 Configuración Técnica

### Dependencias Instaladas
```bash
npm i papaparse react-icons
```

### Rutas Integradas
- `/admin` → AdminDashboard
- `/admin/upload-csv` → CsvUpload

### Campos del CSV
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `category_id` | number | Sí | ID de categoría |
| `name` | string | Sí | Nombre del producto |
| `code` | string | Sí | Código único (parte de la clave UPSERT) |
| `barcode` | string | No | Código de barras |
| `description` | string | No | Descripción |
| `price` | number | Sí | Precio |
| `stock` | number | Sí | Stock disponible |
| `unit` | string | No | Unidad de medida |
| `image` | string | No | URL de imagen |
| `almcnt` | number | Sí | Código almacén (parte de la clave UPSERT) |

### Lógica de Negocio
```javascript
// Payload procesado
const payload = {
  category_id: Number(row.category_id) || 1,
  name: row.name?.trim() || 'SIN NOMBRE',
  code: row.code?.trim(),
  barcode: row.barcode?.trim() || null,
  description: row.description?.trim() || null,
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  unit: row.unit?.trim() || 'pieza',
  image: row.image?.trim() || null,
  almcnt: Number(row.almcnt),
  updated_at: new Date().toISOString()
}

// Upsert en Supabase
await supabase
  .from('products')
  .upsert(payload, { onConflict: 'code,almcnt' })
```

## 📊 Interfaz de Usuario

### Características de UX
- **Drag & Drop**: Zona de carga intuitiva
- **Validación**: Verificación de formato CSV
- **Feedback**: Logs en tiempo real con colores
- **Resultados**: Contador visual de éxitos/errores
- **Responsivo**: Optimizado para móvil y desktop

### Estados del Componente
- **Idle**: Esperando archivo
- **Processing**: Procesando CSV con spinner
- **Completed**: Mostrando resultados y logs

## 🧪 Testing

### Archivo de Prueba
Se incluye `productos_supabase_20250702_215022.csv` con 5 productos de ejemplo.

### Flujo de Testing
1. Navegar a `/admin`
2. Hacer clic en "Subir CSV"
3. Cargar el archivo de prueba
4. Verificar procesamiento y logs
5. Confirmar en Supabase que los datos se guardaron

## 🔒 Seguridad
- Todas las rutas admin requieren autenticación (`PrivateRoute`)
- Validación de archivos CSV únicamente
- Sanitización de datos antes del upsert
- Manejo de errores robusto

## 📱 Integración
- **Router**: Rutas integradas en `src/routes/Router.jsx`
- **Navegación**: Botón "⚙️ Admin" en header del Dashboard
- **Supabase**: Reutiliza `supabaseClient.js` existente
- **Estilos**: Utiliza Tailwind CSS del proyecto

## 🎯 Próximos Pasos
- Implementar módulos adicionales (Usuarios, Reportes, Configuración)
- Añadir validaciones más avanzadas
- Implementar carga por lotes para archivos grandes
- Añadir preview de datos antes del procesamiento 