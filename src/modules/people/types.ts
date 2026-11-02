import { Tables } from '../../shared/types/database.types'

export type Person = Tables<'personas'>

export interface CreatePersonDTO {
  nombre: string
  telefono?: string | null
  direccion?: string | null
  notas?: string | null
  exento_interes_ordinario?: boolean
}

export interface UpdatePersonDTO {
  nombre?: string
  telefono?: string | null
  direccion?: string | null
  notas?: string | null
  exento_interes_ordinario?: boolean
  archivado?: boolean
}

export interface PeopleFilter {
  searchQuery?: string
  showArchived?: boolean
}

