import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { guardarSesionExtendida } from '../utils/session'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMensaje(error.message)
    } else {
      const userId = data.user.id

      // buscar almcnt desde tabla users
      const { data: perfil, error: errorPerfil } = await supabase
        .from('users')
        .select('almcnt')
        .eq('user_id', userId)
        .single()

      if (errorPerfil) {
        setMensaje('No se pudo obtener el almacén del usuario.')
      } else {
        guardarSesionExtendida(data.session, perfil.almcnt)
        //navigate('/dashboard')
		navigate('/dashboard', { replace: true })
      }
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Iniciar sesión</button>
      <p>{mensaje}</p>
    </form>
  )
}
