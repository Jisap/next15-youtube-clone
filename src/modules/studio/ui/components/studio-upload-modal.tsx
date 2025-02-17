"use client"

import { ResponsiveModal } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { StudioUploader } from "./studio-uploader"


const StudioUploadModal = () => {

  const utils = trpc.useUtils();                      // Accede a las utilidades de caché de tRPC

  const create = trpc.videos.create.useMutation({     // Cuando se hace click en create se llama al procedimiento create -> invoca un uploader de mux -> devuelve una url -> abre el modal de progreso de carga
    onSuccess: () => {                                // Si la mutation fue exitosa
      toast.success("Video created")
      utils.studio.getMany.invalidate();              // se invalida la caché de la consulta -> getMany se invoca automaticamente -> se actualiza interfaz UI
    },
    onError: (err) => {
      toast.error(err.message)
    }                                                
  })

  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!create.data?.url}                // Si la mutation devuelve la url del video
        onOpenChange={() => create.reset()}      // Se resetea la mutation cuando se cierra el modal
      >
        {create.data?.url 
          ? <StudioUploader 
              endpoint={create.data?.url} 
              onSuccess={() => {}}
            /> 
          : <Loader2Icon className="animate-spin" />
        }
      </ResponsiveModal>
        <Button 
          variant="secondary"
          onClick={() => create.mutate()}
          disabled={create.isPending}                     // Se deshabilita el botón si la mutation está en proceso
        >
          {create.isPending ? <Loader2Icon className="animate-spin" /> :<PlusIcon className="size-5" />}
          <span className="text-sm">Create</span>
        </Button>
    </>
  )
}

export default StudioUploadModal