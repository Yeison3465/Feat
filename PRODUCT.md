# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

Existing codebase: Expo / React Native with NativeWind, Expo Router, Reanimated, lucide-react-native. Redesign is drawn in Figma first, then implemented in code.

## Users

A private lender (an individual, not a company) who lends money in Colombian pesos to people they know and tracks it from their phone. The job: see at a glance how much is owed, who is late, what is due soon, and register payments quickly.

## Product Purpose

Personal loan portfolio manager. Registers borrowers (personas), creates loans (prestamos) with installments, registers payments (pagos), calculates interest and late fees (mora), and reports portfolio metrics. Success: the lender always knows their exposure and who to collect from today.

## Positioning

A private-banking feel for a one-person lending book: the lender's own loans, borrowers and collections in one calm place, in COP.

## Operating Context

Phone-first, used daily, often quickly (check due dates, register a payment). Amounts in COP formatted with thousands separators. Spanish UI. Data lives in the app's backend (auth with login and password recovery).

## Capabilities and Constraints

Screens: Login, Recuperar contraseña, Dashboard, Préstamos (lista, crear, detalle, editar), Personas (lista, crear, detalle), Pagos (registrar, detalle), Vencimientos, Configuración (interés y mora), Splash, modales (confirmar, selector de fecha, selector de prestatario, detalle de cuota).

Dashboard content that MUST be preserved (design may change, content may not):
- Period selector: Mes actual / Últimos 30d / Histórico.
- Overdue alert banner: personas en mora, cuotas vencidas, saldo en mora; or "Cartera 100% al día" state.
- Hero: Cartera total por cobrar, Capital pendiente (de capital prestado), Interés por cobrar, Mora acumulada pendiente.
- Area/bar chart "Pagos del periodo" with total recaudado, curve/bars toggle, scrubber tooltip.
- Quick actions: Préstamo, Personas, Agenda.
- Métricas financieras with General/Detallado toggle. General: Ganancia cobrada, Interés pendiente, Capital colocado, Prestatarios activos. Detallado: Capital recuperado (tasa %), Rendimiento neto ROI, Índice morosidad, Ticket promedio, Desglose de ganancias (interés ordinario vs mora cobrada), Cartera por modalidad (Solo interés, Cuotas fijas, Pago único).
- Prestatarios activos (horizontal cards: initials/photo, Atraso/Al día, créditos, saldo total, llamar) + Nueva persona.
- Próximos vencimientos (up to 3: nombre, código #PR-XXXX, fecha, VENCE HOY / En Nd, saldo exigible, botón Cobrar).
- Actividad reciente (3 loans) with empty state.

## Brand Commitments

User-pinned (2026-11-07): redesign the whole look while every displayed data point, metric and action stays the same. Primary reference: "Evora" (automotive editorial site) rendered in dark: neutral black ground, white as the highlight (pill buttons, selected states), large tight grotesk headings, generous space, very rounded cards, photography carrying the color. Secondary references: Finexy (bento metrics, one highlighted card), a dark "Workspace" CRM (list cards with portrait, round arrow button, big counters, filter chips), a car-rental app (floating pill bottom nav). Minimalist, luxury, alive, photos not only icons. Red only for late/mora. Emerald accent was tried and rejected. Platform inferred from the repo's Android EAS build configuration; iOS not confirmed.

## Evidence on Hand

No real photos, logos or brand assets exist. Imagery will be generated (Figma AI) and must be treated as illustrative. Dashboard figures in designs are demonstration data in COP.

## Product Principles

1. Money truth first: every figure is exact, readable and never decorative.
2. Today's action first: who to collect from before anything else.
3. Calm authority: restraint and space over density; nothing shouts except real risk.
4. Every existing metric keeps its place in the information hierarchy.

## Accessibility & Inclusion

Spanish (Colombia) copy. Sufficient contrast on dark grounds for amounts and statuses; do not rely on color alone for late/on-time states.
