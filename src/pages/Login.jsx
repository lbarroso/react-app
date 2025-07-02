import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { downloadAndCacheClients } from '../utils/client-operations'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje]   = useState('')
  const navigate                = useNavigate()
  const isOnline                = useOnlineStatus()

  const handleLogin = async (e) => {
    e.preventDefault()

    // 1) Autenticación con correo/contraseña.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMensaje(error.message)
      return
    }

    // 2) Una vez logueado, obtenemos el almacén desde nuestra tabla "users"
    const userId = data.user.id
    const { data: perfil, error: errPerfil } = await supabase
      .from('users')
      .select('almcnt')
      .eq('user_id', userId)
      .single()

    if (errPerfil) {
      setMensaje('No se pudo obtener el almacén del usuario.')
      return
    }

    // 3) Guardamos el almcnt dentro de user_metadata del perfil Supabase
    //    para que luego obtenerAlmcnt() lo encuentre ahí.
    await supabase.auth.updateUser({
      data: { almcnt: perfil.almcnt }
    })

    // 4) Descargar y cachear clientes
    await downloadAndCacheClients(perfil.almcnt)

    // 6) Redirigimos al dashboard (el SDK ya persistirá la sesión)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* Izquierda: logo institucional */}
      <div className="bg-primary flex items-center justify-center p-8">
        <img
          src="/logoTdaBienestar.png"
          alt="Logo Tienda Bienestar"
          className="h-24 w-auto"
        />
      </div>

      {/* Derecha: formulario */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          
          {/* Badge de estado de red */}
          <div className="absolute top-4 right-4 bg-secondary text-white text-xs font-medium px-3 py-1 rounded-full">
            {isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
          </div>

          {/* Título */}
          <h2 className="text-2xl font-semibold text-gray-dark mb-4">
            Iniciar sesión
          </h2>

          {/* Única leyenda informativa */}
          <p className="text-sm text-gray-medium mb-6">
            Inicia sesión una vez; tus datos y sesión persisten incluso sin conexión.
          </p>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {mensaje && (
              <div className="bg-red-600 text-white text-sm p-2 rounded">
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-secondary text-white font-semibold py-2 rounded hover:bg-secondary/90 transition"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
