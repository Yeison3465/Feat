import { useEffect, useState } from 'react'

// Mantiene montado un elemento mientras dura su animación de salida.
// Devuelve true desde el instante en que `visible` pasa a true y hasta `outMs` después de pasar a false.
export function useExit(visible: boolean, outMs: number): boolean {
  const [lingering, setLingering] = useState(false)
  const [prevVisible, setPrevVisible] = useState(visible)
  // El cambio se registra durante el propio render: si esperara a un efecto, habría un cuadro con el elemento
  // ya desmontado y la salida se vería cortada de golpe.
  if (prevVisible !== visible) {
    setPrevVisible(visible)
    setLingering(!visible)
  }
  useEffect(() => {
    if (visible) return
    const t = setTimeout(() => setLingering(false), outMs)
    return () => clearTimeout(t)
  }, [visible, outMs])
  return visible || lingering
}
