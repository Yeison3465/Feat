---
name: project-guidelines
description: Directrices del proyecto, arquitectura modular por funcionalidad, reglas de no-acoplamiento, convenciones de código y metodología de desarrollo por bloques.
---

# Project Guidelines — Directrices del Proyecto

## 1. Objetivo y Contexto
Esta skill proporciona las directrices arquitectónicas, reglas de diseño de software y procedimientos obligatorios para la aplicación móvil privada de gestión de préstamos personales. Su objetivo es mantener una estructura ágil, limpia, desacoplada y directamente alineada con el **Plan de desarrollo v2.0**.

## 2. Cuándo Utilizar Esta Skill
- Al iniciar o planificar cualquier nuevo bloque de trabajo (Bloques 0 al 7).
- Al definir la ubicación de nuevos componentes, hooks, servicios o utilidades.
- Al evaluar si una decisión técnica respeta los principios de no-acoplamiento o introduce sobreingeniería.
- Al revisar la integridad de la estructura de archivos del proyecto.

## 3. Arquitectura Modular por Funcionalidad
El proyecto adopta una arquitectura modular sencilla donde cada funcionalidad agrupa sus piezas y expone solo lo necesario:

```text
src/
├── app/                  # Rutas y layouts de Expo Router exclusivamente.
│   ├── (auth)/           # Rutas públicas de autenticación.
│   ├── (tabs)/           # Navegación principal por pestañas.
│   ├── personas/         # Rutas de gestión de prestatarios.
│   ├── prestamos/        # Rutas de créditos y amortización.
│   ├── pagos/            # Rutas de registro y detalle de pagos.
│   └── _layout.tsx       # Layout raíz.
│
├── modules/              # Funcionalidades del dominio de negocio.
│   ├── auth/             # Autenticación, sesión y perfil de prestamista.
│   ├── people/           # Directorio de personas, datos y exenciones.
│   ├── loans/            # Préstamos, condiciones, cuotas y liquidación.
│   ├── payments/         # Pagos, abonos, distribución y reversos.
│   ├── dashboard/        # Métricas consolidadas e indicadores de cartera.
│   └── settings/         # Parámetros por defecto (tasas, días de gracia).
│       ├── components/   # Componentes visuales privados del módulo.
│       ├── hooks/        # Lógica de estado y orquestación del módulo.
│       ├── services/     # Llamadas a Supabase y operaciones de datos.
│       └── types.ts      # Contratos e interfaces del módulo.
│
├── shared/               # Recursos reutilizados por dos o más módulos.
│   ├── components/       # Botones, inputs, badges, tarjetas genéricas.
│   ├── hooks/            # Hooks utilitarios (red, teclado, orientación).
│   ├── utils/            # Formato de moneda COP, fechas, cálculos auxiliares.
│   ├── constants/        # Tokens de diseño, nombres de rutas, valores fijos.
│   └── types/            # Tipos globales y definiciones de base de datos.
│
└── lib/
    └── supabase.ts       # Inicialización del cliente Supabase.
```

## 4. Reglas Estrictas para Evitar Acoplamiento
1. **Separación de Pantallas y Dominio:** Los archivos en `src/app/` solo conectan la navegación con los componentes del módulo correspondiente. No deben contener lógica de cálculo ni llamadas directas al backend.
2. **Cero Consultas en UI:** Ningún componente visual (JSX/TSX) debe importar directamente el cliente de Supabase ni ejecutar consultas SQL. Deben consumir hooks o servicios del módulo.
3. **Encapsulamiento de Módulos:** Un módulo no debe importar archivos internos de otro módulo de forma desordenada. Si se requiere compartir una funcionalidad, debe exponerse a través de una interfaz o promoverse a `src/shared/`.
4. **Módulos Ligeros:** No crear submódulos innecesarios para cuotas o auditoría; deben residir dentro de `loans` o `payments` mientras la complejidad lo amerite.

## 5. Metodología de Desarrollo por Bloques
Cada bloque debe ejecutarse rigurosamente bajo el ciclo de 6 pasos:
1. **Analizar:** Revisar requerimientos funcionales (RF), pantallas (SCR), tablas y dependencias.
2. **Planificar:** Dividir el bloque en tareas atómicas y ordenadas.
3. **Implementar:** Desarrollar únicamente lo requerido por el bloque, sin adelantar bloques dependientes.
4. **Probar:** Ejecutar los casos de aceptación (T-001 a T-012) con el QA Engineer.
5. **Revisar:** Comprobar que el código cumpla con TypeScript estricto y no rompa el desacoplamiento.
6. **Cerrar:** Documentar qué se completó, qué cambió y qué queda pendiente en el registro del bloque.

## 6. Restricciones
- No inicializar repositorios Git si el usuario instruyó no hacerlo.
- No instalar dependencias de terceros sin justificar su necesidad frente al bundle nativo.
- No alterar esquemas de base de datos sin documentar la migración y evaluar dependencias.
