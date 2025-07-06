import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaFileDownload, FaSpinner, FaBook, FaEye, FaMoneyBill } from 'react-icons/fa'
import { generateCatalog } from '../../services/pdfCatalog'

export default function AdminCatalog() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState('')

  const handleGenerate = async (withPrices) => {
    setLoading(true)
    setLoadingType(withPrices ? 'con precios' : 'sin precios')
    
    try {
      await generateCatalog({ includePrices: withPrices })
    } catch (error) {
      console.error('Error generando catálogo:', error)
      alert('Error al generar el catálogo. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generando Catálogo
              </h3>
              <p className="text-gray-600">
                Creando catálogo {loadingType}...
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Esto puede tomar unos minutos
              </div>
            </div>
          </div>
        </div>
      )}

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
              <h1 className="text-2xl font-bold text-gray-900">Catálogo Digital</h1>
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
              <div className="bg-blue-100 p-4 rounded-full">
                <FaBook className="text-4xl text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Generar Catálogo Digital
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Crea un catálogo PDF profesional con todos los productos de tu almacén.
              Elige si incluir precios o generar una versión sin precios.
            </p>
          </div>

          {/* Información del catálogo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Qué incluye el catálogo?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Portada con información de tu empresa
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Índice por categorías con cantidad de productos
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Productos organizados en formato tabla (15 por página)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Imágenes 60x60 píxeles sin compresión
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Tabla con código, nombre, presentación y stock
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Solo productos con stock disponible (stock &gt; 0)
              </li>
            </ul>
          </div>

          {/* Botones de generación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catálogo con precios */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center mb-4">
                <FaMoneyBill className="text-3xl mr-3" />
                <h3 className="text-xl font-semibold">Con Precios</h3>
              </div>
              <p className="text-green-100 mb-6">
                Catálogo completo incluyendo precios de venta. 
                Ideal para mostrar a clientes y tomar pedidos.
              </p>
              <button
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className={`
                  w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
                  ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-white text-green-600 hover:bg-green-50 hover:shadow-lg transform hover:scale-105'
                  }
                `}
              >
                {loading ? (
                  <FaSpinner className="animate-spin inline mr-2" />
                ) : (
                  <FaFileDownload className="inline mr-2" />
                )}
                Generar con Precios
              </button>
            </div>

            {/* Catálogo sin precios */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center mb-4">
                <FaEye className="text-3xl mr-3" />
                <h3 className="text-xl font-semibold">Sin Precios</h3>
              </div>
              <p className="text-blue-100 mb-6">
                Catálogo visual sin mostrar precios. 
                Perfecto para presentaciones y exhibición.
              </p>
              <button
                onClick={() => handleGenerate(false)}
                disabled={loading}
                className={`
                  w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
                  ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg transform hover:scale-105'
                  }
                `}
              >
                {loading ? (
                  <FaSpinner className="animate-spin inline mr-2" />
                ) : (
                  <FaFileDownload className="inline mr-2" />
                )}
                Generar sin Precios
              </button>
            </div>
          </div>

          {/* Notas importantes */}
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> La generación es rápida ya que las imágenes no se comprimen.
                El diseño tabla es limpio y fácil de leer.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Diseño:</strong> Formato tabla limpio con imágenes sin compresión.
                Consulta directa: SELECT code, name, price, image, unit, stock FROM products WHERE almcnt=(almacén) AND stock &gt; 0
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 