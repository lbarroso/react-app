/**
 * MAPEO DE CAMPOS - LOCAL vs SUPABASE
 * Mapea la estructura de datos local de IndexedDB con la estructura de Supabase
 */

/**
 * Estructura de tu tabla ORDERS en Supabase:
 * - id (int8)
 * - customer_id (int8) 
 * - status (varchar)
 * - total_amount (numeric)
 * - order_date (timestamp)
 * - sync_date (timestamp)
 * - notes (text)
 * - is_synced (bool)
 * - almcnt (int4)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 * - user_id (uuid)
 */

/**
 * Estructura de tu tabla ORDER_ITEMS en Supabase:
 * - id (int8)
 * - order_id (int8)
 * - product_id (int8)
 * - quantity (int4)
 * - unit_price (numeric)
 * - total_price (numeric)
 * - notes (text)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 */

/**
 * Convierte un pedido local al formato requerido por Supabase
 * @param {object} localPedido - Pedido desde IndexedDB
 * @param {string} userId - UUID del usuario autenticado
 * @returns {object} Objeto listo para insertar en tabla 'orders'
 */
export function mapPedidoToSupabase(localPedido, userId) {
  // Extraer campos que NO van a Supabase
  const { 
    id,           // Se genera automáticamente en Supabase
    status,       // Local puede diferir del remoto
    sync_status,  // Campo solo local
    synced_at,    // Campo solo local
    remote_id,    // Campo solo local
    updated_at,   // Se maneja automáticamente en Supabase
    ...cleanData 
  } = localPedido

  return {
    // Campos mapeados directamente
    customer_id: localPedido.customer_id || null,  // ⭐ IMPORTANTE: Debe contener el ID de Supabase del cliente
    total_amount: localPedido.total_amount || 0,
    notes: localPedido.notes || '',
    almcnt: localPedido.almcnt || null,
    
    // Campos con valores por defecto
    status: 'pending',                                    // Siempre pending inicialmente
    order_date: new Date(localPedido.created_at).toISOString(),
    sync_date: new Date().toISOString(),
    is_synced: true,
    user_id: userId,
    created_at: new Date(localPedido.created_at).toISOString()
  }
}

/**
 * Convierte items locales al formato requerido por Supabase
 * @param {Array} localItems - Items desde IndexedDB
 * @param {number} remoteOrderId - ID del pedido en Supabase
 * @returns {Array} Items listos para insertar en tabla 'order_items'
 */
export function mapItemsToSupabase(localItems, remoteOrderId) {
  return localItems.map(item => {
    // Extraer campos que NO van a Supabase
    const { 
      id,           // Se genera automáticamente en Supabase
      pedido_id,    // Se reemplaza por order_id
      product_name, // NO está en tu tabla Supabase
      product_code, // NO está en tu tabla Supabase
      updated_at,   // Se maneja automáticamente en Supabase
      ...cleanItem 
    } = item

    return {
      order_id: remoteOrderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      notes: '', // Supabase tiene este campo pero local no lo usa
      created_at: new Date(item.created_at).toISOString()
    }
  })
}

/**
 * Valida que un pedido local tenga los campos mínimos requeridos
 * @param {object} pedido - Pedido desde IndexedDB  
 * @returns {object} { isValid: boolean, errors: string[] }
 */
export function validatePedidoForSync(pedido) {
  const errors = []

  // Validaciones requeridas
  if (!pedido.customer_id || typeof pedido.customer_id !== 'number') {
    errors.push('customer_id es requerido y debe ser el ID de Supabase del cliente')
  }

  if (!pedido.total_amount || pedido.total_amount <= 0) {
    errors.push('total_amount debe ser mayor a 0')
  }

  if (!pedido.almcnt) {
    errors.push('almcnt es requerido')
  }

  if (!pedido.items || !Array.isArray(pedido.items) || pedido.items.length === 0) {
    errors.push('pedido debe tener al menos un item')
  }

  // Validar items si existen
  if (pedido.items && Array.isArray(pedido.items)) {
    pedido.items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: product_id es requerido`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: quantity debe ser mayor a 0`)
      }
      if (!item.unit_price || item.unit_price <= 0) {
        errors.push(`Item ${index + 1}: unit_price debe ser mayor a 0`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Debug: Compara estructura local vs lo que se envía a Supabase
 * @param {object} localPedido - Pedido desde IndexedDB
 * @param {string} userId - UUID del usuario
 */
export function debugFieldMapping(localPedido, userId) {
  console.log('🔍 DEBUG - Comparación de campos LOCAL vs SUPABASE:')
  console.log('📋 Pedido local:', localPedido)
  
  // ⭐ VERIFICAR MAPEO ESPECÍFICO DE CUSTOMER_ID
  console.log('🆔 MAPEO CUSTOMER_ID:')
  console.log(`   IndexedDB pedido.customer_id: ${localPedido.customer_id} (${typeof localPedido.customer_id})`)
  
  const supabasePedido = mapPedidoToSupabase(localPedido, userId)
  console.log(`   Supabase orders.customer_id: ${supabasePedido.customer_id} (${typeof supabasePedido.customer_id})`)
  console.log('📤 Pedido COMPLETO para Supabase:', supabasePedido)
  
  if (localPedido.items && localPedido.items.length > 0) {
    console.log('📋 Items locales:', localPedido.items)
    const supabaseItems = mapItemsToSupabase(localPedido.items, 999) // ID temporal
    console.log('📤 Items para Supabase:', supabaseItems)
  }
  
  const validation = validatePedidoForSync(localPedido)
  console.log('✅ Validación:', validation)
  
  // ⭐ VERIFICACIÓN FINAL
  if (localPedido.customer_id === supabasePedido.customer_id) {
    console.log('✅ CUSTOMER_ID MAPEO CORRECTO: IndexedDB → Supabase')
  } else {
    console.log('❌ CUSTOMER_ID MAPEO INCORRECTO')
  }
} 