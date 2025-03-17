import { trpc } from "@/trpc/client";
import { z } from "zod";
import { ResponsiveModal } from "@/components/responsive-dialog";




interface PlaylistAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};



export const PlaylistAddModal = ({ open, onOpenChange }: PlaylistAddModalProps) => {

  const utils = trpc.useUtils(); // Accede a las utilidades de caché de tRPC

  

   

 

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Add to playlist"
    >
     <div className="flex flex-col gap-2">

     </div>
    </ResponsiveModal>
  )
}