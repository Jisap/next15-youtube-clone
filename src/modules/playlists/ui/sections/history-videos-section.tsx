"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const HistoryVideosSection = () => {
  return (
    <Suspense  fallback={<HistoryVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <HistoryVideosSectionSuspense  />
      </ErrorBoundary>
    </Suspense>
  )
}

const HistoryVideosSectionSkeleton = () => {
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

const HistoryVideosSectionSuspense = () => {
  const [videos, query] = trpc.playlists.getHistory.useSuspenseInfiniteQuery({ 
    limit: DEFAULT_LIMIT
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

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
