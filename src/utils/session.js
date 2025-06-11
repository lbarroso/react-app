export function guardarSesionExtendida(session, almcnt) {
  const unaSemana = 7 * 24 * 60 * 60
  const ahora = Math.floor(Date.now() / 1000)

  const nuevaSesion = {
    ...session,
    expiraEn7Dias: ahora + unaSemana,
    almcnt: almcnt
  }

  localStorage.setItem('supabaseSession', JSON.stringify(nuevaSesion))
}

export function obtenerAlmcnt() {
  const session = localStorage.getItem('supabaseSession')
  if (!session) return null

  const parsed = JSON.parse(session)
  return parsed.almcnt || null
}

export function cerrarSesion() {
  localStorage.removeItem('supabaseSession')
  window.location.href = '/'
}
