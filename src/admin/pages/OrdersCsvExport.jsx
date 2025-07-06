import { useNavigate } from 'react-router-dom'
import { FaDownload, FaArrowLeft } from 'react-icons/fa'
import CsvDownloader from '../components/CsvDownloader'

export default function OrdersCsvExport() {
  const navigate = useNavigate()

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
              <h1 className="text-2xl font-bold text-gray-900">Exportar Pedidos</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <FaDownload className="text-4xl text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Exportar Pedidos a CSV</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descarga todos los pedidos de tu almacén en formato CSV. 
              El archivo incluirá información detallada de cada pedido, 
              cliente y productos solicitados.
            </p>
          </div>

          {/* Información del proceso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Qué incluye el CSV?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Información del pedido (ID, fecha, estado, total)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Datos del cliente (clave, nombre)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Detalles de productos (nombre, cantidad, precio, unidad)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Cada fila representa un producto dentro de un pedido
              </li>
            </ul>
          </div>

          {/* Componente descargador */}
          <CsvDownloader />

          {/* Nota importante */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> El archivo CSV se generará con todos los pedidos 
              correspondientes a tu almacén. La descarga puede tardar unos segundos 
              dependiendo de la cantidad de pedidos.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 