import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa'
import CsvUploader from '../components/CsvUploader'

export default function CsvUpload() {
  const navigate = useNavigate()

  const requiredHeaders = [
    { field: 'category_id', description: 'ID de categoría (número)', example: '1' },
    { field: 'name', description: 'Nombre del producto', example: 'Producto ejemplo' },
    { field: 'code', description: 'Código único del producto', example: 'PROD001' },
    { field: 'barcode', description: 'Código de barras (opcional)', example: '7501234567890' },
    { field: 'description', description: 'Descripción del producto (opcional)', example: 'Descripción detallada' },
    { field: 'price', description: 'Precio del producto', example: '25.50' },
    { field: 'stock', description: 'Cantidad en stock', example: '100' },
    { field: 'unit', description: 'Unidad de medida', example: 'pieza' },
    { field: 'image', description: 'URL de la imagen (opcional)', example: 'PROD001.extesion' },
    { field: 'almcnt', description: 'Código del almacén', example: '1210' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                <span className="text-sm">Volver al Panel Admin</span>
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Subir CSV de Productos</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Título y descripción */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sincronizar Productos</h2>
          <p className="text-gray-600 mb-6">
            Sube un archivo CSV para sincronizar la tabla de productos en Supabase. 
            Si un producto ya existe (basado en <strong>code + almcnt</strong>), se actualizará. 
            Si no existe, se creará uno nuevo.
          </p>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaInfoCircle className="text-blue-500 mt-1 mr-3" />
              <div>
                <h3 className="text-blue-800 font-semibold mb-2">Información Importante</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• La combinación <strong>code + almcnt</strong> debe ser única</li>
                  <li>• Los campos actualizados son: stock, price, description, image, updated_at</li>
                  <li>• El archivo debe estar en formato CSV con codificación UTF-8</li>
                  <li>• La primera fila debe contener los encabezados</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tabla de campos requeridos */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Encabezados Requeridos en el CSV</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ejemplo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requiredHeaders.map((header, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {header.field}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {header.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {header.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Componente de carga */}
        <CsvUploader />
      </main>
    </div>
  )
} 