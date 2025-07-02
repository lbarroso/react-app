/**
 * 🎨 PWA Install Prompt - Diseño Premium
 * Un prompt visualmente impactante para instalar la PWA
 */

import { useState, useEffect } from 'react'
import './PWAInstallPrompt.css'

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const shown = sessionStorage.getItem('pwa-prompt-shown')
    if (shown) {
      setHasBeenShown(true)
      return
    }

    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Listener para el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      // Para eventos simulados, tomar el mock del detail
      const promptEvent = e.detail || e
      setDeferredPrompt(promptEvent)
      
      // Mostrar después de 3 segundos para mejor UX (o inmediatamente si es simulado)
      const delay = e.detail ? 500 : 3000 // Delay corto para testing
      setTimeout(() => {
        if (!hasBeenShown) {
          setIsVisible(true)
        }
      }, delay)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [hasBeenShown])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    try {
      // Mostrar el prompt nativo
      const result = await deferredPrompt.prompt()
      
      if (result.outcome === 'accepted') {
        console.log('✅ PWA instalada exitosamente')
        setIsVisible(false)
        sessionStorage.setItem('pwa-installed', 'true')
      } else {
        console.log('❌ Usuario canceló la instalación')
      }
    } catch (error) {
      console.error('Error instalando PWA:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem('pwa-prompt-shown', 'true')
    setHasBeenShown(true)
  }

  const handleLater = () => {
    setIsVisible(false)
    // No guardar en sessionStorage para que aparezca en la próxima sesión
  }

  if (!isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-backdrop" onClick={handleDismiss} />
      
      <div className="pwa-install-card">
        {/* Header con animación */}
        <div className="pwa-header">
          <div className="pwa-icon-container">
            <div className="pwa-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L19 7L14.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12L5 7L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="pwa-sparkles">
              <span className="sparkle sparkle-1">✨</span>
              <span className="sparkle sparkle-2">⭐</span>
              <span className="sparkle sparkle-3">💫</span>
            </div>
          </div>
          
          <h2 className="pwa-title">
            ¡Instala nuestra App!
          </h2>
          
          <p className="pwa-subtitle">
            Acceso instantáneo desde tu pantalla de inicio
          </p>
        </div>

        {/* Beneficios con iconos */}
        <div className="pwa-benefits">
          <div className="benefit-item">
            <div className="benefit-icon">⚡</div>
            <span>Carga ultra rápida</span>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📱</div>
            <span>Funciona offline</span>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🔔</div>
            <span>Notificaciones push</span>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💾</div>
            <span>Sin usar espacio</span>
          </div>
        </div>

        {/* Call to action */}
        <div className="pwa-cta">
          <button 
            className="btn-install" 
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <div className="install-spinner"></div>
                Instalando...
              </>
            ) : (
              <>
                <span className="install-icon">📲</span>
                Instalar Ahora
              </>
            )}
          </button>
          
          <div className="pwa-actions">
            <button className="btn-later" onClick={handleLater}>
              Más tarde
            </button>
            <button className="btn-dismiss" onClick={handleDismiss}>
              No, gracias
            </button>
          </div>
        </div>

        {/* Badge de confianza */}
        <div className="trust-badge">
          <span className="badge-icon">🛡️</span>
          <span>Seguro y confiable</span>
        </div>
      </div>
    </div>
  )
} 