import { supabase } from '../../../lib/supabase'
import { Database } from '../../../shared/types/database.types'
import { loansService } from '../../loans/services/loans.service'
import { CreatePersonDTO, Person, UpdatePersonDTO } from '../types'

type PersonUpdate = Database['public']['Tables']['personas']['Update']

export const peopleService = {
  async getPeople(searchQuery?: string, showArchived = false): Promise<Person[]> {
    let query = supabase
      .from('personas')
      .select('*')
      .eq('archivado', showArchived)
      .order('nombre', { ascending: true })

    if (searchQuery && searchQuery.trim().length > 0) {
      const term = searchQuery.trim()
      query = query.or(`nombre.ilike.%${term}%,notas.ilike.%${term}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al consultar personas: ${error.message}`)
    }

    return data ?? []
  },

  async getPersonById(id: string): Promise<Person> {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Error al consultar persona: ${error.message}`)
    }

    return data
  },

  async createPerson(dto: CreatePersonDTO): Promise<Person> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para crear un prestatario.')
    }

    const { data, error } = await supabase
      .from('personas')
      .insert({
        propietario_id: authData.user.id,
        nombre: dto.nombre.trim(),
        telefono: dto.telefono?.trim() || null,
        direccion: dto.direccion?.trim() || null,
        notas: dto.notas?.trim() || null,
        exento_interes_ordinario: !!dto.exento_interes_ordinario,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error al registrar persona: ${error.message}`)
    }

    return data
  },

  async updatePerson(id: string, dto: UpdatePersonDTO): Promise<Person> {
    const updatePayload: PersonUpdate = {
      actualizado_en: new Date().toISOString(),
    }

    if (dto.nombre !== undefined) updatePayload.nombre = dto.nombre.trim()
    if (dto.telefono !== undefined) updatePayload.telefono = dto.telefono?.trim() || null
    if (dto.direccion !== undefined) updatePayload.direccion = dto.direccion?.trim() || null
    if (dto.notas !== undefined) updatePayload.notas = dto.notas?.trim() || null
    if (dto.exento_interes_ordinario !== undefined) {
      updatePayload.exento_interes_ordinario = dto.exento_interes_ordinario
    }
    if (dto.archivado !== undefined) updatePayload.archivado = dto.archivado

    const { data, error } = await supabase
      .from('personas')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error al actualizar persona: ${error.message}`)
    }

    return data
  },

  async archivePerson(id: string, archived = true): Promise<Person> {
    const { data, error } = await supabase
      .from('personas')
      .update({ archivado: archived, actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Error al cambiar estado de persona: ${error?.message}`)
    }

    return data
  },

  /**
   * Elimina una persona junto con todos sus préstamos (y los pagos, cuotas y
   * movimientos de esos préstamos). Irreversible.
   */
  async deletePerson(id: string): Promise<void> {
    const { data: prestamos, error: loansErr } = await supabase
      .from('prestamos')
      .select('id')
      .eq('persona_id', id)

    if (loansErr) {
      throw new Error(`Error al consultar préstamos de la persona: ${loansErr.message}`)
    }

    for (const prestamo of prestamos ?? []) {
      await loansService.deleteLoan(prestamo.id)
    }

    const { data, error } = await supabase.from('personas').delete().eq('id', id).select('id')

    if (error) {
      throw new Error(`Error al eliminar persona: ${error.message}`)
    }
    if (!data || data.length === 0) {
      throw new Error(
        'No se pudo eliminar la persona. Verifica que la base de datos permita eliminar personas (política RLS de DELETE).'
      )
    }
  },
}
