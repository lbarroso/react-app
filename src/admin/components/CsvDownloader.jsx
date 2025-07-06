import { useState } from 'react'
import { FaDownload, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import Papa from 'papaparse'
import { supabase } from '../../supabaseClient'
import { obtenerAlmcnt } from '../../utils/session'

export default function CsvDownloader() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Función para generar y descargar CSV
  const generarCsv = async () => {
    setIsLoading(true)
    setError('')
    setSuccess(false)
    setStatus('Obteniendo información del almacén...')

    try {
      // Obtener almacén del usuario
      const almcnt = await obtenerAlmcnt()
      
      if (!almcnt) {
        throw new Error('No se pudo obtener el almacén del usuario')
      }

      setStatus('Consultando pedidos en la base de datos...')
      
      // Consultar pedidos con todos los JOINs necesarios
      const { data: pedidos, error: pedidosError } = await supabase
        .from('orders')
        .select(`
          id,
          order_date,
          sync_date,
          almcnt,
          created_at,
          updated_at,
          customers (
            ctecve,
            name
          ),
          order_items (
            order_id,
            quantity,
            unit_price,
            products (
              code,
              name,
              unit
            )
          )
        `)
        .eq('almcnt', almcnt)
        .order('order_date', { ascending: false })

      if (pedidosError) {
        throw new Error(`Error al consultar pedidos: ${pedidosError.message}`)
      }

      setStatus('Procesando datos...')

      // Aplanar los datos para CSV (cada producto del pedido en una fila)
      const datosAplanados = []
      
      pedidos.forEach(pedido => {
        // Si no hay items en el pedido, crear una fila básica
        if (!pedido.order_items || pedido.order_items.length === 0) {
          datosAplanados.push({
            // Datos del pedido
            'order_id': pedido.id,
            'docfec': formatearFecha(pedido.order_date),
            'sync_date': formatearFecha(pedido.sync_date),
            'almcnt': pedido.almcnt,
            'doccreated': formatearFecha(pedido.created_at),
            'docupdated': formatearFecha(pedido.updated_at),
            
            // Datos del cliente
            'ctecve': pedido.customers?.ctecve || '',
            'ctename': pedido.customers?.name || '',
            
            // Datos del producto (vacíos para pedidos sin items)
			'artcve': '',
			'artdesc': '',
			'presentacion': '',
			'doccant': '',            
            'artprventa': '',
            'importe': ''
          })
        } else {
          // Crear una fila por cada item del pedido
          pedido.order_items.forEach(item => {
            datosAplanados.push({
              // Datos del pedido
              'order_id': pedido.id,
              'docfec': formatearFecha(pedido.order_date),
              'sync_date': formatearFecha(pedido.sync_date),
              'almcnt': pedido.almcnt,
              'doccreated': formatearFecha(pedido.created_at),
              'docupdated': formatearFecha(pedido.updated_at),
              
              // Datos del cliente
              'ctecve': pedido.customers?.ctecve || '',
              'ctename': pedido.customers?.name || '',
              
              // Datos del producto
              'artcve': item.products?.code || '',
			  'artdesc': item.products?.name || '',
			  'presentacion': item.products?.unit || '',
              'doccant': item.quantity,
              'artprventa': item.unit_price,
              'importe': (item.quantity * item.unit_price).toFixed(2)
            })
          })
        }
      })

      if (datosAplanados.length === 0) {
        throw new Error('No se encontraron pedidos para exportar')
      }

      setStatus('Generando archivo CSV...')

      // Convertir a CSV usando PapaParse
      const csv = Papa.unparse(datosAplanados, {
        delimiter: ',',
        header: true,
        encoding: 'UTF-8'
      })

      setStatus('Descargando archivo...')

      // Crear y descargar el archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `pedidos_${almcnt}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)

      setSuccess(true)
      setStatus(`✅ Descarga completada: ${datosAplanados.length} registros exportados`)
      
    } catch (err) {
      console.error('Error al generar CSV:', err)
      setError(err.message)
      setStatus('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="text-center">
      {/* Botón principal */}
      <button
        onClick={generarCsv}
        disabled={isLoading}
        className={`
          inline-flex items-center px-6 py-3 rounded-lg font-medium text-lg
          transition-all duration-200 transform
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : success
              ? 'bg-green-500 hover:bg-green-600 hover:scale-105'
              : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
          }
          text-white shadow-lg
        `}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-3" />
            Generando CSV...
          </>
        ) : success ? (
          <>
            <FaCheck className="mr-3" />
            Volver a Exportar
          </>
        ) : (
          <>
            <FaDownload className="mr-3" />
            Exportar Pedidos
          </>
        )}
      </button>

      {/* Status */}
      {status && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{status}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-center text-red-800">
            <FaExclamationTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center text-green-800">
            <FaCheck className="mr-2" />
            <span>¡Archivo CSV descargado exitosamente!</span>
          </div>
        </div>
      )}
    </div>
  )
} 