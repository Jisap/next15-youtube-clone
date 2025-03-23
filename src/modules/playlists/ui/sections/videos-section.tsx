"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface VideosSectionProps {
  playlistId: string;
}

export const VideosSection = (props: VideosSectionProps) => {
  return (
    <Suspense  fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideosSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  )
}

const VideosSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({length: 18}).map((_, index) => (
          <VideoGridCardSkeleton
            key={index}
          />
        ))}
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoRowCardSkeleton
            key={index}
            size="compact"
          />
        ))}
      </div>  
    </>
  )
}

const VideosSectionSuspense = ({ playlistId }: VideosSectionProps) => {
  const [videos, query] = trpc.playlists.getVideos.useSuspenseInfiniteQuery({ 
    playlistId,
    limit: DEFAULT_LIMIT,
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const utils = trpc.useUtils();

  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: (data) => {
      toast.success("Video remove from playlist");
      utils.playlists.getMany.invalidate()
      utils.playlists.getManyForVideo.invalidate({ videoId: data.videoId })
      utils.playlists.getOne.invalidate({ id: data.playlistId })
      utils.playlists.getVideos.invalidate({ playlistId: data.playlistId })
    },
    onError: () => {
      toast.error("Something went wrong");
    }
  })

  // [videos.pages] -> cada página contiene [videos:items]
  // flatmap obtiene un solo array -> [videos:items]

  return (
    <div>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {videos.pages                           // videos.pages es un array de páginas, donde cada página contiene un array de videos (items). 
          .flatMap((page) => page.items)        // Para cada página en videos.pages, flatMap extrae el array de videos (items) y los combina en un solo array de videos.
          .map((video) => (                     // Después de aplanar el array de videos, se utiliza map para iterar sobre cada video y renderizar un componente VideoGridCard para cada uno.    
            <VideoGridCard 
              key={video.id}
              data={video}
              onRemove={() => removeVideo.mutate({ videoId: video.id, playlistId })}
            />
          ))
        }
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {videos.pages                           // videos.pages es un array de páginas, donde cada página contiene un array de videos (items). 
          .flatMap((page) => page.items)        // Para cada página en videos.pages, flatMap extrae el array de videos (items) y los combina en un solo array de videos.
          .map((video) => (                     // Después de aplanar el array de videos, se utiliza map para iterar sobre cada video y renderizar un componente VideoGridCard para cada uno.    
            <VideoRowCard
              key={video.id}
              data={video}
              size="compact"
              onRemove={() => removeVideo.mutate({ videoId: video.id, playlistId })}
            />
          ))
        }
      </div>
      <InfiniteScroll 
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}
