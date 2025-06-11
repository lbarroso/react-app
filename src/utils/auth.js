export function isAuthenticated() {
    const session = localStorage.getItem('supabaseSession')
    if (!session) return false
  
    const parsed = JSON.parse(session)
    const now = Math.floor(Date.now() / 1000)
    return parsed.expires_at && parsed.expires_at > now
  }
  