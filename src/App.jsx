import AppRouter from './routes/Router'
import useSyncPedidos from './hooks/useSyncPedidos'
// FASE 3: Testing functions
import './utils/test-fase3'
// FASE 4: Design System
import './css/design-system.css'
import './utils/test-fase4'
// FASE 5: Manual Testing
import './utils/test-fase5-manual'
import './utils/test-fase5-visual'
import './utils/test-fase5-devtools-guide'
import './utils/test-fase5-integrity'

export default function App() {
  // FASE 2: Hook de sincronización automática
  const syncState = useSyncPedidos()
  
  // DEBUG: Exponer estado de sync en window para desarrollo
  if (typeof window !== 'undefined') {
    window.syncState = syncState
  }
  
  return <AppRouter />
}
