"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
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
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5">
      {Array.from({length: 18}).map((_, index) => (
        <VideoGridCardSkeleton
          key={index}
        />
      ))}
    </div>
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
      <div className="flex flex-col gap-4 gap-y-10">
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
      <InfiniteScroll 
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
}
