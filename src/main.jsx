import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';
import './index.css'    // o el nombre que uses para tu CSS global con Tailwind
import { registerSW } from 'virtual:pwa-register'

// Registrar Service Worker para caché de imágenes y PWA
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
