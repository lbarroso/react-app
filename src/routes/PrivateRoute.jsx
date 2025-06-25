// src/routes/PrivateRoute.jsx

import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isAuthenticated } from '../utils/auth'

/**
 * PrivateRoute
 * Envuelve rutas que requieren usuario logueado.
 * Mientras verifica la sesión muestra null (o un loader),
 * una vez resuelto redirige si no hay sesión viva.
 */
export default function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    // Consulta al SDK si existe sesión (incluye refresh automático)
    isAuthenticated()
      .then(auth => {
        setAllowed(auth)
      })
      .catch(() => {
        setAllowed(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    // Aquí podrías retornar un spinner, placeholder, etc.
    return null
  }

  // Si no está permitido, redirige al login
  return allowed
    ? children
    : <Navigate to="/" replace />
}

