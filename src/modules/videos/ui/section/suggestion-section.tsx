"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import VideoRowCard from "../components/video-row-card";
import VideoGridCard from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


interface SuggestionSectionProps {
  videoId: string;
  isManual?: boolean;
}

export const SuggestionSection = ({ videoId, isManual }: SuggestionSectionProps) => {
  return (
    <Suspense fallback={<p>loading...</p>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SuggestionSectionSuspense videoId={videoId} isManual={isManual} /> fallback={<p></p>}
      </ErrorBoundary>
    </Suspense>
  )
}

const SuggestionSectionSuspense = ({ videoId, isManual }: SuggestionSectionProps) => {

  const [suggestions, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({
    videoId: videoId,
    limit: DEFAULT_LIMIT,
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block space-y-3">
        {suggestions.pages.flatMap(
          (page) => page.items.map(
            (video) => (
              <VideoRowCard 
                key={video.id}
                data={video}
                size="compact"
              />
            )
          )
        )}
      </div>

      {/* Mobile */}
      <div className="block md:hidden space-y-10">
        {suggestions.pages.flatMap(
          (page) => page.items.map(
            (video) => (
              <VideoGridCard
                key={video.id}
                data={video}
              />
            )
          )
        )}
      </div>

      <InfiniteScroll 
        isManual={isManual}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  )
}

export default SuggestionSection