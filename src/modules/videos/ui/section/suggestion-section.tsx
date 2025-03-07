"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import VideoRowCard from "../components/video-row-card";


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
    <div>
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
  )
}

export default SuggestionSection