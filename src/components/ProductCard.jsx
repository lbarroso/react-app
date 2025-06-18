// components/ProductCard.jsx
import './ProductCard.css'
import 'react-bootstrap';

export default function ProductCard({ producto, cantidad, agregarAlCarrito, aumentarCantidad, disminuirCantidad }) {
  return (
    <div className="product-card">
      <img
        src={`/imagenes/${producto.imagen || 'imagen.jpg'}`}
        alt={producto.name}
        className="product-image"
        loading="lazy"
        onError={(e) => {
          e.target.src = '/imagenes/imagen.jpg'
        }}
      />
      <div className="product-name">{producto.name}</div>
      <div className="product-code"> {producto.unit} {producto.code} </div>
      <div className="product-price">${parseFloat(producto.price).toFixed(2)}</div>
      <div className="product-stock">{producto.stock} disponibles</div>

      {cantidad > 0 ? (
        <div className="cantidad-control">
          <button onClick={() => disminuirCantidad(producto)}>-</button>
          <span>{cantidad}</span>
          <button onClick={() => aumentarCantidad(producto)}>+</button>
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
  )
}
