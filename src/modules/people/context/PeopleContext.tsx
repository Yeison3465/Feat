import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { peopleService } from '../services/people.service'
import { CreatePersonDTO, Person, UpdatePersonDTO } from '../types'
import { useAuth } from '../../auth/hooks/useAuth'

interface PeopleContextType {
  people: Person[]
  allPeople: Person[]
  loading: boolean
  refreshing: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  reload: () => Promise<void>
  createPerson: (dto: CreatePersonDTO) => Promise<Person>
  updatePerson: (id: string, dto: UpdatePersonDTO) => Promise<Person>
  archivePerson: (id: string, archived?: boolean) => Promise<void>
  deletePerson: (id: string) => Promise<void>
  getPersonById: (id: string) => Person | undefined
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined)

export const PeopleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth()
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadPeople = useCallback(async (isRefresh = false) => {
    if (!session) {
      setAllPeople([])
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const data = await peopleService.getPeople()
      setAllPeople(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar el directorio de personas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  // Cargar una vez cuando la sesión esté disponible
  useEffect(() => {
    if (session) {
      loadPeople()
    } else {
      setAllPeople([])
      setLoading(false)
    }
  }, [session, loadPeople])

  // Filtrado reactivo en memoria para búsqueda instantánea
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return allPeople
    const query = searchQuery.trim().toLowerCase()
    return allPeople.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        (p.notas && p.notas.toLowerCase().includes(query)) ||
        (p.telefono && p.telefono.includes(query))
    )
  }, [allPeople, searchQuery])

  // Crear persona y añadir instantáneamente a la memoria
  const createPerson = async (dto: CreatePersonDTO): Promise<Person> => {
    const created = await peopleService.createPerson(dto)
    setAllPeople((prev) => [created, ...prev])
    return created
  }

  // Actualizar persona y reemplazar instantáneamente en la memoria
  const updatePerson = async (id: string, dto: UpdatePersonDTO): Promise<Person> => {
    const updated = await peopleService.updatePerson(id, dto)
    setAllPeople((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  // Archivar o desarchivar persona y actualizar estado instantáneamente en memoria
  const archivePerson = async (id: string, archived = true): Promise<void> => {
    const updated = await peopleService.archivePerson(id, archived)
    setAllPeople((prev) => {
      if (archived) {
        return prev.filter((p) => p.id !== id)
      } else {
        const withoutTarget = prev.filter((p) => p.id !== id)
        return [updated, ...withoutTarget]
      }
    })
  }

  // Eliminar persona (y sus préstamos) y retirarla de memoria.
  // Quien llame debe recargar los préstamos, que viven en LoansContext.
  const deletePerson = async (id: string): Promise<void> => {
    await peopleService.deletePerson(id)
    setAllPeople((prev) => prev.filter((p) => p.id !== id))
  }

  const getPersonById = useCallback(
    (id: string) => allPeople.find((p) => p.id === id),
    [allPeople]
  )

  const value = useMemo(
    () => ({
      people: filteredPeople,
      allPeople,
      loading,
      refreshing,
      error,
      searchQuery,
      setSearchQuery,
      reload: () => loadPeople(true),
      createPerson,
      updatePerson,
      archivePerson,
      deletePerson,
      getPersonById,
    }),
    [filteredPeople, allPeople, loading, refreshing, error, searchQuery, loadPeople, getPersonById]
  )

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>
}

export function usePeopleContext() {
  const context = useContext(PeopleContext)
  if (!context) {
    throw new Error('usePeopleContext debe ser utilizado dentro de un PeopleProvider')
  }
  return context
}

