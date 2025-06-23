// components/ProductCard.jsx
import useOnlineStatus from '../utils/useOnlineStatus';

export default function ProductCard({
  producto,
  cantidad,
  agregarAlCarrito,
  aumentarCantidad,
  disminuirCantidad,
}) {

  const online = useOnlineStatus();

  const imagen = online
    ? `/imagenes/${producto.image || 'imagen.jpg'}`
    : '/imagenes/imagen.jpg'; // imagen por defecto offline

  return (
    <div className="product-card">
      {/* Imagen */}
      <div className="product-image">
        <img
          src={imagen}
          alt={producto.name}
          className="product-image"
          loading="lazy"
          onError={(e) => { e.target.src = '/imagenes/imagen.jpg'; }}
          style={{ backgroundColor: '#f4f4f4' }}   /* efecto de fondo opcional */
        />
        {producto.stock <= 0 && <div className="stock-badge">Sin Stock</div>}
      </div>

      {/* Nombre */}
      <div className="product-name">
        {producto.name?.length > 30
          ? producto.name.slice(0, 30) + '…'
          : producto.name}
      </div>

      {/* Unidad + código */}
      <div className="product-code">
        {producto.unit} {producto.code}
      </div>

      {/* Precio */}
      <div className="product-price">
        ${parseFloat(producto.price).toFixed(2)}
      </div>

      {/* Stock */}
      <div className="product-stock">
        {producto.stock} disponibles
      </div>

      {/* Controles de cantidad */}
      {cantidad > 0 ? (
        <div className="cantidad-control">
          <button onClick={() => disminuirCantidad(producto)}>−</button>
          <span>{cantidad}</span>
          <button onClick={() => aumentarCantidad(producto)}>＋</button>
        </div>
      ) : (
        <button
          className="add-to-cart"
          onClick={() => agregarAlCarrito(producto)}
          disabled={producto.stock <= 0}
        >
          {producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
        </button>
      )}
    </div>
  );
}
