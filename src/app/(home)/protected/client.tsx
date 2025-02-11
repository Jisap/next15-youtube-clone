"use client"

import { trpc } from "@/trpc/client"

export const PageClient = () => {

  const [data] = trpc.hello.useSuspenseQuery({ text: "Antonio" });  // Obtiene los datos precargados del servidor. React espera hasta que los datos estén listos (gracias a useSuspenseQuery).

  return (

    // Muestra "Page Client says: {data.greeting}", donde data.greeting es la respuesta del servidor.
    
    <div>
      Page Client says: {data.greeting}
    </div>
  )
}