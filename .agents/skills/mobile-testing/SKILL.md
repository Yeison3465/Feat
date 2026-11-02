---
name: mobile-testing
description: Estrategias de testing para aplicaciones móviles React Native, ejecución de pruebas unitarias, de integración con Supabase, pruebas de aislamiento RLS y matriz de casos T-001 a T-012.
---

# Mobile Testing — Estrategia de Pruebas y Aseguramiento de Calidad

## 1. Objetivo y Contexto
Esta skill define las estrategias, planes y procedimientos de prueba para validar que la aplicación móvil opere con estabilidad técnica, seguridad estricta y exactitud matemática en cada uno de sus 8 bloques.

## 2. Cuándo Utilizar Esta Skill
- Al finalizar la implementación de un bloque de desarrollo antes de darlo por cerrado.
- Al escribir o ejecutar pruebas unitarias para utilidades, hooks y validadores.
- Al verificar la integridad referencial y las políticas de RLS en Supabase.
- Al simular condiciones adversas (errores de red, concurrencia, reintentos).

## 3. Matriz Canónica de Pruebas Financieras y de Seguridad

| ID | Escenario de Prueba | Procedimiento | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **T-001** | Préstamo con tasa ordinaria aprobada | Crear préstamo con $100.000 COP y tasa base. | El resultado de intereses y cuotas coincide exactamente con la fórmula y redondeo aprobados. |
| **T-002** | Persona exenta de interés ordinario | Crear préstamo para persona con `exento_interes_ordinario = true`. | Interés ordinario generado es 0; el capital no se incrementa por intereses. |
| **T-003** | Obligación vencida con saldo | Consultar cuota cuya fecha de vencimiento es anterior a hoy con saldo > 0. | Aparece en estado "Atrasado". No aplica recargos de mora hasta que la regla esté aprobada. |
| **T-004** | Pago exclusivo de intereses | Registrar abono imputado únicamente al rubro de intereses. | Disminuye el interés pendiente exigible; el capital pendiente permanece intacto. |
| **T-005** | Pago mixto (interés + capital) | Registrar pago que cubre interés y abona al capital. | Las filas en `distribucion_pagos` suman exactamente el `monto` del pago. |
| **T-006** | Clave de idempotencia repetida | Enviar dos solicitudes idénticas con la misma `clave_idempotencia`. | El servidor procesa el pago una sola vez; la segunda llamada devuelve el resultado original sin duplicar cobro. |
| **T-007** | Concurrencia sobre el mismo saldo | Ejecutar dos pagos simultáneos que superan el saldo pendiente. | El mecanismo de bloqueo por fila (`FOR UPDATE`) evita sobreasignación y saldos negativos accidentales. |
| **T-008** | Intento de acceso cruzado (RLS) | El usuario autenticado A intenta consultar o modificar registros del usuario B. | PostgreSQL rechaza la operación devolviendo 0 filas o denegando el permiso (`403 Forbidden`). |
| **T-009** | Pago mayor a la deuda total | Registrar abono superior al saldo exigible total del préstamo. | El sistema aplica la política aprobada (rechazo o saldo a favor) sin generar saldos negativos. |
| **T-010** | Reversión y auditoría | Ejecutar reverso de un pago asentado incorrectamente. | Se conserva el pago y movimiento original; se crea un movimiento compensatorio vinculado y se restauran los saldos. |
| **T-011** | Cambio de tasa predeterminada | Modificar la tasa en configuración de 20% a 15%. | Préstamos anteriores conservan su tasa pactada original en `resumen_condiciones`. |
| **T-012** | Dashboard ante estado inicial | Iniciar sesión con un usuario nuevo sin datos. | El dashboard muestra estados vacíos limpios (empty states) sin errores de cálculo (`$0 COP`, 0 préstamos). |

## 4. Tipos de Pruebas
1. **Pruebas Unitarias:**
   - Formateadores de moneda (COP sin decimales, separación con puntos).
   - Validaciones de campos de entrada (formato de correo, longitud mínima de contraseñas, montos > 0).
   - Cálculos matemáticos puros aislados en `src/shared/utils/`.
2. **Pruebas de Integración con Supabase:**
   - Verificación de la función RPC `registrar_pago_transaccional` con diferentes cargas.
   - Verificación de que los tipos de TypeScript coincidan con el retorno de la API.
3. **Pruebas de RLS con Dos Usuarios:**
   - Crear Usuario de Prueba 1 y Usuario de Prueba 2.
   - Insertar registros con Usuario 1 y comprobar que Usuario 2 no puede leerlos ni alterarlos.
4. **Pruebas de Interfaz Móvil y Ergonomía:**
   - Revisión en pantalla completa de 390x844 px.
   - Verificación de teclado numérico apropiado en campos de moneda (`keyboardType="numeric"`).
   - Verificación de áreas de toque $\ge 44$ px.

## 5. Criterio de Aceptación para Cierre de Bloque
Un bloque solo se considerará **aprobado** si:
- El 100% de los casos de prueba aplicables al bloque están en verde.
- `npx tsc --noEmit` ejecuta sin ningún error.
- No existen advertencias ni errores en la consola de ejecución de Expo.
