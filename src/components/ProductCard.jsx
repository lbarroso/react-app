// components/ProductCard.jsx
import useOnlineStatus from '../utils/useOnlineStatus';
import QuantitySelector from './QuantitySelector';

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

      {/* Controles de cantidad con nuevo QuantitySelector */}
      <QuantitySelector
        producto={producto}
        cantidadEnCarrito={cantidad}
        onAgregarAlCarrito={(prod, totalPiezas) => agregarAlCarrito(prod, totalPiezas)}
        onAumentarCantidad={aumentarCantidad}
        onDisminuirCantidad={disminuirCantidad}
      />
    </div>
  );
}
