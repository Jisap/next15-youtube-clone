import { ResponsiveModal } from "@/components/responsive-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";


interface ThumbnailUploadModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({ videoId, open, onOpenChange }: ThumbnailUploadModalProps) => {

  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.studio.getOne.invalidate({ id: videoId });      // Invalida la consulta del video actual para actualizar el estado de la vista. 
    utils.studio.getMany.invalidate();                    // Invalida la consulta de todos los videos del studio para actualizar el estado de la lista.
    onOpenChange(false);                                  // Cierra el modal
  }

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Upload Thumbnail"
    >
      <UploadDropzone
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  )
}