import { useState, useEffect } from 'react'
import { getClients, searchClientsByName } from '../utils/client-operations'
import { obtenerAlmcnt } from '../utils/auth'
import './ClientSelector.css'

/**
 * Componente selector de clientes
 * Demuestra cómo usar las funciones de clientes offline
 */
export default function ClientSelector({ onClientSelect, selectedClient }) {
  const [clientes, setClientes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClientes, setFilteredClientes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClients()
  }, [])

  // Filtrar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      filterClients()
    } else {
      setFilteredClientes(clientes)
    }
  }, [searchTerm, clientes])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const almcnt = await obtenerAlmcnt()
      if (almcnt) {
        const clientesLocal = await getClients(almcnt)
        setClientes(clientesLocal)
        setFilteredClientes(clientesLocal)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterClients = async () => {
    try {
      const almcnt = await obtenerAlmcnt()
      if (almcnt) {
        const filtered = await searchClientsByName(almcnt, searchTerm)
        setFilteredClientes(filtered)
      }
    } catch (error) {
      console.error('Error al filtrar clientes:', error)
    }
  }

  const handleClientSelect = (cliente) => {
    if (onClientSelect) {
      onClientSelect(cliente)
    }
  }

  if (isLoading) {
    return <div className="loading">Cargando clientes...</div>
  }

  return (
    <div className="client-selector">
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar cliente por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="clients-list">
        {filteredClientes.length === 0 ? (
          <div className="no-clients">No se encontraron clientes</div>
        ) : (
          filteredClientes.map((cliente) => (
            <div
              key={`${cliente.almcnt}-${cliente.ctecve}`}
              className={`client-item ${selectedClient?.ctecve === cliente.ctecve ? 'selected' : ''}`}
              onClick={() => handleClientSelect(cliente)}
            >
              <div className="client-code">#{cliente.ctecve}</div>
              <div className="client-name">{cliente.name}</div>
            </div>
          ))
        )}
      </div>

      <div className="clients-count">
        {filteredClientes.length} cliente(s) encontrado(s)
      </div>
    </div>
  )
} 