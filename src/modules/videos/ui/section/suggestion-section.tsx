"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import VideoRowCard from "../components/video-row-card";
import VideoGridCard from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";


interface SuggestionSectionProps {
  videoId: string;
  isManual?: boolean;
}

const SuggestionSection = ({ videoId, isManual }: SuggestionSectionProps) => {

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