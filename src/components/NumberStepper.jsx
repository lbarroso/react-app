/**
 * FASE 4 - NumberStepper Component
 * Touch-friendly stepper con min=1, max=9999, botones 48px
 */

import { useState, useCallback } from 'react'
import '../css/design-system.css'

export default function NumberStepper({
  value = 1,
  min = 1,
  max = 9999,
  onChange,
  disabled = false,
  size = 'default', // 'default' | 'small'
  ...props
}) {
  const [inputValue, setInputValue] = useState(value.toString())
  
  // Validar y normalizar el valor
  const normalizeValue = useCallback((val) => {
    const num = parseInt(val) || min
    return Math.min(Math.max(num, min), max)
  }, [min, max])
  
  // Manejar cambio desde botones
  const handleButtonChange = useCallback((newValue) => {
    if (disabled) return
    
    const normalized = normalizeValue(newValue)
    setInputValue(normalized.toString())
    onChange?.(normalized)
  }, [disabled, normalizeValue, onChange])
  
  // Manejar decremento
  const handleDecrement = useCallback(() => {
    const current = parseInt(inputValue) || min
    handleButtonChange(current - 1)
  }, [inputValue, min, handleButtonChange])
  
  // Manejar incremento
  const handleIncrement = useCallback(() => {
    const current = parseInt(inputValue) || min
    handleButtonChange(current + 1)
  }, [inputValue, min, handleButtonChange])
  
  // Manejar cambio directo en input
  const handleInputChange = useCallback((e) => {
    const rawValue = e.target.value
    
    // Permitir números y string vacío temporalmente
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setInputValue(rawValue)
    }
  }, [])
  
  // Manejar blur del input (validar y normalizar)
  const handleInputBlur = useCallback(() => {
    const normalized = normalizeValue(inputValue)
    setInputValue(normalized.toString())
    onChange?.(normalized)
  }, [inputValue, normalizeValue, onChange])
  
  // Manejar teclas especiales
  const handleKeyDown = useCallback((e) => {
    if (disabled) return
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        handleIncrement()
        break
      case 'ArrowDown':
        e.preventDefault()
        handleDecrement()
        break
      case 'Enter':
        e.preventDefault()
        handleInputBlur()
        break
    }
  }, [disabled, handleIncrement, handleDecrement, handleInputBlur])
  
  // Sincronizar cuando cambie el prop value
  useState(() => {
    setInputValue(value.toString())
  }, [value])
  
  const currentValue = parseInt(inputValue) || min
  const canDecrement = !disabled && currentValue > min
  const canIncrement = !disabled && currentValue < max
  const stepperClass = `stepper ${size === 'small' ? 'stepper-small' : ''}`
  
  return (
    <div className={stepperClass} {...props}>
      {/* Botón decrementar */}
      <button
        type="button"
        className="stepper-btn stepper-btn-minus"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Disminuir cantidad"
        tabIndex={disabled ? -1 : 0}
      >
        −
      </button>
      
      {/* Input numérico */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="stepper-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        min={min}
        max={max}
        aria-label={`Cantidad, mínimo ${min}, máximo ${max}`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      
      {/* Botón incrementar */}
      <button
        type="button"
        className="stepper-btn stepper-btn-plus"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Aumentar cantidad"
        tabIndex={disabled ? -1 : 0}
      >
        +
      </button>
    </div>
  )
}

/**
 * Hook para usar NumberStepper de forma controlada
 */
export function useNumberStepper(initialValue = 1, min = 1, max = 9999) {
  const [value, setValue] = useState(initialValue)
  
  const handleChange = useCallback((newValue) => {
    setValue(newValue)
  }, [])
  
  const reset = useCallback(() => {
    setValue(initialValue)
  }, [initialValue])
  
  const increment = useCallback(() => {
    setValue(prev => Math.min(prev + 1, max))
  }, [max])
  
  const decrement = useCallback(() => {
    setValue(prev => Math.max(prev - 1, min))
  }, [min])
  
  return {
    value,
    setValue,
    handleChange,
    reset,
    increment,
    decrement,
    isAtMin: value <= min,
    isAtMax: value >= max
  }
} 