"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import VideoRowCard from "../components/video-row-card";
import VideoGridCard from "../components/video-grid-card";


interface SuggestionSectionProps {
  videoId: string;
}

const SuggestionSection = ({ videoId }: SuggestionSectionProps) => {

  const [suggestions] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({
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
    </>
  )
}

export default SuggestionSection