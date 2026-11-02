---
name: supabase-integration
description: Patrones de integración segura con Supabase, manejo de autenticación persistente, consumo de funciones RPC transaccionales, auditoría RLS y uso responsable de Supabase MCP.
---

# Supabase Integration — Integración con Supabase y PostgreSQL

## 1. Objetivo y Contexto
Esta skill define las pautas de integración entre la aplicación móvil React Native y el backend Supabase (PostgreSQL 17). Su propósito es garantizar la integridad transaccional (ACID), el aislamiento estricto de datos por usuario prestamista y la persistencia confiable de sesión en dispositivos móviles.

## 2. Cuándo Utilizar Esta Skill
- Al crear o modificar servicios de datos en `src/modules/*/services/`.
- Al auditar, consultar o ejecutar migraciones en Supabase mediante Supabase MCP.
- Al implementar o consumir funciones almacenadas transaccionales (RPC).
- Al configurar o verificar políticas de Row Level Security (RLS).

## 3. Cliente Centralizado y Autenticación
El cliente debe importarse únicamente desde `src/lib/supabase.ts`, inicializado con `@supabase/supabase-js`, tipado con `Database` y configurado con almacenamiento persistente:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../shared/types/database.types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

## 4. Esquema de Tablas Existentes
El backend cuenta con 8 tablas creadas en español, las cuales deben respetarse:
1. `perfiles`: Configuración del usuario prestamista (moneda, nombre del negocio).
2. `configuracion_prestamos`: Parámetros por defecto (tasa mensual, mora, días de gracia).
3. `personas`: Registro interno de prestatarios (nombre, teléfono, notas, exención).
4. `prestamos`: Préstamos otorgados, capital original, estado, fechas y snapshot de condiciones pactadas.
5. `cuotas`: Calendario de obligaciones y vencimientos asociados al préstamo.
6. `pagos`: Registro de dinero recibido con clave de idempotencia (`clave_idempotencia`).
7. `distribucion_pagos`: Desglose del pago entre mora, interés y capital.
8. `movimientos_prestamo`: Libro mayor contable e inmutable de desembolsos, pagos, ajustes y reversos.

## 5. Row Level Security (RLS) Obligatorio
- **Principio Fundamental:** Cada fila pertenece al usuario autenticado mediante la columna `propietario_id`.
- **Regla Estricta:** Toda tabla debe tener RLS habilitado:
  ```sql
  ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
  ```
- **Política Estándar:**
  ```sql
  CREATE POLICY "Aislamiento por propietario" ON public.prestamos
  FOR ALL
  TO authenticated
  USING (propietario_id = auth.uid())
  WITH CHECK (propietario_id = auth.uid());
  ```
- **PROHIBIDO:** Desactivar RLS para resolver problemas de lectura o escritura. Si una consulta falla por permisos, debe revisarse la política o el token JWT del usuario.

## 6. Operaciones Transaccionales mediante RPC
Las operaciones financieras que implican múltiples escrituras coordinadas (ej. registrar un pago, calcular abono a interés y capital, actualizar saldo y asentar el movimiento en el libro mayor) **deben ejecutarse en PostgreSQL mediante una función RPC transaccional**:

```typescript
export async function registrarPagoTransaccional(params: {
  prestamoId: string
  monto: number
  claveIdempotencia: string
  metodoPago?: string
  notas?: string
  fechaRecepcion?: string
}) {
  const { data, error } = await supabase.rpc('registrar_pago_transaccional', {
    p_prestamo_id: params.prestamoId,
    p_monto: params.monto,
    p_clave_idempotencia: params.claveIdempotencia,
    p_metodo_pago: params.metodoPago,
    p_notas: params.notas,
    p_fecha_recepcion: params.fechaRecepcion,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
```

## 7. Uso Seguro de Supabase MCP
- Antes de ejecutar cualquier script en la base de datos:
  1. Inspeccionar el estado con `list_tables` o consultas de lectura `execute_sql`.
  2. Verificar que no se alteren tablas existentes ni se destruyan registros de prueba.
  3. No ejecutar sentencias `DROP` sin autorización previa documentada.
