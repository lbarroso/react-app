import { useNavigate } from 'react-router-dom'
import { FaUpload, FaUsers, FaChartBar, FaCog } from 'react-icons/fa'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const adminOptions = [
    {
      id: 'upload-csv',
      title: 'Subir CSV',
      description: 'Sincronizar productos desde archivo CSV',
      icon: FaUpload,
      enabled: true,
      route: '/admin/upload-csv',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'users',
      title: 'Usuarios',
      description: 'Gestionar usuarios del sistema',
      icon: FaUsers,
      enabled: false,
      route: '/admin/users',
      bgColor: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-500'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Ver estadísticas y reportes',
      icon: FaChartBar,
      enabled: false,
      route: '/admin/reports',
      bgColor: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-500'
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: FaCog,
      enabled: false,
      route: '/admin/settings',
      bgColor: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="mr-2">←</span>
                <span className="text-sm">Volver al Dashboard</span>
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Administración</h2>
          <p className="text-gray-600">Gestiona los diferentes aspectos del sistema</p>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminOptions.map((option) => {
            const IconComponent = option.icon
            
            return (
              <div
                key={option.id}
                className={`
                  relative p-6 rounded-lg shadow-md transition-all duration-200 cursor-pointer
                  ${option.enabled 
                    ? `${option.bgColor} ${option.hoverColor} text-white transform hover:scale-105` 
                    : 'bg-gray-100 cursor-not-allowed'
                  }
                `}
                onClick={() => {
                  if (option.enabled) {
                    navigate(option.route)
                  }
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <IconComponent 
                    className={`text-3xl ${option.enabled ? 'text-white' : 'text-gray-400'}`} 
                  />
                  {!option.enabled && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>
                
                <h3 className={`text-xl font-semibold mb-2 ${option.enabled ? 'text-white' : 'text-gray-500'}`}>
                  {option.title}
                </h3>
                
                <p className={`text-sm ${option.enabled ? 'text-blue-100' : 'text-gray-400'}`}>
                  {option.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">CSV</div>
              <div className="text-sm text-gray-600">Subir archivo CSV</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Supabase</div>
              <div className="text-sm text-gray-600">Sincronización automática</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">UPSERT</div>
              <div className="text-sm text-gray-600">Actualizar o insertar</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 