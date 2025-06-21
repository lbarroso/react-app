import { getDB } from './getDB'

const SESSION_STORE = 'session_store'

export async function guardarSesionIndexedDB(sesion) {
  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readwrite')
  await tx.objectStore(SESSION_STORE).put(sesion)
  await tx.done
}

export async function obtenerSesionIndexedDB() {
  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readonly')
  const all = await tx.objectStore(SESSION_STORE).getAll()
  await tx.done
  return all.length > 0 ? all[0] : null
}

export async function clearSesionIndexedDB() {
  const db = await getDB()
  const tx = db.transaction(SESSION_STORE, 'readwrite')
  await tx.objectStore(SESSION_STORE).clear()
  await tx.done
}
