import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const session = localStorage.getItem('supabaseSession')
  if (!session) return <Navigate to="/" />

  const parsed = JSON.parse(session)
  const ahora = Math.floor(Date.now() / 1000)

  // Validamos expiración personalizada de 7 días
  const isValid = parsed.expiraEn7Dias && parsed.expiraEn7Dias > ahora

  return isValid ? children : <Navigate to="/" />
}
