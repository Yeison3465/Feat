import React, { useState } from 'react'
import { Image, ImageSourcePropType, LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native'

// Últimas medidas conocidas por foto: al volver a montar una tarjeta (filtrar, cambiar de vista) la foto se dibuja
// en el primer cuadro con la medida anterior, sin esperar a onLayout, y no hay parpadeo.
const lastBox = new Map<string, { w: number; h: number }>()

interface CoverImageProps {
  readonly source: ImageSourcePropType
  // Punto focal de la foto (0 a 1): equivale al object-position del prototipo
  readonly focusX?: number
  readonly focusY?: number
  readonly style?: StyleProp<ViewStyle>
  readonly children?: React.ReactNode
}

// Foto que cubre su contenedor (como object-fit: cover) y se encuadra en un punto focal.
// Dibuja la imagen con medidas explícitas calculadas del contenedor, así siempre llega a todos los bordes.
export const CoverImage: React.FC<CoverImageProps> = ({ source, focusX = 0.5, focusY = 0.5, style, children }) => {
  const asset = Image.resolveAssetSource(source as number)
  const cacheKey = String(asset?.uri ?? source)
  const [box, setBox] = useState(() => lastBox.get(cacheKey) ?? { w: 0, h: 0 })
  const iw = asset?.width || 1
  const ih = asset?.height || 1

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    lastBox.set(cacheKey, { w: width, h: height })
    setBox((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }))
  }

  const scale = box.w > 0 ? Math.max(box.w / iw, box.h / ih) : 1
  const sw = iw * scale
  const sh = ih * scale

  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={onLayout}>
      {box.w > 0 && (
        <Image
          source={source}
          fadeDuration={0}
          style={{
            position: 'absolute',
            width: sw,
            height: sh,
            left: -(sw - box.w) * focusX,
            top: -(sh - box.h) * focusY,
          }}
        />
      )}
      {children}
    </View>
  )
}
