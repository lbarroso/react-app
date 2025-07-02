/**
 * 🧪 Testing Functions para PWA Install Prompt
 * Funciones para probar el diseño del prompt PWA en desarrollo
 */

// 🎯 Función para simular el evento beforeinstallprompt
export function simulatePWAPrompt() {
  console.log('🧪 Simulando evento beforeinstallprompt...')
  
  // Crear evento mock
  const mockEvent = {
    preventDefault: () => console.log('preventDefault() llamado'),
    prompt: async () => {
      console.log('💾 Prompt nativo simulado...')
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simular aceptación aleatoria
          const outcome = Math.random() > 0.5 ? 'accepted' : 'dismissed'
          console.log(`🎭 Usuario ${outcome === 'accepted' ? 'aceptó' : 'canceló'} la instalación`)
          resolve({ outcome })
        }, 2000) // Simular 2 segundos de carga
      })
    }
  }
  
  // Disparar el evento
  const event = new CustomEvent('beforeinstallprompt', { detail: mockEvent })
  window.dispatchEvent(event)
}

// 🧹 Función para resetear el estado del prompt
export function resetPWAPromptState() {
  console.log('🧹 Reseteando estado del prompt PWA...')
  sessionStorage.removeItem('pwa-prompt-shown')
  sessionStorage.removeItem('pwa-installed')
  console.log('✅ Estado reseteado - el prompt aparecerá de nuevo')
}

// 📊 Función para verificar el estado actual
export function checkPWAState() {
  console.log('📊 Estado actual del PWA:')
  console.log('- Prompt mostrado:', sessionStorage.getItem('pwa-prompt-shown'))
  console.log('- PWA instalada:', sessionStorage.getItem('pwa-installed'))
  console.log('- Es standalone:', window.matchMedia('(display-mode: standalone)').matches)
  console.log('- User agent:', navigator.userAgent)
}

// 🎨 Función para mostrar tips de diseño
export function showDesignTips() {
  console.log(`
🎨 DESIGN TIPS PARA PWA PROMPT:

✨ Efectos implementados:
- Glassmorphism con backdrop-filter
- Animaciones de entrada suaves
- Sparkles animados flotantes
- Gradientes dinámicos
- Hover effects con elevación
- Responsive para móviles
- Dark mode automático

🎯 Estrategias UX aplicadas:
- Delay de 3 segundos para no interrumpir
- Beneficios claros con iconos
- CTA prominente con shimmer effect
- Opciones secundarias discretas
- Badge de confianza para credibilidad
- Persistencia inteligente (session vs localStorage)

🚀 Para testing:
- simulatePWAPrompt() - Simula el evento
- resetPWAPromptState() - Limpia el estado
- checkPWAState() - Verifica estado actual
  `)
}

// 🌐 Exponer funciones globalmente para DevTools
if (typeof window !== 'undefined') {
  window.testPWA = {
    simulate: simulatePWAPrompt,
    reset: resetPWAPromptState,
    check: checkPWAState,
    tips: showDesignTips
  }
  
  console.log('🧪 PWA Testing disponible en: window.testPWA')
  console.log('   • window.testPWA.simulate() - Simular prompt')
  console.log('   • window.testPWA.reset() - Resetear estado')
  console.log('   • window.testPWA.check() - Ver estado')
  console.log('   • window.testPWA.tips() - Ver tips de diseño')
} 