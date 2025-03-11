"use client"

import { DEFAULT_LIMIT } from "@/constant";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton }from '@/modules/videos/ui/components/video-row-card';
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


interface ResultsSectionProps {
  query: string;
  categoryId: string | undefined;
}

export const ResultsSection = (props: ResultsSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <ResultsSectionSuspense {...props}/>
      </ErrorBoundary>
    </Suspense>
  )
}


export const ResultsSectionSuspense = ({ query, categoryId }: ResultsSectionProps) => {
  
  const isMobile = useIsMobile();

  const [results, resultsQuery] = trpc.search.getMany.useSuspenseInfiniteQuery({
    query,
    limit: DEFAULT_LIMIT,
    categoryId,
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
  
  return (
    <>
      {isMobile ? (
        <div className="flex flex-col gap-4 gap-y-10">
          {
            results.pages
              .flatMap((page) => page.items)
              .map((video) => (
                <VideoGridCard 
                  key={video.id} 
                  data={video}
                />
              ))
          }
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {
              results.pages
                .flatMap((page) => page.items)
                .map((video) => (
                  <VideoRowCard
                    key={video.id}
                    data={video}
                  />
                ))
            }
        </div>
      )}
      <InfiniteScroll 
        hasNextPage={resultsQuery.hasNextPage}
        isFetchingNextPage={resultsQuery.isFetchingNextPage}
        fetchNextPage={resultsQuery.fetchNextPage}
      />  
    </>
  )
}
