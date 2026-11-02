---
name: mobile-security
description: Directrices de seguridad en aplicaciones móviles, protección de tokens, uso exclusivo de claves públicas, Row Level Security estricto y prevención de fugas de datos.
---

# Mobile Security — Directrices de Seguridad y Privacidad

## 1. Objetivo y Contexto
Esta skill establece los principios obligatorios de seguridad informática, protección criptográfica y privacidad de datos para la aplicación móvil de préstamos, garantizando que el usuario prestamista mantenga el control total y privado de su información financiera.

## 2. Cuándo Utilizar Esta Skill
- Al configurar o manejar credenciales de acceso y variables de entorno (`.env`).
- Al diseñar o auditar políticas de Row Level Security (RLS) en Supabase.
- Al implementar almacenamiento local o en memoria de sesiones de usuario.
- Al manejar errores o excepciones para evitar la divulgación de información sensible (RNF-003).

## 3. Manejo Seguro de Credenciales y Entorno
1. **Regla de Claves Públicas vs Privadas:**
   - La aplicación móvil **solo debe contener** la clave pública anónima de Supabase (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) y la URL (`EXPO_PUBLIC_SUPABASE_URL`).
   - **PROHIBIDO:** Incluir claves con permisos elevados (`service_role` o contraseñas de conexión directa a PostgreSQL) dentro del código de la app o en archivos `.env` empaquetados en el cliente.
2. **Protección en Git:**
   - Mantener `.env`, `.env.local` y carpetas de caché `.expo/` estrictamente excluidas en `.gitignore`.
   - No comitear nunca tokens o credenciales de prueba reales.

## 4. Gestión de Sesión y Almacenamiento Local
- **Persistencia Cifrada / Segura:**
  - El token JWT de Supabase se guarda localmente mediante `@react-native-async-storage/async-storage` con `autoRefreshToken: true`.
  - La aplicación debe manejar la expiración y renovación transparente del token en segundo plano.
- **Protección Durante la Carga:**
  - Mientras la aplicación valida si existe una sesión válida al inicio, debe mostrarse una pantalla de carga neutral (Splash / SCR-01).
  - Nunca renderizar fragmentos de datos privados ni estados en memoria antes de confirmar la validez de la sesión autenticada.
- **Cierre Seguro de Sesión:**
  - Al cerrar sesión (`supabase.auth.signOut()`), limpiar completamente los estados en memoria, la caché de consultas y redirigir inmediatamente a la pantalla de login.

## 5. Control de Acceso por RLS (Row Level Security)
- **Aislamiento Multi-Tenant Estricto:**
  - Dado que la aplicación está diseñada para uso privado del prestamista, ningún usuario debe tener visibilidad sobre las personas, préstamos o pagos registrados por otro usuario.
  - La verificación de propiedad debe ocurrir en la capa de base de datos a través de `propietario_id = auth.uid()`.
  - No confiar en filtros de UI (como `.eq('propietario_id', user.id)` en el cliente) como sustituto de RLS; si el cliente omite el filtro, la base de datos debe aplicar la restricción automáticamente.

## 6. Manejo Seguro de Errores y Validaciones
- **No Divulgación de Stack Traces:**
  - Ante un fallo de red o error de base de datos (ej. violación de restricción `CHECK`), la interfaz debe presentar un mensaje comprensible y amigable (ej. "No fue posible registrar la operación. Inténtalo de nuevo.").
  - No mostrar mensajes crudos de SQL, esquemas de tablas ni información sensible en alertas de usuario.
- **Validación en Dos Capas:**
  - La validación en el cliente (UI) mejora la experiencia de usuario y evita llamadas innecesarias.
  - La validación final y definitiva siempre reside en las restricciones de PostgreSQL y en las políticas RLS.
