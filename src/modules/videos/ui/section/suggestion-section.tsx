"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"


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
      {JSON.stringify(suggestions)}
    </div>
  )
}

export default SuggestionSection