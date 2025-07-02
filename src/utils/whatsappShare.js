/**
 * Utilidades para compartir pedidos por WhatsApp
 */

/**
 * Formatea un pedido para compartir por WhatsApp
 * @param {Object} pedido - Datos del pedido
 * @param {Array} items - Items del pedido (opcional, para detalle completo)
 * @returns {string} Mensaje formateado para WhatsApp
 */
export function formatPedidoForWhatsApp(pedido, items = null) {
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let mensaje = `🛒 *PEDIDO #${pedido.id}*\n\n`;
  mensaje += `👤 *Cliente:* ${pedido.ctename}\n`;
  mensaje += `📅 *Fecha:* ${fecha}\n`;
  mensaje += `🏪 *Almacén:* ${pedido.almcnt}\n`;
  mensaje += `💰 *Total:* $${pedido.total_amount?.toFixed(2) || '0.00'}\n`;
  
  // Status del pedido
  const statusText = pedido.status === 'pending' ? '🕓 Pendiente' : '✅ Procesado';
  mensaje += `📊 *Estado:* ${statusText}\n`;

  // Si hay notas, agregarlas
  if (pedido.notes && pedido.notes.trim()) {
    mensaje += `📝 *Notas:* ${pedido.notes}\n`;
  }

  // Si se proporcionan items, mostrar el detalle
  if (items && items.length > 0) {
    mensaje += `\n🛍️ *PRODUCTOS:*\n`;
    items.forEach((item, index) => {
      mensaje += `${index + 1}. *${item.product_name}*\n`;
      
      // Agregar código del producto si existe
      if (item.product_code) {
        mensaje += `   🏷️ Código: ${item.product_code}\n`;
      }
      
      mensaje += `   📦 Cantidad: ${item.quantity}\n`;
      mensaje += `   💵 Precio: $${item.unit_price?.toFixed(2) || '0.00'}\n`;
      mensaje += `   💰 Subtotal: $${item.total_price?.toFixed(2) || '0.00'}\n`;
      
      // Agregar unidad de medida si existe
      if (item.unit_type) {
        mensaje += `   📏 Unidad: ${item.unit_type}\n`;
      }
      
      mensaje += `\n`;
    });
    
    // Agregar resumen de cantidad de productos
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    mensaje += `📊 *RESUMEN:*\n`;
         mensaje += `   🛒 Total productos: ${items.length}\n`;
     mensaje += `   📦 Total unidades: ${totalItems}\n`;
     mensaje += `   💰 Total pedido: $${pedido.total_amount?.toFixed(2) || '0.00'}\n`;
   } else if (items && items.length === 0) {
     mensaje += `\n🛍️ *PRODUCTOS:*\n`;
     mensaje += `   ℹ️ Este pedido no tiene productos registrados\n`;
   } else {
     mensaje += `\n🛍️ *PRODUCTOS:*\n`;
     mensaje += `   📄 Detalle de productos disponible en el sistema\n`;
   }

   mensaje += `\n📱 Enviado desde Sistema de Pedidos PWA`;

  return mensaje;
}

/**
 * Genera un enlace de WhatsApp con el mensaje del pedido
 * @param {Object} pedido - Datos del pedido
 * @param {Array} items - Items del pedido (opcional)
 * @param {string} phoneNumber - Número de teléfono (opcional)
 * @returns {string} URL de WhatsApp
 */
export function generateWhatsAppLink(pedido, items = null, phoneNumber = '') {
  const mensaje = formatPedidoForWhatsApp(pedido, items);
  const encodedMessage = encodeURIComponent(mensaje);
  
  if (phoneNumber && phoneNumber.trim()) {
    // Limpiar el número de teléfono (solo números)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  } else {
    // Solo abrir WhatsApp con el mensaje
    return `https://wa.me/?text=${encodedMessage}`;
  }
}

/**
 * Comparte un pedido por WhatsApp
 * @param {Object} pedido - Datos del pedido
 * @param {Array} items - Items del pedido (opcional)
 * @param {string} phoneNumber - Número de teléfono (opcional)
 */
export function shareViaWhatsApp(pedido, items = null, phoneNumber = '') {
  const whatsappUrl = generateWhatsAppLink(pedido, items, phoneNumber);
  
  // Abrir en una nueva ventana/pestaña
  window.open(whatsappUrl, '_blank');
}

/**
 * Copia el mensaje del pedido al portapapeles
 * @param {Object} pedido - Datos del pedido
 * @param {Array} items - Items del pedido (opcional)
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export async function copyPedidoToClipboard(pedido, items = null) {
  try {
    const mensaje = formatPedidoForWhatsApp(pedido, items);
    await navigator.clipboard.writeText(mensaje);
    return true;
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return false;
  }
} 