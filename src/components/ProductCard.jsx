// components/ProductCard.jsx
import QuantitySelector from './QuantitySelector';
import { getProductImageSrc } from '../utils/getProductImage';

export default function ProductCard({
  producto,
  cantidad,
  agregarAlCarrito,
  aumentarCantidad,
  disminuirCantidad,
}) {

  const src = getProductImageSrc(producto.image);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
      {/* Imagen */}
      <div className="relative">
        <img
          src={src}
          alt={producto.name}
          className="product-image"
          loading="lazy"
          onError={(e) => { e.target.src = '/imagenes/placeholder.png'; }}
          className="w-full h-40 sm:h-44 md:h-48 object-cover bg-gray-light"
        />
		{producto.stock <= 0 && (
		  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">
			Sin Stock
		  </div>
		)}
      </div>

      {/* Nombre */}
      <div className="text-gray-900 font-medium text-base line-clamp-2">
        {producto.name?.length > 30
          ? producto.name.slice(0, 30) + '…'
          : producto.name}
      </div>

      {/* Unidad + código */}
      <div className="text-gray-light text-sm mt-1">
        {producto.unit} {producto.code}
      </div>

      {/* Precio */}
      <div className="text-green-accent font-bold text-lg mt-2">
        ${parseFloat(producto.price).toFixed(2)}
      </div>

      {/* Stock */}
      <div className="text-secondary text-xs mt-1">
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
