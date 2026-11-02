---
name: figma-to-react-native
description: Metodología para traducir diseños, tokens, componentes y pantallas desde Figma hacia React Native utilizando NativeWind, garantizando alta fidelidad visual y ergonomía móvil.
---

# Figma to React Native — Metodología de Traducción de Diseño

## 1. Objetivo y Contexto
Esta skill define el protocolo para inspeccionar y trasladar con precisión milimétrica los componentes y pantallas diseñados en **Figma** (archivo `ZIAgW0CWQ1T7bETCCOyZQu`) a código **React Native** con clases utilitarias de **NativeWind v4** (TailwindCSS).

## 2. Cuándo Utilizar Esta Skill
- Al maquetar una pantalla nueva o ajustar una existente (`src/app/` o `src/modules/*/components/`).
- Al extraer design tokens (colores, espaciados, tipografías, sombras) desde Figma mediante MCP.
- Al exportar y optimizar iconos y recursos vectoriales como SVG para React Native.
- Al verificar la fidelidad visual de un componente frente al diseño de referencia.

## 3. Protocolo de Inspección con Figma MCP
Antes de escribir el código de una pantalla:
1. **Identificar Nodo en Figma:** Obtener el ID del nodo en Figma (ej. `nodeId: "8:7138"` para login).
2. **Consultar Datos con MCP:**
   - Ejecutar la herramienta `get_figma_data` con el `fileKey` y `nodeId`.
   - Inspeccionar el árbol de layout: `padding`, `gap`, `justifyContent`, `alignItems`, `borderRadius`, `fills`, `strokes` y `boxShadow`.
3. **Descarga de Recursos Vectoriales:**
   - Si el nodo contiene isotipos, logotipos o iconos específicos, usar la herramienta `download_figma_images` especificando formato SVG.

## 4. Design Tokens del Proyecto (Fintech Dark Mode)
Mapeo canónico de valores de Figma a Tailwind / NativeWind:

### 4.1 Colores
- **Fondo Base (Background):** `#09090D` (`bg-[#09090D]`) y `#050508` (`bg-[#050508]`).
- **Superficies de Tarjeta (Cards / Modales):** `#14141B` (`bg-[#14141B]`) o `#1F1F27` (`bg-[#1F1F27]`).
- **Bordes Tenues (Borders / Dividers):** `#262630` (`border-[#262630]`).
- **Acento Primario (Coral Terracota):** `#C94422` (`bg-[#C94422]`, `text-[#C94422]`).
- **Acento Resplandeciente / Hover:** `#FF7854` (`text-[#FF7854]`, `border-[#FF7854]`).
- **Texto Principal (Heading / Text):** `#F5F5F7` o `#FFFFFF` (`text-white`).
- **Texto Secundario (Labels / Subtítulos):** `#A8A29E` (`text-stone-400`).
- **Error y Alerta (Carmesí):** `#FB3758` (`text-[#FB3758]`, `bg-[#FB3758]/10`, `border-[#FB3758]`).
- **Éxito (Verde Fintech):** `#10B981` (`text-emerald-500`).

### 4.2 Tipografías
- **Texto General, Títulos y Botones:** `Plus Jakarta Sans` (`font-['PlusJakartaSans-Regular']`, `font-['PlusJakartaSans-Bold']`).
- **Cifras Monetarias, Códigos y Badges:** `JetBrains Mono` (`font-mono` / `font-['JetBrainsMono-Bold']`).
- **Moneda:** Formato COP en pesos colombianos sin decimales (ej. `$ 100.000 COP`).

### 4.3 Sombras y Elevaciones
- Elevación de tarjeta: `shadow-2xl` combinada con borde `border border-[#262630]`.
- Resplandor activo (focus input): Borde `#FF7854` con anillo sutil `ring-1 ring-[#FF7854]/40`.

## 5. Reglas de Adaptación Móvil
- **Dimensiones Base:** Los marcos de Figma están proyectados para iPhone 390x844 px. Al implementar en React Native, los anchos no deben ser fijos a 390 px; deben ser responsivos (`w-full`, `flex-1`, `px-6`).
- **Áreas Táctiles:** Todo elemento interactivo (botones, inputs, enlaces) debe cumplir con un mínimo de $44 \times 44$ px de área táctil (`min-h-[44px]`).
- **Estados de Interacción:** Agregar estados presionados (`active:opacity-80` o `active:scale-[0.98]`) para proporcionar feedback háptico y visual inmediato.

## 6. Ejemplo de Componente Traducido
```tsx
import React from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import { Mail } from 'lucide-react-native'

interface InputProps {
  readonly label: string
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly error?: string
}

export const CustomInput: React.FC<InputProps> = ({ label, value, onChangeText, error }) => {
  return (
    <View className="w-full gap-2">
      <Text className="text-stone-400 text-xs font-medium font-['PlusJakartaSans-Medium']">
        {label}
      </Text>
      <View 
        className={`flex-row items-center px-4 h-12 bg-[#14141B] rounded-xl border ${
          error ? 'border-[#FB3758]' : 'border-[#262630] focus:border-[#FF7854]'
        }`}
      >
        <Mail size={18} color={error ? '#FB3758' : '#A8A29E'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#71717A"
          className="flex-1 ml-3 text-white text-sm font-['PlusJakartaSans-Regular']"
        />
      </View>
      {error && (
        <Text className="text-[#FB3758] text-xs font-['PlusJakartaSans-Regular']">
          {error}
        </Text>
      )}
    </View>
  )
}
```
