---
name: financial-business-rules
description: Reglas y restricciones para el cálculo de préstamos, intereses, cuotas, distribución de pagos, abonos, mora y trazabilidad contable. Identifica las decisiones bloqueantes DP-01 a DP-08.
---

# Financial Business Rules — Reglas de Negocio Financieras

## 1. Objetivo y Contexto
Esta skill compila las reglas financieras, restricciones contables y definiciones de negocio para la aplicación móvil de préstamos. Su premisa fundamental es salvaguardar la exactitud matemática de las operaciones, impedir la pérdida de trazabilidad contable y evitar la invención de fórmulas no validadas.

## 2. Cuándo Utilizar Esta Skill
- Al diseñar o implementar la creación de préstamos y calendarios de cuotas (`src/modules/loans/`).
- Al procesar pagos, abonos parciales, liquidaciones y distribuciones (`src/modules/payments/`).
- Al calcular métricas financieras y estados de cartera en el Dashboard (`src/modules/dashboard/`).
- Al evaluar si una funcionalidad financiera está desbloqueada o sujeta a decisión pendiente.

## 3. Reglas Financieras Confirmadas y Conocidas
1. **Tasa Predeterminada:** La tasa ordinaria inicial propuesta de referencia es del 20 % mensual (sujeta a confirmación contractual y validación legal).
2. **Exención de Interés Ordinario:** El sistema debe soportar prestatarios marcados con exención de interés ordinario (`exento_interes_ordinario = true`), generando cuotas o cobros con interés cero.
3. **Snapshot Inmutable de Condiciones:** Cada préstamo debe almacenar una copia exacta (`resumen_condiciones`) de los términos vigentes al momento del desembolso (tasa pactada, modalidad, fechas). Modificar la tasa en la configuración global **jamás** altera las condiciones de préstamos otorgados previamente.
4. **Distinción Estricta de Conceptos Monetarios:**
   - **Capital Original:** Monto desembolsado inicialmente al prestatario.
   - **Capital Pendiente:** Saldo de capital aún no recuperado (desembolso menos abonos confirmados a capital).
   - **Intereses Devengados / Generados:** Interés contractual devengado según el calendario de vencimientos.
   - **Intereses Cobrados (Ganancia Real):** Únicamente el interés efectivamente recibido mediante un pago confirmado. El capital recuperado **no** es ganancia.
   - **Mora:** Cargo adicional por atraso que debe tratarse como un concepto contable independiente.
5. **No Reducción Indebida de Capital:** Un pago realizado exclusivamente por concepto de intereses devengados o mora **no debe reducir** el saldo de capital adeudado.
6. **Consistencia de Suma de Pagos:** La suma de las asignaciones de un pago (`distribucion_pagos`) debe ser exactamente igual al monto total recibido en la transacción (`pagos.monto`).
7. **Trazabilidad e Inmutabilidad de Pagos:** No se eliminan ni editan silenciosamente pagos confirmados. Cualquier ajuste o corrección de error debe asentarse mediante una transacción de reverso auditable (`es_reverso = true` y movimiento compensatorio vinculado).

## 4. Decisiones Pendientes que Bloquean Cálculos (DP-01 a DP-08)
Las siguientes decisiones están formalmente pendientes de resolución por parte del titular. **Ningún agente ni desarrollador debe programar algoritmos definitivos para estos puntos hasta su aprobación formal**:

| ID | Decisión | Qué se Debe Confirmar | Estado Actual |
| :--- | :--- | :--- | :--- |
| **DP-01** | Fórmula de Interés Ordinario | Base de cálculo (sobre saldo o capital total), periodicidad y momento en que se genera. | ⚠️ **Bloqueante** (No inventar) |
| **DP-02** | Alcance de la Exención | Si aplica globalmente a la persona o se define por préstamo; confirmar si la persona exenta también queda exenta de mora. | ⚠️ **Bloqueante** |
| **DP-03** | Modalidad de Devolución | Cuotas fijas mensuales (sistema francés/alemán), interés periódico con capital al vencimiento final, o cobro por periodo. | ⚠️ **Bloqueante** |
| **DP-04** | Regla y Cálculo de Mora | Fórmula, tasa base (diaria/mensual), periodicidad, si capitaliza intereses y tratamiento de días de gracia. | ⚠️ **Bloqueante** |
| **DP-05** | Orden de Imputación de Pagos | Prelación de cobro: ¿el dinero cubre primero mora, luego interés y al final capital, o el usuario decide libremente? | ⚠️ **Bloqueante** |
| **DP-06** | Tratamiento de Pagos Parciales | Confirmar si se admiten abonos inferiores a la cuota y cómo se distribuyen entre los rubros exigibles. | ⚠️ **Bloqueante** |
| **DP-07** | Excedentes de Pago | Definir la política si el pago recibido supera la deuda pendiente total (saldo a favor, anticipo o rechazo). | ⚠️ **Bloqueante** |
| **DP-08** | Reglas de Redondeo y Precisión | Moneda COP no usa decimales en el cobro diario: definir redondeo al entero más cercano o múltiplos de 50/100 COP. | ⚠️ **Bloqueante** |

> [!CAUTION]
> El ejemplo informal de un préstamo de $100.000 que sube a $144.000 no determina por sí solo una fórmula financiera unívoca. No programar la mora ni la capitalización basándose en supuestos no documentados.

## 5. Control de Fechas y Vencimientos
- Si la fecha de vencimiento es posterior a la fecha actual y existe saldo exigible, la obligación se encuentra en estado **Pendiente**.
- Si la fecha de vencimiento ya transcurrió y existe saldo exigible, la obligación se encuentra en estado **Atrasado** (Retrasado).
- Cuando el saldo exigible llega a cero, el estado pasa a **Pagado**.
