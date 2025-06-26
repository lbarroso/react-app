/**
 * FASE 4 - Página de Configuraciones
 * Settings del sistema y usuario con navegación home
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerAlmcnt, cerrarSesion } from '../utils/session'
import '../css/design-system.css'
import './ConfigPage.css'

export default function ConfigPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    // Configuraciones de sync
    syncInterval: 60, // segundos
    autoSync: true,
    syncOnReconnect: true,
    
    // Configuraciones de UI
    theme: 'light',
    language: 'es',
    itemsPerPage: 20,
    
    // Configuraciones de usuario
    almcnt: null,
    userId: null,
    
    // Configuraciones avanzadas
    maxRetries: 3,
    offlineTimeout: 5000
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  /**
   * Cargar configuraciones al montar
   */
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Cargar almcnt del usuario
      const userAlmcnt = await obtenerAlmcnt()
      
      // Cargar configuraciones desde localStorage
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed, almcnt: userAlmcnt }))
      } else {
        setSettings(prev => ({ ...prev, almcnt: userAlmcnt }))
      }
      
    } catch (error) {
      console.error('Error cargando configuraciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Guardar configuraciones
   */
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      // Guardar en localStorage
      const { almcnt, userId, ...settingsToSave } = settings
      localStorage.setItem('app-settings', JSON.stringify(settingsToSave))
      
      setSaveMessage('✅ Configuraciones guardadas')
      setTimeout(() => setSaveMessage(''), 3000)
      
    } catch (error) {
      console.error('Error guardando configuraciones:', error)
      setSaveMessage('❌ Error al guardar')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Restablecer configuraciones por defecto
   */
  const handleReset = () => {
    if (confirm('¿Estás seguro de restablecer todas las configuraciones por defecto?')) {
      const currentAlmcnt = settings.almcnt
      setSettings({
        syncInterval: 60,
        autoSync: true,
        syncOnReconnect: true,
        theme: 'light',
        language: 'es',
        itemsPerPage: 20,
        almcnt: currentAlmcnt,
        userId: null,
        maxRetries: 3,
        offlineTimeout: 5000
      })
      setSaveMessage('🔄 Configuraciones restablecidas (recuerda guardar)')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  /**
   * Limpiar datos locales
   */
  const handleClearData = () => {
    if (confirm('⚠️ CUIDADO: Esto eliminará TODOS los datos locales (pedidos, carrito, productos). ¿Continuar?')) {
      if (confirm('🚨 Esta acción NO se puede deshacer. ¿Estás completamente seguro?')) {
        // Limpiar IndexedDB y localStorage
        indexedDB.deleteDatabase('PedidosDB')
        localStorage.clear()
        sessionStorage.clear()
        
        alert('✅ Datos locales eliminados. La app se reiniciará.')
        window.location.reload()
      }
    }
  }

  /**
   * Cerrar sesión
   */
  const handleLogout = () => {
    if (confirm('¿Cerrar sesión y volver al login?')) {
      cerrarSesion()
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="config-page">
        <div className="nav-header">
          <h1 className="nav-title">⚙️ Configuraciones</h1>
        </div>
        <div className="container">
          <div className="flex justify-center items-center" style={{minHeight: '200px'}}>
            <div>Cargando configuraciones...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="config-page">
      {/* Header con navegación */}
      <div className="nav-header">
        <div className="flex items-center gap-md">
          <button 
            className="back-btn home-btn"
            onClick={() => navigate('/dashboard')}
          >
            🏠 Dashboard
          </button>
          <h1 className="nav-title">⚙️ Configuraciones</h1>
        </div>
        
        <div className="nav-actions">
          <button 
            className="btn btn-ghost"
            onClick={handleReset}
          >
            🔄 Restablecer
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>

      <div className="container">
        {/* Mensaje de guardado */}
        {saveMessage && (
          <div className="save-message">
            {saveMessage}
          </div>
        )}

        <div className="config-sections">
          {/* Información del Usuario */}
          <section className="config-section">
            <h2 className="section-title">👤 Información del Usuario</h2>
            <div className="card">
              <div className="card-padding">
                <div className="form-group">
                  <label>Almacén Asignado</label>
                  <input 
                    type="text" 
                    value={settings.almcnt || 'No asignado'} 
                    disabled 
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label>ID de Usuario</label>
                  <input 
                    type="text" 
                    value={settings.userId || 'No definido'} 
                    disabled 
                    className="input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Configuraciones de Sincronización */}
          <section className="config-section">
            <h2 className="section-title">🔄 Sincronización</h2>
            <div className="card">
              <div className="card-padding stack stack-lg">
                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.autoSync}
                      onChange={(e) => setSettings(prev => ({...prev, autoSync: e.target.checked}))}
                    />
                    Sincronización automática
                  </label>
                  <small>Sincronizar pedidos automáticamente cuando esté online</small>
                </div>
                
                <div className="form-group">
                  <label>Intervalo de sincronización (segundos)</label>
                  <input 
                    type="number" 
                    min="30" 
                    max="300" 
                    value={settings.syncInterval}
                    onChange={(e) => setSettings(prev => ({...prev, syncInterval: parseInt(e.target.value) || 60}))}
                    className="input"
                    disabled={!settings.autoSync}
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.syncOnReconnect}
                      onChange={(e) => setSettings(prev => ({...prev, syncOnReconnect: e.target.checked}))}
                    />
                    Sincronizar al reconectarse
                  </label>
                  <small>Sincronizar inmediatamente al recuperar conexión</small>
                </div>
              </div>
            </div>
          </section>

          {/* Configuraciones de Interfaz */}
          <section className="config-section">
            <h2 className="section-title">🎨 Interfaz de Usuario</h2>
            <div className="card">
              <div className="card-padding stack stack-lg">
                <div className="form-group">
                  <label>Tema</label>
                  <select 
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({...prev, theme: e.target.value}))}
                    className="input"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Idioma</label>
                  <select 
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({...prev, language: e.target.value}))}
                    className="input"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Elementos por página</label>
                  <select 
                    value={settings.itemsPerPage}
                    onChange={(e) => setSettings(prev => ({...prev, itemsPerPage: parseInt(e.target.value)}))}
                    className="input"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Configuraciones Avanzadas */}
          <section className="config-section">
            <h2 className="section-title">⚡ Configuraciones Avanzadas</h2>
            <div className="card">
              <div className="card-padding stack stack-lg">
                <div className="form-group">
                  <label>Máximo reintentos de sync</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={settings.maxRetries}
                    onChange={(e) => setSettings(prev => ({...prev, maxRetries: parseInt(e.target.value) || 3}))}
                    className="input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Timeout offline (ms)</label>
                  <input 
                    type="number" 
                    min="1000" 
                    max="30000" 
                    step="1000"
                    value={settings.offlineTimeout}
                    onChange={(e) => setSettings(prev => ({...prev, offlineTimeout: parseInt(e.target.value) || 5000}))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Zona de Peligro */}
          <section className="config-section">
            <h2 className="section-title">⚠️ Zona de Peligro</h2>
            <div className="card" style={{borderColor: 'var(--error-color)'}}>
              <div className="card-padding stack stack-lg">
                <div className="danger-actions">
                  <button 
                    className="btn"
                    style={{backgroundColor: 'var(--error-color)', color: 'white'}}
                    onClick={handleClearData}
                  >
                    🗑️ Limpiar Todos los Datos Locales
                  </button>
                  <small>Elimina pedidos, carrito, productos y configuraciones</small>
                </div>
                
                <div className="danger-actions">
                  <button 
                    className="btn btn-outline"
                    style={{borderColor: 'var(--error-color)', color: 'var(--error-color)'}}
                    onClick={handleLogout}
                  >
                    🚪 Cerrar Sesión
                  </button>
                  <small>Regresa a la pantalla de login</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 