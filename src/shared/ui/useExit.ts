import { useEffect, useState } from 'react'

// Mantiene montado un elemento mientras dura su animación de salida.
// Devuelve true desde el instante en que `visible` pasa a true y hasta `outMs` después de pasar a false.
export function useExit(visible: boolean, outMs: number): boolean {
  const [lingering, setLingering] = useState(false)
  useEffect(() => {
    if (visible) {
      setLingering(false)
      return
    }
    setLingering(true)
    const t = setTimeout(() => setLingering(false), outMs)
    return () => clearTimeout(t)
  }, [visible, outMs])
  return visible || lingering
}
