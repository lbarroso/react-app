// components/QuantitySelector.jsx
import { useState, useMemo } from 'react';
import NumberStepper from './NumberStepper';
import './QuantitySelector.css';
import '../css/design-system.css';

/**
 * Componente QuantitySelector - Maneja la selección de cantidad en piezas o unidades
 * 
 * @param {Object} producto - Objeto producto con id, unit, price, stock, category_id
 * @param {number} cantidadEnCarrito - Cantidad actual en el carrito (0 si no está agregado)
 * @param {Function} onAgregarAlCarrito - Callback (producto, totalPiezas) => void
 * @param {Function} onAumentarCantidad - Callback (producto) => void
 * @param {Function} onDisminuirCantidad - Callback (producto) => void
 */
export default function QuantitySelector({
  producto,
  cantidadEnCarrito,
  onAgregarAlCarrito,
  onAumentarCantidad,
  onDisminuirCantidad,
}) {
  // Estados locales para el selector
  const [modo, setModo] = useState('piezas'); // 'piezas' | 'unidades'
  const [count, setCount] = useState(1); // Cantidad seleccionada

  // Categorías que NO deben mostrar el selector piezas/unidades
  const CATEGORIAS_EXCLUIDAS = [1, 2, 3, 4, 14];

  /**
   * Extrae piezas por unidad del string unit (ej: "36/240/G" → 36)
   * Si no puede parsear, retorna 1 por seguridad
   */
  const piezasPorUnidad = useMemo(() => {
    if (!producto.unit) return 1;
    const partes = producto.unit.split('/');
    const parsed = parseInt(partes[0], 10);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [producto.unit]);

  /**
   * Determina si debe mostrar el selector piezas/unidades
   * Solo se muestra si category_id NO está en las categorías excluidas
   */
  const mostrarSelector = useMemo(() => {
    return !CATEGORIAS_EXCLUIDAS.includes(producto.category_id);
  }, [producto.category_id]);

  /**
   * Calcula el total de piezas según el modo actual
   */
  const totalPiezas = useMemo(() => {
    return modo === 'piezas' ? count : count * piezasPorUnidad;
  }, [modo, count, piezasPorUnidad]);

  /**
   * Maneja el incremento de cantidad
   */
  const handleIncrement = () => {
    if (modo === 'piezas') {
      // En modo piezas, verificar contra stock directamente
      if (count < producto.stock) {
        setCount(prev => prev + 1);
      }
    } else {
      // En modo unidades, verificar que total de piezas no exceda stock
      if (totalPiezas + piezasPorUnidad <= producto.stock) {
        setCount(prev => prev + 1);
      }
    }
  };

  /**
   * Maneja el decremento de cantidad
   */
  const handleDecrement = () => {
    if (count > 1) {
      setCount(prev => prev - 1);
    }
  };

  /**
   * Maneja el cambio de modo entre piezas y unidades
   */
  const handleModoChange = (nuevoModo) => {
    if (nuevoModo === modo) return;
    
    if (nuevoModo === 'unidades') {
      // Cambiar de piezas a unidades: convertir la cantidad actual
      const nuevasUnidades = Math.floor(count / piezasPorUnidad);
      setCount(Math.max(1, nuevasUnidades));
    } else {
      // Cambiar de unidades a piezas: convertir la cantidad actual
      const nuevasPiezas = count * piezasPorUnidad;
      setCount(Math.min(nuevasPiezas, producto.stock));
    }
    setModo(nuevoModo);
  };

  /**
   * Maneja el click en "Agregar al carrito"
   */
  const handleAgregarAlCarrito = () => {
    onAgregarAlCarrito(producto, totalPiezas);
    // Resetear el contador después de agregar
    setCount(1);
    setModo('piezas');
  };

  // Si el producto ya está en el carrito, mostrar controles normales
  if (cantidadEnCarrito > 0) {
    return (
      <div className="cantidad-control">
        <NumberStepper
          value={cantidadEnCarrito}
          min={1}
          max={producto.stock}
          onChange={(newValue) => {
            const diff = newValue - cantidadEnCarrito;
            if (diff > 0) {
              // Incrementar
              for (let i = 0; i < diff; i++) {
                onAumentarCantidad(producto);
              }
            } else if (diff < 0) {
              // Decrementar
              for (let i = 0; i < Math.abs(diff); i++) {
                onDisminuirCantidad(producto);
              }
            }
          }}
          size="small"
        />
      </div>
    );
  }

  // Si no debe mostrar selector, usar lógica simple
  if (!mostrarSelector) {
    return (
      <div className="quantity-selector-simple">
        <div className="qty-controls">
          <NumberStepper
            value={count}
            min={1}
            max={producto.stock}
            onChange={setCount}
            size="small"
          />
        </div>
        <button
          className="btn btn-primary add-to-cart-btn"
          onClick={handleAgregarAlCarrito}
          disabled={producto.stock <= 0}
          style={{marginTop: 'var(--space-sm)', width: '100%'}}
        >
          {producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
        </button>
      </div>
    );
  }

  // Mostrar selector completo con toggle piezas/unidades
  return (
    <div className="quantity-selector">
      {/* Toggle piezas/unidades */}
      <div className="mode-toggle">
        <button
          className={`toggle-btn ${modo === 'piezas' ? 'active' : ''}`}
          onClick={() => handleModoChange('piezas')}
        >
          Pieza(s)
        </button>
        <button
          className={`toggle-btn ${modo === 'unidades' ? 'active' : ''}`}
          onClick={() => handleModoChange('unidades')}
        >
          unidades
        </button>
      </div>

      {/* Controles de cantidad */}
      <div className="qty-controls">
        <button 
          className="qty-btn qty-btn-minus"
          onClick={handleDecrement}
          disabled={count <= 1}
          aria-label="Disminuir cantidad"
        >
          −
        </button>
        <span className="qty-display">{count}</span>
        <button 
          className="qty-btn qty-btn-plus"
          onClick={handleIncrement}
          disabled={
            modo === 'piezas' 
              ? count >= producto.stock 
              : totalPiezas + piezasPorUnidad > producto.stock
          }
          aria-label="Aumentar cantidad"
        >
          ＋
        </button>
      </div>

      {/* Información de conversión en modo unidades */}
      {modo === 'unidades' && count > 0 && (
        <div className="conversion-info">
          <div className="conversion-detail">
            1 unidad = {piezasPorUnidad} piezas
          </div>
          <div className="conversion-total">
            Total: {piezasPorUnidad} × {count} = {totalPiezas} piezas
          </div>
        </div>
      )}

      {/* Botón agregar al carrito */}
      <button
        className="add-to-cart-btn"
        onClick={handleAgregarAlCarrito}
        disabled={producto.stock <= 0 || totalPiezas > producto.stock}
      >
        {producto.stock <= 0 
          ? 'Sin stock' 
          : totalPiezas > producto.stock
          ? 'Cantidad excede stock'
          : 'Agregar al carrito'
        }
      </button>
    </div>
  );
}
