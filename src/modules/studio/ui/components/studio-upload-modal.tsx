"use client"

import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { PlusIcon } from "lucide-react"


const StudioUploadModal = () => {

  const utils = trpc.useUtils();                      // Accde a las utilidades de caché de tRPC
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {                                // Si la mutation fue exitosa
      utils.studio.getMany.invalidate();              // se invalida la caché de la consulta -> getMany se invoca automaticamente -> se actualiza interfaz UI
    }                                                
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