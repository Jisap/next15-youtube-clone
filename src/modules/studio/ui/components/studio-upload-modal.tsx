"use client"

import { ResponsiveModal } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { StudioUploader } from "./studio-uploader"
import { useRouter } from "next/navigation"


const StudioUploadModal = () => {

  const router = useRouter();
  const utils = trpc.useUtils();                           // Accede a las utilidades de caché de tRPC

  const create = trpc.videos.create.useMutation({          // Cuando se hace click en create se llama al procedimiento create -> devuelve una url de subida -> abre el modal de carga del video con la url obtenida
    onSuccess: () => {                                     // Si la mutation fue exitosa
      toast.success("Video created")
      utils.studio.getMany.invalidate();                   // se invalida la caché de la consulta -> getMany se invoca automaticamente -> se actualiza interfaz UI
    },
    onError: (err) => {
      toast.error(err.message)
    }                                                
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSuccess = () => {
    if(!create.data?.video.id) return;
    create.reset();                                         // Se resetea la mutation cuando se cierra el modal
    router.push(`/studio/videos/${create.data?.video.id}`)  // Se redirige a la página de edición del video
  }

  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!create.data?.url}                           // Si la mutation devuelve la url de subida del video se abre el modal que contiene el uploader
        onOpenChange={() => create.reset()}                 // Se resetea la mutation cuando se cierra el modal
      >
        {create.data?.url 
          ? <StudioUploader 
              endpoint={create.data?.url}                   // Al uploader de mux se le pasa la url de subida del video
              onSuccess={() => {}}
            /> 
          : <Loader2Icon className="animate-spin" />
        }
      </ResponsiveModal>
        <Button 
          variant="secondary"
          onClick={() => create.mutate()}
          disabled={create.isPending}                       // Se deshabilita el botón si la mutation está en proceso
        >
          {create.isPending ? <Loader2Icon className="animate-spin" /> :<PlusIcon className="size-5" />}
          <span className="text-sm">Create</span>
        </Button>
    </>
  )
}

export default StudioUploadModal