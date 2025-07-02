
// src/pages/ConfigPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerAlmcnt, cerrarSesion } from '../utils/session'

export default function ConfigPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    syncInterval: 60,
    autoSync: true,
    syncOnReconnect: true,
    theme: 'light',
    language: 'es',
    itemsPerPage: 20,
    almcnt: null,
    userId: null,
    maxRetries: 3,
    offlineTimeout: 5000,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const userAlmcnt = await obtenerAlmcnt()
      const saved = localStorage.getItem('app-settings')
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved), almcnt: userAlmcnt }))
      } else {
        setSettings(prev => ({ ...prev, almcnt: userAlmcnt }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      const { almcnt, userId, ...toSave } = settings
      localStorage.setItem('app-settings', JSON.stringify(toSave))
      setSaveMessage('✅ Configuraciones guardadas')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('❌ Error al guardar')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('¿Restablecer configuraciones por defecto?')) {
      setSettings(prev => ({ ...prev, syncInterval: 60, autoSync: true, syncOnReconnect: true, theme: 'light', language: 'es', itemsPerPage: 20, maxRetries: 3, offlineTimeout: 5000 }))
      setSaveMessage('🔄 Valores restablecidos')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleClearData = () => {
    if (confirm('⚠️ Esto eliminará TODOS los datos locales. Continuar?')) {
      indexedDB.deleteDatabase('PedidosDB')
      localStorage.clear()
      sessionStorage.clear()
      alert('✅ Datos eliminados. Recargando...')
      window.location.reload()
    }
  }

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      cerrarSesion()
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="flex items-center bg-primary text-white px-4 py-3 shadow-md">
          <button onClick={() => navigate('/dashboard')} className="mr-4 text-lg">🏠</button>
          <h1 className="text-lg font-semibold">⚙️ Configuraciones</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span>Cargando configuraciones...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary text-white px-4 py-3 shadow-md">
        <button onClick={() => navigate('/dashboard')} className="text-lg">🏠</button>
        <h1 className="text-lg font-semibold">⚙️ Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1 bg-gray-200 bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm">🔄 Restablecer</button>
          <button onClick={handleSave} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm" disabled={isSaving}>
            {isSaving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 space-y-6">
        {saveMessage && (
          <div className="text-center text-sm text-green-700">{saveMessage}</div>
        )}

        {/* Información de Usuario */}
        <section className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="text-base font-medium">👤 Usuario</h2>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Almacén</label>
            <input type="text" value={settings.almcnt || ''} disabled className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100" />
            
          </div>
        </section>

        {/* Sincronización */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 className="text-base font-medium">🔄 Sincronización</h2>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.autoSync} onChange={e => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))} />
              Sincronización automática
            </label>
            <small className="text-xs text-gray-500">auto al reconectar</small>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Intervalo (s)</label>
            <input type="number" min="30" max="300" value={settings.syncInterval} onChange={e => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 60 }))} disabled={!settings.autoSync} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.syncOnReconnect} onChange={e => setSettings(prev => ({ ...prev, syncOnReconnect: e.target.checked }))} />
            Sincronizar al reconectar
          </label>
        </section>

        {/* Interfaz */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 className="text-base font-medium">🎨 Interfaz</h2>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Tema</label>
            <select value={settings.theme} onChange={e => setSettings(prev => ({ ...prev, theme: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Idioma</label>
            <select value={settings.language} onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Items por página</label>
            <select value={settings.itemsPerPage} onChange={e => setSettings(prev => ({ ...prev, itemsPerPage: parseInt(e.target.value) }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </section>

        {/* Avanzadas */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 className="text-base font-medium">⚡ Avanzadas</h2>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Max reintentos</label>
            <input type="number" min="1" max="10" value={settings.maxRetries} onChange={e => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Timeout offline (ms)</label>
            <input type="number" min="1000" max="30000" step="1000" value={settings.offlineTimeout} onChange={e => setSettings(prev => ({ ...prev, offlineTimeout: parseInt(e.target.value) || 5000 }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
        </section>

        {/* Zona de peligro */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4 border border-red-400">
          <h2 className="text-base font-medium text-red-600">⚠️ Zona de Peligro</h2>
          <button onClick={handleClearData} className="w-full bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2 text-sm font-semibold transition">
            🗑️ Limpiar todos los datos locales
          </button>
          <button onClick={handleLogout} className="w-full border border-red-600 hover:bg-red-100 text-red-600 rounded px-3 py-2 text-sm font-semibold transition">
            🚪 Cerrar sesión
          </button>
        </section>
      </main>
    </div>
  )
}

