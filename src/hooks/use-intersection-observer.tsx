import { useEffect, useRef, useState } from "react";

// Sirve para detectar cuándo un elemento entra o sale del viewport (la parte visible de la pantalla) del usuario.

export const useIntersectionObserver = (options?: IntersectionObserverInit) => { 
  const [isIntersecting, setIsIntersecting] = useState(false);                        // Indica si el elemento está visible
  const targetRef = useRef<HTMLDivElement>(null);                                     // Referencia targetRef para el elemento que queremos observar

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {                          // Creamos un nuevo observador de intersección y el callback del observer recibe un array de entries y destructura el primer elemento -> targetRef
      setIsIntersecting(entry.isIntersecting);                                        // Actualiza el estado isIntersecting según si el elemento está visible o no
    }, options);

    if (targetRef.current) {                                                          // Si el targetRef no es null, entonces observamos el elemento
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect()
    
  },[options])

  return { isIntersecting, targetRef }
}

// entries solo tendrá un elemento porque solo observamos uno
// const entry = entries[0];  // Es lo mismo que hacer [entry]