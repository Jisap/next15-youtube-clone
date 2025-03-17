import { trpc } from "@/trpc/client";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { DEFAULT_LIMIT } from "@/constant";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfiniteScroll } from "@/components/infinite-scroll";




interface PlaylistAddModalProps {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
};



export const PlaylistAddModal = ({ open, onOpenChange, videoId }: PlaylistAddModalProps) => {

  const { 
    data: playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.playlists.getManyForVideo.useInfiniteQuery({    // playlists de un usuario autenticado con info extra sobre si un video concreto se encuentra en ellas
    videoId: videoId,
    limit: DEFAULT_LIMIT,
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
              <Button 
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start px-2 [&_svg]:size-5"
                size="lg"
              >
                {playlist.containsVideo 
                  ? <SquareCheckIcon className="mr-2"/>
                  : <SquareIcon className="mr-2"/>
                }
                {playlist.name}
              </Button>
            ))
       }

       {!isLoading && (
          <InfiniteScroll 
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isManual
          />
       )}
     </div>
    </ResponsiveModal>
  )
}