import { Tables } from '../../shared/types/database.types'

export type LoanSettings = Tables<'configuracion_prestamos'>

export interface UpdateSettingsDTO {
  tasa_mensual_defecto?: number
  tasa_mora_defecto?: number
  dias_gracia_defecto?: number
  base_calculo_mora?: string
}

