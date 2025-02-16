"use client"

import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import { Suspense, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"


export const VideoSection = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <VideoSectionuSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}


export const VideoSectionuSuspense = () => {

  const [data] = trpc.studio.getMany.useSuspenseInfiniteQuery({
    limit: DEFAULT_LIMIT
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  

  return (
    <div>
      {JSON.stringify(data)}
  
    </div>
  )
}

