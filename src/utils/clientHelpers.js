/**
 * HELPERS PARA CLIENTES - Manejo del nuevo campo ID
 * Funciones para trabajar con clientes que incluyen el ID de Supabase
 */

import { findClientByCode } from './indexedDB'

/**
 * Obtiene el ID de Supabase de un cliente seleccionado
 * @param {Object} cliente - Cliente seleccionado
 * @returns {number|null} ID de Supabase o null si no existe
 */
export function getClientSupabaseId(cliente) {
  if (!cliente || typeof cliente !== 'object') {
    console.warn('getClientSupabaseId: Cliente inválido', cliente)
    return null
  }

  // Verificar si ya tiene el ID
  if (cliente.id && typeof cliente.id === 'number') {
    return cliente.id
  }

  console.warn('getClientSupabaseId: Cliente sin ID de Supabase', cliente)
  return null
}

/**
 * Busca un cliente y devuelve su ID de Supabase
 * @param {number} almcnt - Código del almacén
 * @param {number} ctecve - Código del cliente
 * @returns {Promise<number|null>} ID de Supabase o null
 */
export async function findClientSupabaseId(almcnt, ctecve) {
  try {
    const cliente = await findClientByCode(almcnt, ctecve)
    return getClientSupabaseId(cliente)
  } catch (error) {
    console.error('Error buscando ID de cliente:', error)
    return null
  }
}

/**
 * Valida que un cliente tenga todos los campos requeridos incluido el ID
 * @param {Object} cliente - Cliente a validar
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateClientStructure(cliente) {
  const errors = []

  if (!cliente || typeof cliente !== 'object') {
    errors.push('Cliente debe ser un objeto')
    return { isValid: false, errors }
  }

  // Validar campos requeridos
  if (!cliente.id || typeof cliente.id !== 'number') {
    errors.push('Campo id (ID de Supabase) es requerido')
  }

  if (!cliente.almcnt || typeof cliente.almcnt !== 'number') {
    errors.push('Campo almcnt es requerido')
  }

  if (!cliente.ctecve || typeof cliente.ctecve !== 'number') {
    errors.push('Campo ctecve es requerido')
  }

  if (!cliente.name || typeof cliente.name !== 'string') {
    errors.push('Campo name es requerido')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Convierte un cliente a un objeto listo para usar en pedidos
 * @param {Object} cliente - Cliente desde IndexedDB
 * @returns {Object|null} Objeto para usar en pedido o null si inválido
 */
export function prepareClientForOrder(cliente) {
  const validation = validateClientStructure(cliente)
  
  if (!validation.isValid) {
    console.error('Cliente inválido para pedido:', validation.errors)
    return null
  }

  return {
    customer_id: cliente.id,     // ⭐ ID de Supabase para la relación
    almcnt: cliente.almcnt,
    ctecve: cliente.ctecve,
    name: cliente.name
  }
}

/**
 * Debug: Muestra información de un cliente
 * @param {Object} cliente - Cliente a inspeccionar
 */
export function debugClientInfo(cliente) {
  console.log('🔍 DEBUG - Información del cliente:')
  console.log('📋 Cliente completo:', cliente)
  
  const validation = validateClientStructure(cliente)
  console.log('✅ Validación:', validation)
  
  const supabaseId = getClientSupabaseId(cliente)
  console.log('🆔 ID de Supabase:', supabaseId)
  
  const prepared = prepareClientForOrder(cliente)
  console.log('📦 Preparado para pedido:', prepared)
} 