// components/QuantitySelector.jsx
import { useState } from 'react';
import './QuantitySelector.css';

/**
 * @param {number}  cantidad         – piezas ya presentes en el carrito (para mostrar)
 * @param {func}    onAdd            – (piezas:number) => void  • añade la cantidad calculada al carrito
 * @param {func}    onIncrease       – () => void                • incrementa en +1 pieza en el carrito
 * @param {func}    onDecrease       – () => void                • decrementa en -1 pieza en el carrito
 * @param {boolean} disabled         – deshabilita todo si no hay stock
 * @param {object}  producto         – objeto producto (usa .unit para calcular piezasPorUnidad)
 */
export default function QuantitySelector({
  cantidad,
  onAdd,
  onIncrease,
  onDecrease,
  disabled,
  producto,
}) {
  /* Modo local de selección */
  const [modo, setModo]       = useState('pieza'); // 'pieza' | 'unidad'
  const [tmpCant, setTmpCant] = useState(0);       // valor digitado por el usuario

  // Ej. "24/500/M"  → 24
  const piezasPorUnidad = parseInt(producto?.unit?.split('/')?.[0], 10) || 1;

  /* Handlers internos */
  const inc = () => setTmpCant(prev => prev + 1);
  const dec = () => setTmpCant(prev => Math.max(prev - 1, 0));

  const handleAdd = () => {
    if (tmpCant === 0) return; // nada que agregar

    const piezasFinales = (modo === 'unidad')
      ? tmpCant * piezasPorUnidad
      : tmpCant;

    onAdd(piezasFinales);
    setTmpCant(0);          // reset local
    setModo('pieza');       // vuelve a “piezas”
  };

  /* Render */
  return (
    <div className="quantity-selector" aria-disabled={disabled}>
      {/* 1️⃣ Toggle Piezas / Unidad */}
      <div className="toggle-mode row">
        <button
          className={modo === 'pieza' ? 'selected' : ''}
          onClick={() => setModo('pieza')}
          disabled={disabled}
        >
          Piezas
        </button>
        <button
          className={modo === 'unidad' ? 'selected' : ''}
          onClick={() => setModo('unidad')}
          disabled={disabled}
        >
          Unidad
        </button>
      </div>

      {/* 2️⃣ Controles de cantidad */}
      <div className="controls row">
        <button onClick={onDecrease} disabled={disabled || tmpCant === 0}>−</button>
        <span>{tmpCant}</span>
        <button onClick={onIncrease} disabled={disabled}>＋</button>
      </div>

      {/* 3️⃣ Información extra cuando el modo = unidad */}
      {modo === 'unidad' && tmpCant > 0 && (
        <div className="detalle-unidad">
          <span>1&nbsp;unidad = {piezasPorUnidad}&nbsp;piezas</span>
          <span>Total: {tmpCant * piezasPorUnidad}&nbsp;piezas</span>
        </div>
      )}

      {/* 4️⃣ Botón final */}
      <button
        className="add-cart-btn"
        onClick={handleAdd}
        disabled={disabled || tmpCant === 0}
      >
        Agregar al carrito
      </button>
    </div>
  );
}
