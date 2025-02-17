import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Detecta si el tamaño de la ventana del navegador es menor a un umbral definido (MOBILE_BREAKPOINT = 768)

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)    // Consulta de medios que detecta si la ventana tiene un ancho menor a MOBILE_BREAKPOINT - 1
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)                        // Actualiza el estado isMobile cuando cambia el tamaño de la ventana.
    }
    mql.addEventListener("change", onChange)                                    // Se añade un eventListener al objeto MediaQueryList (mql), que ejecutará onChange cuando la consulta de medios cambie 
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)                          // Se actualiza el estado inicial isMobile basado en el tamaño actual de la ventana. True si es menor a MOBILE_BREAKPOINT, false en caso contrario.
    return () => mql.removeEventListener("change", onChange)                    // Cuando el componente que usa este hook se desmonta, se elimina el eventListener para evitar fugas de memoria.
  }, [])

  return !!isMobile                                                             // Se devuelve el valor de isMobile, asegurando que siempre sea un booleano
}
