"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PlaylistGridCard, PlaylistGridCardSkeleton } from "../../components/playlist-grid-card";



export const PlaylistsSection = () => {
  return (
    <Suspense fallback={<PlaylistSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <PlaylistsSectionSuspense  />
      </ErrorBoundary>
    </Suspense>
  )
}

const PlaylistSectionSkeleton = () => {
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5">
      {Array.from({ length: 18 }).map((_, index) => (
        <PlaylistGridCardSkeleton
          key={index}
        />
      ))}
    </div>
  )
}


const PlaylistsSectionSuspense = () => {
  const [playlists, query] = trpc.playlists.getMany.useSuspenseInfiniteQuery({ 
    limit: DEFAULT_LIMIT
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // [videos.pages] -> cada página contiene [videos:items]
  // flatmap obtiene un solo array -> [videos:items]

  return (
    <>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5">
        {playlists.pages
          .flatMap((page) => page.items)
          .map((playlist) => (
            <PlaylistGridCard 
              key={playlist.id}
              data={playlist}
            />
          ))
        }
      </div>

      <InfiniteScroll 
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  )
}
