// src/utils/auth.js

import { supabase } from '../supabaseClient'

/**
 * isAuthenticated
 * Verifica si hay una sesión activa en Supabase.
 * Se basa en getSession() del SDK, que ya se encarga
 * de rehidratar el access_token (usando el refresh token).
 *
 * @returns {Promise<boolean>} true si hay sesión, false en caso contrario
 */
export async function isAuthenticated() {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Si session es null, no hay usuario logueado
  return !!session
}
