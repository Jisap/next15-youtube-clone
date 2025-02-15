"use client"

import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { PlusIcon } from "lucide-react"


const StudioUploadModal = () => {

  const utils = trpc.useUtils();                      // Accde a las utilidades de caché de tRPC
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();             // Invalida la caché de la consulta -> getMany se invoca automaticamente -> se actualiza interfaz UI
    }                                                // tRPC sabe que los datos en la caché ya no son válidos y necesita volver a ejecutar la consulta para obtener los datos más recientes.
  })

  return (
    <Button 
      variant="secondary"
      onClick={() => create.mutate()}
    >
      <PlusIcon className="size-5" />
      <span className="text-sm">Create</span>
    </Button>
  )
}

export default StudioUploadModal