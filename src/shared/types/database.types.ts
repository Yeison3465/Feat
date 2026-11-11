export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      configuracion_prestamos: {
        Row: {
          actualizado_en: string
          base_calculo_mora: string
          dias_gracia_defecto: number
          id: string
          propietario_id: string
          tasa_mensual_defecto: number
          tasa_mora_defecto: number
        }
        Insert: {
          actualizado_en?: string
          base_calculo_mora?: string
          dias_gracia_defecto?: number
          id?: string
          propietario_id: string
          tasa_mensual_defecto?: number
          tasa_mora_defecto?: number
        }
        Update: {
          actualizado_en?: string
          base_calculo_mora?: string
          dias_gracia_defecto?: number
          id?: string
          propietario_id?: string
          tasa_mensual_defecto?: number
          tasa_mora_defecto?: number
        }
        Relationships: []
      }
      cuotas: {
        Row: {
          capital_esperado: number
          capital_pagado: number
          creado_en: string
          esta_liquidada: boolean
          fecha_liquidacion: string | null
          fecha_vencimiento: string
          id: string
          interes_esperado: number
          interes_pagado: number
          mora_acumulada: number
          mora_pagada: number
          numero_cuota: number
          prestamo_id: string
          propietario_id: string
        }
        Insert: {
          capital_esperado?: number
          capital_pagado?: number
          creado_en?: string
          esta_liquidada?: boolean
          fecha_liquidacion?: string | null
          fecha_vencimiento: string
          id?: string
          interes_esperado?: number
          interes_pagado?: number
          mora_acumulada?: number
          mora_pagada?: number
          numero_cuota: number
          prestamo_id: string
          propietario_id: string
        }
        Update: {
          capital_esperado?: number
          capital_pagado?: number
          creado_en?: string
          esta_liquidada?: boolean
          fecha_liquidacion?: string | null
          fecha_vencimiento?: string
          id?: string
          interes_esperado?: number
          interes_pagado?: number
          mora_acumulada?: number
          mora_pagada?: number
          numero_cuota?: number
          prestamo_id?: string
          propietario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cuotas_prestamo"
            columns: ["prestamo_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id", "propietario_id"]
          },
        ]
      }
      distribucion_pagos: {
        Row: {
          componente: Database["public"]["Enums"]["componente_pago"]
          creado_en: string
          cuota_id: string | null
          id: string
          monto: number
          pago_id: string
          propietario_id: string
        }
        Insert: {
          componente: Database["public"]["Enums"]["componente_pago"]
          creado_en?: string
          cuota_id?: string | null
          id?: string
          monto: number
          pago_id: string
          propietario_id: string
        }
        Update: {
          componente?: Database["public"]["Enums"]["componente_pago"]
          creado_en?: string
          cuota_id?: string | null
          id?: string
          monto?: number
          pago_id?: string
          propietario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_distribucion_cuota"
            columns: ["cuota_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "cuotas"
            referencedColumns: ["id", "propietario_id"]
          },
          {
            foreignKeyName: "fk_distribucion_pago"
            columns: ["pago_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id", "propietario_id"]
          },
        ]
      }
      movimientos_prestamo: {
        Row: {
          creado_en: string
          fecha_efectiva: string
          id: string
          metadatos: Json | null
          monto: number
          movimiento_reversado_id: string | null
          notas: string | null
          pago_origen_id: string | null
          prestamo_id: string
          propietario_id: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_prestamo"]
        }
        Insert: {
          creado_en?: string
          fecha_efectiva?: string
          id?: string
          metadatos?: Json | null
          monto: number
          movimiento_reversado_id?: string | null
          notas?: string | null
          pago_origen_id?: string | null
          prestamo_id: string
          propietario_id: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_prestamo"]
        }
        Update: {
          creado_en?: string
          fecha_efectiva?: string
          id?: string
          metadatos?: Json | null
          monto?: number
          movimiento_reversado_id?: string | null
          notas?: string | null
          pago_origen_id?: string | null
          prestamo_id?: string
          propietario_id?: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento_prestamo"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_movimientos_prestamo"
            columns: ["prestamo_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id", "propietario_id"]
          },
          {
            foreignKeyName: "movimientos_prestamo_movimiento_reversado_id_fkey"
            columns: ["movimiento_reversado_id"]
            isOneToOne: false
            referencedRelation: "movimientos_prestamo"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          clave_idempotencia: string
          creado_en: string
          es_reverso: boolean
          fecha_recepcion: string
          id: string
          metodo_pago: string
          monto: number
          notas: string | null
          pago_reversado_id: string | null
          prestamo_id: string
          propietario_id: string
        }
        Insert: {
          clave_idempotencia: string
          creado_en?: string
          es_reverso?: boolean
          fecha_recepcion?: string
          id?: string
          metodo_pago?: string
          monto: number
          notas?: string | null
          pago_reversado_id?: string | null
          prestamo_id: string
          propietario_id: string
        }
        Update: {
          clave_idempotencia?: string
          creado_en?: string
          es_reverso?: boolean
          fecha_recepcion?: string
          id?: string
          metodo_pago?: string
          monto?: number
          notas?: string | null
          pago_reversado_id?: string | null
          prestamo_id?: string
          propietario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pagos_prestamo"
            columns: ["prestamo_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id", "propietario_id"]
          },
          {
            foreignKeyName: "pagos_pago_reversado_id_fkey"
            columns: ["pago_reversado_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          moneda: string
          nombre_negocio: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id: string
          moneda?: string
          nombre_negocio?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          moneda?: string
          nombre_negocio?: string | null
        }
        Relationships: []
      }
      personas: {
        Row: {
          actualizado_en: string
          archivado: boolean
          creado_en: string
          direccion: string | null
          exento_interes_ordinario: boolean
          id: string
          nombre: string
          notas: string | null
          propietario_id: string
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          archivado?: boolean
          creado_en?: string
          direccion?: string | null
          exento_interes_ordinario?: boolean
          id?: string
          nombre: string
          notas?: string | null
          propietario_id: string
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          archivado?: boolean
          creado_en?: string
          direccion?: string | null
          exento_interes_ordinario?: boolean
          id?: string
          nombre?: string
          notas?: string | null
          propietario_id?: string
          telefono?: string | null
        }
        Relationships: []
      }
      prestamos: {
        Row: {
          actualizado_en: string
          capital_original: number
          creado_en: string
          estado: Database["public"]["Enums"]["estado_prestamo"]
          fecha_desembolso: string
          fecha_primer_vencimiento: string
          fecha_vencimiento_final: string | null
          id: string
          persona_id: string
          propietario_id: string
          resumen_condiciones: Json
          tasa_mensual: number
          tasa_mora: number
          tipo_amortizacion: Database["public"]["Enums"]["tipo_amortizacion_prestamo"]
        }
        Insert: {
          actualizado_en?: string
          capital_original: number
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          fecha_desembolso?: string
          fecha_primer_vencimiento: string
          fecha_vencimiento_final?: string | null
          id?: string
          persona_id: string
          propietario_id: string
          resumen_condiciones: Json
          tasa_mensual?: number
          tasa_mora?: number
          tipo_amortizacion?: Database["public"]["Enums"]["tipo_amortizacion_prestamo"]
        }
        Update: {
          actualizado_en?: string
          capital_original?: number
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          fecha_desembolso?: string
          fecha_primer_vencimiento?: string
          fecha_vencimiento_final?: string | null
          id?: string
          persona_id?: string
          propietario_id?: string
          resumen_condiciones?: Json
          tasa_mensual?: number
          tasa_mora?: number
          tipo_amortizacion?: Database["public"]["Enums"]["tipo_amortizacion_prestamo"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_prestamos_persona"
            columns: ["persona_id", "propietario_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id", "propietario_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registrar_pago_transaccional: {
        Args: {
          p_clave_idempotencia: string
          p_fecha_recepcion?: string
          p_metodo_pago?: string
          p_monto: number
          p_monto_capital?: number
          p_notas?: string
          p_prestamo_id: string
        }
        Returns: Json
      }
      reversar_pago_transaccional: {
        Args: {
          p_motivo?: string
          p_pago_id: string
        }
        Returns: Json
      }
      sincronizar_estados_y_mora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      componente_pago: "mora" | "interes" | "capital"
      estado_prestamo: "activo" | "completado" | "en_mora" | "cancelado"
      tipo_amortizacion_prestamo: "solo_interes" | "cuotas_fijas" | "pago_unico"
      tipo_movimiento_prestamo:
        | "desembolso"
        | "pago"
        | "cargo_mora"
        | "reverso"
        | "ajuste"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

