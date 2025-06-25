import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  getClientsLocal, 
  searchClientsByName, 
  getClientCount,
  findClientByCode 
} from '../utils/indexedDB'

/**
 * @typedef {Object} Cliente
 * @property {number} almcnt - Número de almacén
 * @property {number} ctecve - Código de cliente  
 * @property {string} name - Nombre completo del cliente
 */

/**
 * @typedef {Object} UseClientesLocalReturn
 * @property {Cliente[]} clientes - Lista completa de clientes
 * @property {Cliente[]} filteredClientes - Lista filtrada por búsqueda
 * @property {Cliente|null} selectedClient - Cliente seleccionado
 * @property {string} searchTerm - Término de búsqueda actual
 * @property {boolean} isLoading - Estado de carga
 * @property {boolean} isEmpty - Si no hay clientes disponibles
 * @property {string|null} error - Mensaje de error si lo hay
 * @property {number} totalCount - Total de clientes disponibles
 * @property {function} setSearchTerm - Función para cambiar término de búsqueda
 * @property {function} selectClient - Función para seleccionar cliente
 * @property {function} clearSelection - Función para limpiar selección
 * @property {function} refreshClients - Función para recargar clientes
 * @property {function} findByCode - Función para buscar por código
 */

/**
 * Hook personalizado para manejar clientes desde IndexedDB de forma offline
 * @param {number} almcnt - Código del almacén
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar (default: true)
 * @param {number} options.searchDebounce - Tiempo de debounce para búsquedas en ms (default: 150)
 * @returns {Object} Estado y funciones para manejar clientes
 */
export function useClientesLocal(almcnt, options = {}) {
  const { autoLoad = true, searchDebounce = 150 } = options

  // Estados principales
  const [clientes, setClientes] = useState([])
  const [filteredClientes, setFilteredClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null)
  
  // Estado de selección
  const [selectedClient, setSelectedClient] = useState(null)

  // Función para cargar todos los clientes
  const loadClients = useCallback(async () => {
    if (!almcnt || typeof almcnt !== 'number') {
      setError('Almacén no válido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [clientesData, count] = await Promise.all([
        getClientsLocal(almcnt),
        getClientCount(almcnt)
      ])

      setClientes(clientesData)
      setFilteredClientes(clientesData)
      setTotalCount(count)
      
      console.log(`Cargados ${clientesData.length} clientes para almcnt ${almcnt}`)
      
    } catch (err) {
      console.error('Error cargando clientes:', err)
      setError('Error al cargar clientes')
      setClientes([])
      setFilteredClientes([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [almcnt])

  // Función de búsqueda con debounce
  const performSearch = useCallback(async (term) => {
    if (!almcnt) return

    setSearchLoading(true)
    setError(null)

    try {
      const results = await searchClientsByName(almcnt, term, 50)
      setFilteredClientes(results)
      
    } catch (err) {
      console.error('Error en búsqueda:', err)
      setError('Error en la búsqueda')
    } finally {
      setSearchLoading(false)
    }
  }, [almcnt])

  // Función para manejar cambios en el término de búsqueda
  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term)
    
    // Limpiar timer anterior
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    // Si no hay término, mostrar todos los clientes
    if (!term.trim()) {
      setFilteredClientes(clientes)
      setSearchLoading(false)
      return
    }

    // Configurar nuevo timer para debounce
    setSearchLoading(true)
    const newTimer = setTimeout(() => {
      performSearch(term.trim())
    }, searchDebounce)
    
    setSearchDebounceTimer(newTimer)
  }, [clientes, performSearch, searchDebounce, searchDebounceTimer])

  // Función para seleccionar cliente
  const selectClient = useCallback((client) => {
    if (!client) {
      setSelectedClient(null)
      return
    }

    // Validar estructura del cliente
    if (!client.almcnt || !client.ctecve || !client.name) {
      console.warn('Cliente con estructura inválida:', client)
      return
    }

    setSelectedClient(client)
    console.log('Cliente seleccionado:', client)
  }, [])

  // Función para limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedClient(null)
  }, [])

  // Función para buscar cliente por código
  const findByCode = useCallback(async (ctecve) => {
    if (!almcnt || !ctecve) return null

    try {
      const client = await findClientByCode(almcnt, ctecve)
      return client
    } catch (err) {
      console.error('Error buscando cliente por código:', err)
      return null
    }
  }, [almcnt])

  // Estados derivados (memoizados para performance)
  const hasClients = useMemo(() => clientes.length > 0, [clientes.length])
  const hasResults = useMemo(() => filteredClientes.length > 0, [filteredClientes.length])
  const isSearching = useMemo(() => searchTerm.trim().length > 0, [searchTerm])
  const canCreateOrder = useMemo(() => selectedClient !== null, [selectedClient])
  const showEmptyState = useMemo(() => !loading && !hasClients, [loading, hasClients])
  const showNoResults = useMemo(() => !searchLoading && isSearching && !hasResults, [searchLoading, isSearching, hasResults])

  // Estadísticas de búsqueda
  const searchStats = useMemo(() => ({
    totalClients: totalCount,
    displayedResults: filteredClientes.length,
    isFiltered: isSearching,
    searchTerm: searchTerm.trim()
  }), [totalCount, filteredClientes.length, isSearching, searchTerm])

  // Efecto para cargar clientes al montar o cambiar almcnt
  useEffect(() => {
    if (autoLoad && almcnt) {
      loadClients()
    }
  }, [autoLoad, almcnt, loadClients])

  // Efecto para limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
    }
  }, [searchDebounceTimer])

  // Función para refrescar datos
  const refresh = useCallback(() => {
    setSearchTerm('')
    setSelectedClient(null)
    setError(null)
    loadClients()
  }, [loadClients])

  return {
    // Datos
    clientes: filteredClientes,
    allClientes: clientes,
    selectedClient,
    totalCount,
    searchStats,
    
    // Estados
    loading,
    searchLoading,
    error,
    hasClients,
    hasResults,
    isSearching,
    canCreateOrder,
    showEmptyState,
    showNoResults,
    
    // Búsqueda
    searchTerm,
    setSearchTerm: handleSearchChange,
    
    // Acciones
    loadClients,
    selectClient,
    clearSelection,
    findByCode,
    refresh,
    
    // Utilidades
    getClientByIndex: useCallback((index) => {
      return filteredClientes[index] || null
    }, [filteredClientes]),
    
    isClientSelected: useCallback((client) => {
      return selectedClient && 
             selectedClient.almcnt === client.almcnt && 
             selectedClient.ctecve === client.ctecve
    }, [selectedClient])
  }
}



export default useClientesLocal 