import { getDB } from './getDB'

const PRODUCTOS_STORE = 'productos'
const CARRITO_STORE = 'carrito_items'

export async function guardarProductos(productos) {
  const db = await getDB()
  const tx = db.transaction(PRODUCTOS_STORE, 'readwrite')
  const store = tx.objectStore(PRODUCTOS_STORE)
  for (const producto of productos) {
    await store.put(producto)
  }
  await tx.done
}

export async function obtenerProductosLocal() {
  const db = await getDB()
  return await db.getAll(PRODUCTOS_STORE)
}

export async function limpiarProductos() {
  const db = await getDB()
  const tx = db.transaction(PRODUCTOS_STORE, 'readwrite')
  await tx.objectStore(PRODUCTOS_STORE).clear()
  await tx.done
}

/**
 * Agrega un item al carrito con cantidad específica en piezas
 * @param {number} product_id - ID del producto
 * @param {number} quantity - Cantidad SIEMPRE en piezas (nunca en unidades)
 * @param {number} unit_price - Precio unitario del producto
 */
export async function agregarItemAlCarrito(product_id, quantity, unit_price) {
  // Validaciones de entrada
  if (!product_id || quantity <= 0 || unit_price < 0) {
    throw new Error('Parámetros inválidos para agregar item al carrito');
  }

  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  
  // Verificar si el item ya existe en el carrito
  const existingItem = await store.get(product_id);
  
  const total_price = unit_price * quantity;
  
  if (existingItem) {
    // Si existe, sumar a la cantidad existente
    existingItem.quantity += quantity;
    existingItem.total_price = existingItem.unit_price * existingItem.quantity;
    existingItem.updated_at = Date.now();
    await store.put(existingItem);
  } else {
    // Si no existe, crear nuevo item
    await store.put({
      product_id,
      quantity, // Siempre en piezas
      unit_price,
      total_price,
      status: 0,
      added_at: Date.now(),
      updated_at: Date.now()
    });
  }
  
  await tx.done
}

export async function obtenerProductosDelCarrito() {
  const db = await getDB()
  return await db.getAll(CARRITO_STORE)
}

export async function actualizarCantidadEnCarrito(product_id, quantity) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  const store = tx.objectStore(CARRITO_STORE)
  const item = await store.get(product_id)
  if (!item) return
  item.quantity = quantity
  item.total_price = quantity * item.unit_price
  await store.put(item)
  await tx.done
}

export async function eliminarItemDelCarrito(product_id) {
  const db = await getDB()
  const tx = db.transaction(CARRITO_STORE, 'readwrite')
  await tx.objectStore(CARRITO_STORE).delete(product_id)
  await tx.done
}

export async function obtenerItemDelCarrito(product_id) {
  const db = await getDB()
  return await db.get(CARRITO_STORE, product_id)
}
