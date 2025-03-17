import { trpc } from "@/trpc/client";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { DEFAULT_LIMIT } from "@/constant";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";




interface PlaylistAddModalProps {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
};



export const PlaylistAddModal = ({ open, onOpenChange, videoId }: PlaylistAddModalProps) => {

  const { 
    data: playlists,
    isLoading,
  } = trpc.playlists.getManyForVideo.useInfiniteQuery({    // playlists de un usuario autenticado con info extra sobre si un video concreto se encuentra en ellas
    videoId: videoId,
    limit: DEFAULT_LIMIT
   },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:  !!videoId && open,                           // Si existe el videoId y el modal está abierto, se activa la consulta
   });

 

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}                     
      title="Add to playlist"
    >
     <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
       {!isLoading &&
          playlists?.pages
            .flatMap((page) => page.items)
            .map((playlist) => (
              <Button key={playlist.id}>
                {playlist.name}
              </Button>
            ))
       }
     </div>
    </ResponsiveModal>
  )
}