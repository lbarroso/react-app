import AppRouter from './routes/Router'
import useSyncPedidos from './hooks/useSyncPedidos'
import PWAInstallPrompt from './components/PWAInstallPrompt'


// 🧪 MODO DESARROLLADOR: Importar herramientas de prueba
import './utils/testSyncFields'
import './utils/reloadClientsWithId'
import './utils/fixOldPedidos' // Importar funciones de reparación para DevTools
import './utils/testMarkProcessed' // Importar funciones de testing para markPedidoProcessed
import './utils/testOrderDetail' // Importar funciones de testing para detalle de pedidos
import './utils/testImmediateSync' // Importar funciones de testing para sincronización inmediata
import './utils/debugSyncState' // Importar funciones de debug para window.syncState
import './utils/testPWAPrompt' // Importar funciones de testing para PWA prompt

export default function App() {
  // FASE 2: Hook de sincronización automática
  const syncState = useSyncPedidos()
  
  // 🌐 Exponer syncState globalmente para uso en componentes
  if (typeof window !== 'undefined') {
    window.syncState = syncState
  }
  
  return (
    <>
      <AppRouter />
      <PWAInstallPrompt />
    </>
  )
}
