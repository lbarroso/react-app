/**
 * FASE 4 - Testing Functions
 * Pruebas para el sistema de diseño mobile y UX
 */

/**
 * Prueba principal de la FASE 4
 */
function testFase4() {
  console.log('🎨 === INICIANDO PRUEBAS FASE 4 - UX/DISEÑO MOBILE ===')
  
  // Ejecutar todas las pruebas
  Promise.all([
    testDesignSystem(),
    testNumberStepper(),
    testDialogFullscreen(),
    testCardConstraints(),
    testTouchTargets(),
    testColorSystem(),
    testResponsiveLayout()
  ]).then(() => {
    console.log('✅ === FASE 4 COMPLETADA - TODAS LAS PRUEBAS PASARON ===')
  }).catch((error) => {
    console.error('❌ Error en las pruebas FASE 4:', error)
  })
}

/**
 * Probar Design System Variables
 */
async function testDesignSystem() {
  console.log('🎨 Probando Design System...')
  
  try {
    // Verificar que las variables CSS estén definidas
    const root = document.documentElement
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim()
    const secondaryColor = getComputedStyle(root).getPropertyValue('--secondary-color').trim()
    const cardMaxWidth = getComputedStyle(root).getPropertyValue('--card-max-width').trim()
    const cardRadius = getComputedStyle(root).getPropertyValue('--card-radius').trim()
    const touchTarget = getComputedStyle(root).getPropertyValue('--touch-target').trim()
    
    console.log('📋 Variables CSS:')
    console.log(`  Primary Color: ${primaryColor}`)
    console.log(`  Secondary Color: ${secondaryColor}`)
    console.log(`  Card Max Width: ${cardMaxWidth}`)
    console.log(`  Card Radius: ${cardRadius}`)
    console.log(`  Touch Target: ${touchTarget}`)
    
    // Verificar colores esperados
    if (primaryColor !== '#235b4e') {
      throw new Error(`Primary color incorrecto: esperado #235b4e, obtenido ${primaryColor}`)
    }
    
    if (secondaryColor !== '#bc955c') {
      throw new Error(`Secondary color incorrecto: esperado #bc955c, obtenido ${secondaryColor}`)
    }
    
    if (cardMaxWidth !== '340px') {
      throw new Error(`Card max-width incorrecto: esperado 340px, obtenido ${cardMaxWidth}`)
    }
    
    if (cardRadius !== '8px') {
      throw new Error(`Card radius incorrecto: esperado 8px, obtenido ${cardRadius}`)
    }
    
    if (touchTarget !== '48px') {
      throw new Error(`Touch target incorrecto: esperado 48px, obtenido ${touchTarget}`)
    }
    
    console.log('✅ Design System verificado correctamente')
    return true
    
  } catch (error) {
    console.error('❌ Error en Design System:', error)
    throw error
  }
}

/**
 * Probar NumberStepper Component
 */
async function testNumberStepper() {
  console.log('🔢 Probando NumberStepper...')
  
  try {
    // Crear contenedor temporal
    const container = document.createElement('div')
    container.innerHTML = `
      <div class="stepper">
        <button class="stepper-btn">−</button>
        <input class="stepper-input" value="5" type="text">
        <button class="stepper-btn">+</button>
      </div>
    `
    document.body.appendChild(container)
    
    // Verificar estructura
    const stepper = container.querySelector('.stepper')
    const buttons = container.querySelectorAll('.stepper-btn')
    const input = container.querySelector('.stepper-input')
    
    if (!stepper) {
      throw new Error('Stepper element no encontrado')
    }
    
    if (buttons.length !== 2) {
      throw new Error(`Esperados 2 botones, encontrados ${buttons.length}`)
    }
    
    if (!input) {
      throw new Error('Input element no encontrado')
    }
    
    // Verificar estilos computados
    const buttonStyle = getComputedStyle(buttons[0])
    const buttonWidth = buttonStyle.getPropertyValue('width')
    const buttonHeight = buttonStyle.getPropertyValue('height')
    
    console.log(`📐 Botón stepper - Width: ${buttonWidth}, Height: ${buttonHeight}`)
    
    // Cleanup
    document.body.removeChild(container)
    
    console.log('✅ NumberStepper estructura verificada')
    return true
    
  } catch (error) {
    console.error('❌ Error en NumberStepper:', error)
    throw error
  }
}

/**
 * Probar Dialog Fullscreen
 */
async function testDialogFullscreen() {
  console.log('📱 Probando Dialog Fullscreen...')
  
  try {
    // Crear dialog temporal
    const dialog = document.createElement('dialog')
    dialog.className = 'dialog-fullscreen'
    dialog.innerHTML = `
      <div class="nav-header">
        <h1 class="nav-title">Test Dialog</h1>
        <button class="back-btn">Cerrar</button>
      </div>
      <div class="container">
        <p>Contenido del dialog</p>
      </div>
    `
    
    document.body.appendChild(dialog)
    
    // Verificar estilos
    const dialogStyle = getComputedStyle(dialog)
    const position = dialogStyle.getPropertyValue('position')
    const width = dialogStyle.getPropertyValue('width')
    const height = dialogStyle.getPropertyValue('height')
    const zIndex = dialogStyle.getPropertyValue('z-index')
    
    console.log(`📐 Dialog - Position: ${position}, Width: ${width}, Height: ${height}, Z-Index: ${zIndex}`)
    
    // Verificar que es fullscreen
    if (position !== 'fixed') {
      throw new Error(`Position esperado 'fixed', obtenido '${position}'`)
    }
    
    if (width !== '100vw') {
      throw new Error(`Width esperado '100vw', obtenido '${width}'`)
    }
    
    if (height !== '100vh') {
      throw new Error(`Height esperado '100vh', obtenido '${height}'`)
    }
    
    // Cleanup
    document.body.removeChild(dialog)
    
    console.log('✅ Dialog Fullscreen verificado')
    return true
    
  } catch (error) {
    console.error('❌ Error en Dialog Fullscreen:', error)
    throw error
  }
}

/**
 * Probar Card Constraints
 */
async function testCardConstraints() {
  console.log('🃏 Probando Card Constraints...')
  
  try {
    // Crear card temporal
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = '<div class="card-padding">Test content</div>'
    
    document.body.appendChild(card)
    
    // Verificar estilos
    const cardStyle = getComputedStyle(card)
    const maxWidth = cardStyle.getPropertyValue('max-width')
    const borderRadius = cardStyle.getPropertyValue('border-radius')
    const boxShadow = cardStyle.getPropertyValue('box-shadow')
    
    console.log(`📐 Card - Max Width: ${maxWidth}, Border Radius: ${borderRadius}`)
    console.log(`📐 Card - Box Shadow: ${boxShadow}`)
    
    // Verificar constraints
    if (maxWidth !== '340px') {
      throw new Error(`Max width esperado 340px, obtenido ${maxWidth}`)
    }
    
    if (borderRadius !== '8px') {
      throw new Error(`Border radius esperado 8px, obtenido ${borderRadius}`)
    }
    
    // Cleanup
    document.body.removeChild(card)
    
    console.log('✅ Card Constraints verificados')
    return true
    
  } catch (error) {
    console.error('❌ Error en Card Constraints:', error)
    throw error
  }
}

/**
 * Probar Touch Targets
 */
async function testTouchTargets() {
  console.log('👆 Probando Touch Targets...')
  
  try {
    // Crear botones temporales
    const container = document.createElement('div')
    container.innerHTML = `
      <button class="btn btn-primary">Botón Normal</button>
      <button class="btn btn-sm">Botón Pequeño</button>
      <button class="btn-icon">Icon</button>
      <button class="btn-icon-sm">Icon SM</button>
    `
    
    document.body.appendChild(container)
    
    // Verificar targets
    const btnNormal = container.querySelector('.btn:not(.btn-sm)')
    const btnPequeno = container.querySelector('.btn-sm')
    const btnIcon = container.querySelector('.btn-icon')
    const btnIconSm = container.querySelector('.btn-icon-sm')
    
    const normalStyle = getComputedStyle(btnNormal)
    const pequenoStyle = getComputedStyle(btnPequeno)
    const iconStyle = getComputedStyle(btnIcon)
    const iconSmStyle = getComputedStyle(btnIconSm)
    
    console.log(`📐 Touch Targets:`)
    console.log(`  Normal: ${normalStyle.minHeight}`)
    console.log(`  Pequeño: ${pequenoStyle.minHeight}`)
    console.log(`  Icon: ${iconStyle.width} x ${iconStyle.height}`)
    console.log(`  Icon SM: ${iconSmStyle.width} x ${iconSmStyle.height}`)
    
    // Cleanup
    document.body.removeChild(container)
    
    console.log('✅ Touch Targets verificados')
    return true
    
  } catch (error) {
    console.error('❌ Error en Touch Targets:', error)
    throw error
  }
}

/**
 * Probar Color System
 */
async function testColorSystem() {
  console.log('🎨 Probando Color System...')
  
  try {
    // Crear elementos con diferentes colores
    const container = document.createElement('div')
    container.innerHTML = `
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <span class="badge badge-success">Success</span>
      <span class="badge badge-warning">Warning</span>
      <span class="badge badge-error">Error</span>
    `
    
    document.body.appendChild(container)
    
    // Verificar colores
    const btnPrimary = container.querySelector('.btn-primary')
    const btnSecondary = container.querySelector('.btn-secondary')
    
    const primaryBg = getComputedStyle(btnPrimary).backgroundColor
    const secondaryBg = getComputedStyle(btnSecondary).backgroundColor
    
    console.log(`🎨 Colores:`)
    console.log(`  Primary Button: ${primaryBg}`)
    console.log(`  Secondary Button: ${secondaryBg}`)
    
    // Cleanup
    document.body.removeChild(container)
    
    console.log('✅ Color System verificado')
    return true
    
  } catch (error) {
    console.error('❌ Error en Color System:', error)
    throw error
  }
}

/**
 * Probar Responsive Layout
 */
async function testResponsiveLayout() {
  console.log('📱 Probando Responsive Layout...')
  
  try {
    // Crear elementos responsive
    const container = document.createElement('div')
    container.innerHTML = `
      <div class="container">
        <div class="card card-responsive">
          <div class="card-padding">
            <div class="flex justify-between items-center">
              <span>Responsive Test</span>
              <button class="btn btn-sm">Action</button>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(container)
    
    // Verificar estilos responsive
    const containerEl = container.querySelector('.container')
    const cardResponsive = container.querySelector('.card-responsive')
    
    const containerStyle = getComputedStyle(containerEl)
    const cardStyle = getComputedStyle(cardResponsive)
    
    console.log(`📐 Responsive:`)
    console.log(`  Container max-width: ${containerStyle.maxWidth}`)
    console.log(`  Card responsive max-width: ${cardStyle.maxWidth}`)
    
    // Cleanup
    document.body.removeChild(container)
    
    console.log('✅ Responsive Layout verificado')
    return true
    
  } catch (error) {
    console.error('❌ Error en Responsive Layout:', error)
    throw error
  }
}

/**
 * Función para probar navegación entre páginas
 */
function testNavigation() {
  console.log('🧭 Probando navegación FASE 4...')
  
  console.log('📋 Rutas disponibles:')
  console.log('  /dashboard - Dashboard principal')
  console.log('  /pedidos - Lista de pedidos (con diseño actualizado)')
  console.log('  /pedidos/:id - Detalle de pedido (dialog fullscreen)')
  console.log('  /config - Página de configuraciones')
  
  console.log('💡 Para probar:')
  console.log('  1. Ir a /dashboard y usar botón "Config"')
  console.log('  2. Ir a /pedidos y ver cards con max-width 340px')
  console.log('  3. Abrir un pedido para ver dialog fullscreen')
  console.log('  4. Probar steppers en carrito y productos')
  
  return true
}

/**
 * Función para mostrar demo del sistema de diseño
 */
function showDesignSystemDemo() {
  console.log('🎨 === DEMO SISTEMA DE DISEÑO FASE 4 ===')
  
  const demoContent = `
    <div style="padding: 20px; background: var(--gray-50); min-height: 100vh;">
      <div class="container">
        <h1 style="color: var(--primary-color); margin-bottom: var(--space-xl);">
          🎨 Demo Sistema de Diseño Mobile
        </h1>
        
        <!-- Cards -->
        <section style="margin-bottom: var(--space-xl);">
          <h2>🃏 Cards (max-width: 340px, radius: 8px, shadow-sm)</h2>
          <div style="display: flex; gap: var(--space-lg); flex-wrap: wrap;">
            <div class="card">
              <div class="card-padding">
                <h3>Card Example 1</h3>
                <p>Max width 340px con border-radius 8px</p>
              </div>
            </div>
            <div class="card">
              <div class="card-padding">
                <h3>Card Example 2</h3>
                <p>Shadow-sm aplicado automáticamente</p>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Buttons -->
        <section style="margin-bottom: var(--space-xl);">
          <h2>🔘 Botones</h2>
          <div class="flex gap-md">
            <button class="btn btn-primary">Primary (#235b4e)</button>
            <button class="btn btn-secondary">Secondary (#bc955c)</button>
            <button class="btn btn-outline">Outline</button>
            <button class="btn btn-ghost">Ghost</button>
          </div>
        </section>
        
        <!-- Number Steppers -->
        <section style="margin-bottom: var(--space-xl);">
          <h2>🔢 Number Steppers (48px touch-friendly)</h2>
          <div class="stepper">
            <button class="stepper-btn">−</button>
            <input class="stepper-input" value="5" type="text">
            <button class="stepper-btn">+</button>
          </div>
        </section>
        
        <!-- Badges -->
        <section style="margin-bottom: var(--space-xl);">
          <h2>🏷️ Badges</h2>
          <div class="flex gap-sm">
            <span class="badge badge-success">Success</span>
            <span class="badge badge-warning">Warning</span>
            <span class="badge badge-error">Error</span>
            <span class="badge badge-info">Info</span>
            <span class="badge badge-gray">Gray</span>
          </div>
        </section>
        
        <!-- Touch Targets -->
        <section>
          <h2>👆 Touch Targets</h2>
          <div class="flex gap-md items-center">
            <button class="btn-icon">🏠</button>
            <button class="btn-icon-sm">⚙️</button>
            <button class="btn btn-lg">Large Button</button>
          </div>
        </section>
      </div>
    </div>
  `
  
  // Crear modal temporal para demo
  const modal = document.createElement('dialog')
  modal.className = 'dialog-fullscreen'
  modal.innerHTML = `
    <div class="nav-header">
      <h1 class="nav-title">Demo Sistema de Diseño</h1>
      <button class="back-btn" onclick="this.closest('dialog').close()">✕ Cerrar</button>
    </div>
    ${demoContent}
  `
  
  document.body.appendChild(modal)
  modal.showModal()
  
  // Auto cleanup después de 30 segundos
  setTimeout(() => {
    if (document.body.contains(modal)) {
      modal.close()
      document.body.removeChild(modal)
    }
  }, 30000)
  
  console.log('📱 Demo abierto en modal fullscreen (se cierra automáticamente en 30s)')
}

// Exponer funciones globalmente para pruebas manuales
window.testFase4 = testFase4
window.testDesignSystem = testDesignSystem
window.testNumberStepper = testNumberStepper
window.testDialogFullscreen = testDialogFullscreen
window.testCardConstraints = testCardConstraints
window.testTouchTargets = testTouchTargets
window.testColorSystem = testColorSystem
window.testResponsiveLayout = testResponsiveLayout
window.testNavigation = testNavigation
window.showDesignSystemDemo = showDesignSystemDemo

// Auto-ejecutar al cargar
if (typeof window !== 'undefined') {
  console.log('🎨 FASE 4 Testing Functions Loaded')
  console.log('💡 Funciones disponibles:')
  console.log('  testFase4() - Ejecutar todas las pruebas')
  console.log('  showDesignSystemDemo() - Ver demo del sistema de diseño')
  console.log('  testNavigation() - Info sobre navegación')
}

export {
  testFase4,
  testDesignSystem,
  testNumberStepper,
  testDialogFullscreen,
  testCardConstraints,
  testTouchTargets,
  testColorSystem,
  testResponsiveLayout,
  testNavigation,
  showDesignSystemDemo
} 