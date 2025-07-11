// src/utils/indexedDBSession.js
// Maneja la persistencia de la sesión Supabase en IndexedDB.
// ───────────────────────────────────────────────────────────

import { getDB } from './getDB'
import { supabase } from '../supabaseClient'

/**
 * Nombre del object-store que contiene exactamente UN registro por usuario.
 * En la migración de getDB.js se creó con:
 *   db.createObjectStore('session_store', { keyPath: 'userId' })
 */
const SESSION_STORE = 'session_store'

/* -------------------------------------------------------------------------- */
/* 1. Guardar (o reemplazar) la sesión del usuario actual                     */
/* -------------------------------------------------------------------------- */
export async function guardarSesionIndexedDB (sesion) {
  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readwrite')

  /**
   * 🔑 keyPath = userId  ⇒  put() sobrescribe la sesión previa del MISMO
   *    usuario sin tocar posibles sesiones de otros usuarios.
   */
  await tx.store.put(sesion)

  await tx.done
}

/* -------------------------------------------------------------------------- */
/* 2. Recuperar la sesión local del usuario actualmente autenticado           */
/*    • Devuelve null si no existe                                            */
/* -------------------------------------------------------------------------- */
export async function obtenerSesionIndexedDB () {
  // Identificamos al usuario conectado por su UID de Supabase Auth
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const userId = session?.user.id
  if (!userId) return null // No hay login activo

  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readonly')

  // Accedemos directamente por su clave primaria
  const sesion = await tx.store.get(userId)

  await tx.done
  return sesion || null
}

/* -------------------------------------------------------------------------- */
/* 3. Borrar SOLO la sesión del usuario que está cerrando sesión              */
/*    (no tocamos otras que pudieran existir en el dispositivo)               */
/* -------------------------------------------------------------------------- */
export async function clearSesionIndexedDB () {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const userId = session?.user.id
  if (!userId) return

  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readwrite')
  await tx.store.delete(userId)
  await tx.done
}
