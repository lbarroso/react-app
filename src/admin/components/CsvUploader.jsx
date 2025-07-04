import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { FaUpload, FaSpinner, FaCheckCircle, FaExclamationCircle, FaFile } from 'react-icons/fa'
import { supabase } from '../../supabaseClient'
import { obtenerAlmcnt } from '../../utils/session'

export default function CsvUploader() {
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([])
  const fileInputRef = useRef(null)

  // Función para limpiar y resetear el estado
  const resetUploader = () => {
    setFile(null)
    setResults(null)
    setLogs([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Función para manejar la selección del archivo
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setResults(null)
        setLogs([])
      } else {
        alert('Por favor selecciona un archivo CSV válido.')
        resetUploader()
      }
    }
  }

  // Función para añadir logs
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = {
      id: Date.now(),
      message,
      type,
      timestamp
    }
    setLogs(prev => [logEntry, ...prev])
  }

  // Función para procesar el archivo CSV
  const processCSV = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo CSV primero.')
      return
    }

    setIsProcessing(true)
    setResults(null)
    setLogs([])

    addLog(`🚀 Iniciando procesamiento del archivo: ${file.name}`)

    try {
      // Parsear el archivo CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (parseResult) => {
          try {
            addLog(`📊 Archivo parseado correctamente. ${parseResult.data.length} filas encontradas.`)
            
            /* === RESET STOCK A 0 SEGÚN SESSION === */
            const almcntLocal = await obtenerAlmcnt()
            console.log('almcntLocal RESET STOCK A 0', almcntLocal);
            if (almcntLocal && !isNaN(Number(almcntLocal))) {
              const { error: resetErr } = await supabase
                .from('products')
                .update({ stock: 0, updated_at: new Date().toISOString() })
                .eq('almcnt', Number(almcntLocal))
              if (resetErr) {
                addLog(`❌ Error reiniciando stock (almcnt=${almcntLocal}): ${resetErr.message}`, 'error')
                setIsProcessing(false)
                return   // abortar procesamiento si falla el reset
              }
              addLog(`🗑️ Stock puesto a 0 para almcnt=${almcntLocal}`, 'success')
            } else {
              addLog('⚠️ almcnt de sesión no es válido; se omite reset de stock', 'error')
            }
            /* === FIN RESET === */
            
            let successCount = 0
            let errorCount = 0
            const errors = []

            // Procesar cada fila
            for (let i = 0; i < parseResult.data.length; i++) {
              const row = parseResult.data[i]
              const rowNumber = i + 1

              try {
                // Validar campos requeridos
                if (!row.code || !row.code.trim()) {
                  throw new Error(`Fila ${rowNumber}: El campo 'code' es requerido`)
                }

                if (!row.almcnt || isNaN(Number(row.almcnt))) {
                  throw new Error(`Fila ${rowNumber}: El campo 'almcnt' debe ser un número válido`)
                }

                // Preparar el payload para Supabase
                const payload = {
                  category_id: Number(row.category_id) || 1,
                  name: row.name?.trim() || 'SIN NOMBRE',
                  code: row.code?.trim(),
                  barcode: row.barcode?.trim() || null,
                  description: row.description?.trim() || null,
                  price: Number(row.price) || 0,
                  stock: Number(row.stock) || 0,
                  unit: row.unit?.trim() || 'pieza',
                  image: row.image?.trim() || null,
                  almcnt: Number(row.almcnt),
                  updated_at: new Date().toISOString()
                }

                // Ejecutar upsert en Supabase
                const { error } = await supabase
                  .from('products')
                  .upsert(payload, { 
                    onConflict: 'code,almcnt',
                    ignoreDuplicates: false 
                  })

                if (error) {
                  throw new Error(`Error en Supabase: ${error.message}`)
                }

                successCount++
                addLog(`✅ Fila ${rowNumber}: Producto '${payload.name}' (${payload.code}) sincronizado correctamente`, 'success')

              } catch (error) {
                errorCount++
                errors.push(`Fila ${rowNumber}: ${error.message}`)
                addLog(`❌ Fila ${rowNumber}: ${error.message}`, 'error')
              }
            }

            // Mostrar resultados finales
            const finalResults = {
              total: parseResult.data.length,
              success: successCount,
              errors: errorCount,
              errorDetails: errors
            }

            setResults(finalResults)
            addLog(`🎉 Procesamiento completado. ${successCount} exitosos, ${errorCount} errores.`, 'success')

          } catch (error) {
            addLog(`❌ Error durante el procesamiento: ${error.message}`, 'error')
            setResults({
              total: 0,
              success: 0,
              errors: 1,
              errorDetails: [error.message]
            })
          }
        },
        error: (error) => {
          addLog(`❌ Error al parsear el archivo CSV: ${error.message}`, 'error')
          setResults({
            total: 0,
            success: 0,
            errors: 1,
            errorDetails: [error.message]
          })
        }
      })

    } catch (error) {
      addLog(`❌ Error inesperado: ${error.message}`, 'error')
      setResults({
        total: 0,
        success: 0,
        errors: 1,
        errorDetails: [error.message]
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Cargar y Procesar Archivo CSV</h3>
      
      {/* Selector de archivo */}
      <div className="mb-6">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FaFile className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Haz clic para seleccionar</span> o arrastra un archivo CSV aquí
              </p>
              <p className="text-xs text-gray-500">Solo archivos CSV (MAX. 10MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        
        {file && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <FaFile className="text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Archivo seleccionado: {file.name}
              </span>
              <span className="text-xs text-blue-600 ml-2">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={processCSV}
          disabled={!file || isProcessing}
          className={`
            flex items-center px-6 py-3 rounded-lg font-medium transition-all
            ${file && !isProcessing
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            <>
              <FaUpload className="mr-2" />
              Subir y Sincronizar
            </>
          )}
        </button>

        <button
          onClick={resetUploader}
          disabled={isProcessing}
          className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Limpiar
        </button>
      </div>

      {/* Resultados */}
      {results && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Resultados del Procesamiento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-blue-800">Total de filas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.success}</div>
              <div className="text-sm text-green-800">Exitosos</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.errors}</div>
              <div className="text-sm text-red-800">Errores</div>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            Registro de Actividad ({logs.length} entradas)
          </h4>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded text-sm whitespace-pre-wrap ${
                    log.type === 'success' 
                      ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
                      : log.type === 'error'
                      ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
                      : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
                  }`}
                >
                  <span className="text-xs opacity-75">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 