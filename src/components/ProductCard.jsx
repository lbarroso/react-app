// components/ProductCard.jsx
import QuantitySelector from './QuantitySelector';
import { getProductImageSrc } from '../utils/getProductImage';

// Definición limpia y reutilizable: un Set con todas las categorías “Canasta”
const CANASTA_CATEGORIES = new Set([
  1, 2, 3, 4, 5, 7, 8, 9, 10, 11,
  12, 13, 25, 32, 36, 37, 38, 40,
  42, 43, 62, 72
])

export default function ProductCard({
  producto,
  cantidad,
  agregarAlCarrito,
  aumentarCantidad,
  disminuirCantidad,
}) {

  const src = getProductImageSrc(producto.image);
  
  // Debug: ver qué imagen se está intentando cargar
  console.log('ProductCard - producto.image:', producto.image, 'src generado:', src);

  const handleImageError = (e) => {
    console.log('Error cargando imagen:', e.target.src);
    // Evitar loops infinitos verificando si ya es el placeholder
    if (!e.target.src.includes('placeholder')) {
      e.target.src = '/imagenes/placeholder.png';
      console.log('Cambiando a placeholder.png');
    } else {
      console.log('Ya es placeholder, intentando placeholder.jpg');
      e.target.src = '/imagenes/placeholder.jpg';
    }
  };

  // Comprueba si esta categoría es “Canasta” de un sólo paso
  const esCanasta = CANASTA_CATEGORIES.has(producto.category_id)

  return (

    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
      {/* Imagen */}
      <div className="relative">
        <img
          src={src}
          alt={producto.name}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-40 sm:h-44 md:h-48 object-cover bg-gray-light"
        />
		{ producto.stock <= 0 && (
		  <div className="absolute top-2 right-2 bg-secondary text-white text-xs font-semibold rounded-full px-2 py-0.5">
			Sin Stock
		  </div>
		)}
		{ esCanasta && (
		  <div className="absolute top-2 right-2 bg-green-accent text-white text-xs font-semibold rounded-full px-2 py-0.5">
			🛒 Canasta
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
