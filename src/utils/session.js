import { supabase } from '../supabaseClient'
import {
  obtenerSesionIndexedDB,
  guardarSesionIndexedDB,
  clearSesionIndexedDB
} from './indexedDBSession'

export function guardarSesionExtendida(session, almcnt) {
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000)
  const record = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name || '',
    almcnt,
    expiresAt
  }
  guardarSesionIndexedDB(record)
}

export async function obtenerAlmcnt() {
  const sesionLocal = await obtenerSesionIndexedDB()
  if (sesionLocal?.almcnt) return sesionLocal.almcnt

  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.user_metadata?.almcnt ?? null
}

export async function obtenerNombreUsuario() {
  const sesionLocal = await obtenerSesionIndexedDB()
  if (sesionLocal?.name) return sesionLocal.name

  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.user_metadata?.name || session?.user.email || 'Usuario'
}

export async function cerrarSesion() {
  await clearSesionIndexedDB()
  await supabase.auth.signOut()
  window.location.href = '/'
}
