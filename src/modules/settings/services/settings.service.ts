import { supabase } from '../../../lib/supabase'
import { LoanSettings, UpdateSettingsDTO } from '../types'

export const settingsService = {
  async getSettings(): Promise<LoanSettings> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para consultar la configuración.')
    }

    const { data, error } = await supabase
      .from('configuracion_prestamos')
      .select('*')
      .eq('propietario_id', authData.user.id)
      .maybeSingle()

    if (error) {
      throw new Error(`Error al consultar configuración: ${error.message}`)
    }

    // Si aún no existe configuración para este usuario, inicializarla con valores por defecto
    if (!data) {
      const { data: newSettings, error: insertError } = await supabase
        .from('configuracion_prestamos')
        .insert({
          propietario_id: authData.user.id,
          tasa_mensual_defecto: 20,
          tasa_mora_defecto: 0,
          dias_gracia_defecto: 3,
          base_calculo_mora: 'SOLO_CAPITAL',
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Error al inicializar configuración: ${insertError.message}`)
      }

      return newSettings
    }

    return data
  },

  async updateSettings(dto: UpdateSettingsDTO): Promise<LoanSettings> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para actualizar la configuración.')
    }

    const current = await this.getSettings()

    const { data, error } = await supabase
      .from('configuracion_prestamos')
      .update({
        ...dto,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error al actualizar configuración: ${error.message}`)
    }

    return data
  },
}

