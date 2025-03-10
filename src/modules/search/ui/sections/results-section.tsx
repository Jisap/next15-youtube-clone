"use client"

import { DEFAULT_LIMIT } from "@/constant";
import { trpc } from "@/trpc/client";

interface ResultsSectionProps {
  query: string;
  categoryId: string | undefined;
}

export const ResultsSection = ({ query, categoryId }: ResultsSectionProps) => {
  
  const [results, resultQuery] = trpc.search.getMany.useSuspenseInfiniteQuery({
    query,
    limit: DEFAULT_LIMIT,
    categoryId,
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
  
  return (
    <div>
      {JSON.stringify(results)}
    </div>
  )
}
