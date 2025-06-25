import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { downloadAndCacheClients } from '../utils/client-operations'
import './login.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje]   = useState('')
  const navigate                = useNavigate()

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
    <div className="main-container">
      <div className="header" />

      <div className="body-container">
        {/* Sección Izquierda: Imagen */}
        <div className="image-container">
          <img src="/logoTdaBienestar.png" alt="Logo Tienda Bienestar" />
        </div>

        {/* Sección Derecha: Formulario */}
        <div className="form-container">
          <h2>Iniciar sesión</h2>
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
            <div className="mb-3">
              <label>Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label>Contraseña</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mensaje && <div className="alert alert-danger">{mensaje}</div>}

            <button type="submit" className="btn btn-primary w-100">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  )
} 