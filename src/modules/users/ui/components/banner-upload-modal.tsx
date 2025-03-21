import { ResponsiveModal } from "@/components/responsive-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";


interface BannerUploadModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BannerUploadModal = ({ userId, open, onOpenChange }: BannerUploadModalProps) => {

  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.users.getOne.invalidate({ id: userId });       // Invalida la consulta del usuario actual para actualizar el estado de la vista. 
    onOpenChange(false);                                 // Cierra el modal
  }

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Upload Banner"
    >
      <UploadDropzone
        // bannerlUploader viene de la configuración de nuestro router de archivos en src/app/api/uploadthing/core.ts
        endpoint="bannerlUploader"
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  )
}