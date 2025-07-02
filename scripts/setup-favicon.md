# 🎨 Setup Favicon - Pedidos App

## Pasos para agregar tu favicon personalizado

### 1. Generar archivos de favicon

1. **Ve a**: https://favicon.io/favicon-converter/
2. **Sube** tu imagen (la imagen amarilla/verde que adjuntaste)
3. **Descarga** el archivo ZIP
4. **Extrae** los archivos

### 2. Archivos que obtendrás:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

### 3. Copiar archivos al proyecto

#### Copiar a carpeta `public/` (desarrollo):
```bash
copy favicon.ico public/
copy favicon-16x16.png public/
copy favicon-32x32.png public/
copy apple-touch-icon.png public/
```

#### Copiar a carpeta `dist/` (producción):
```bash
copy favicon.ico dist/
copy favicon-16x16.png dist/
copy favicon-32x32.png dist/
copy apple-touch-icon.png dist/
```

### 4. Rebuild de la aplicación

Después de copiar los archivos:

```bash
# Reconstruir la aplicación
npm run build

# Verificar que los archivos estén en dist/
ls dist/favicon*
```

### 5. Verificar funcionamiento

1. **Desarrollo**: `npm run dev` - Los favicons aparecerán en las pestañas del navegador
2. **Producción**: Los archivos en `dist/` se usarán cuando deploys la app

## ✅ Configuración ya realizada:

- ✅ HTML actualizado con links de favicon
- ✅ Vite.config.js configurado para copiar archivos
- ✅ PWA configurado para incluir favicons

## 🔧 Solo necesitas:

1. Generar los archivos de favicon en favicon.io
2. Copiarlos a `public/` y `dist/`
3. Ejecutar `npm run build`

¡Tu favicon personalizado estará listo! 🎉 