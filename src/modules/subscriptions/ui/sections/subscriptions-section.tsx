"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";


export const SubscriptionsSection = () => {
  return (
    <Suspense  fallback={<SubscriptionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SubscriptionsSectionSuspense  />
      </ErrorBoundary>
    </Suspense>
  )
}

const SubscriptionsSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({length: 18}).map((_, index) => (
          <VideoGridCardSkeleton
            key={index}
          />
        ))}
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoRowCardSkeleton
            key={index}
            size="compact"
          />
        ))}
      </div>  
    </>
  )
}

const SubscriptionsSectionSuspense = () => {
  
  const utils = trpc.useUtils();

  const unsubscribe = trpc.subscriptions.remove.useMutation({
    onSuccess: (data) => {
      toast.success("Unsubscribed");
      utils.subscriptions.getMany.invalidate();
      utils.videos.getManySubscribed.invalidate()
      utils.users.getOne.invalidate({ id: data.creatorId });
    },
    onError: () => {
      toast.error("Something went wrong");
      
    }
  })

  const [subscriptions, query] = trpc.subscriptions.getMany.useSuspenseInfiniteQuery({ 
    limit: DEFAULT_LIMIT
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // [subscriptions.pages] -> cada página contiene [items]
  // flatmap obtiene un solo array -> [item] -> cada item es un subscription

  return (
    <div>
      <div className="flex flex-col gap-4">
        {subscriptions.pages                           // subscriptions.pages es un array de páginas, donde cada página contiene un array de subscriptions (items). 
          .flatMap((page) => page.items)               // Para cada página en subscriptions.pages, flatMap extrae el array de subscriptions (items) y los combina en un solo array de subscriptions.
          .map((subscription) => (                     // Después de aplanar el array de subscriptions, se utiliza map para iterar sobre cada subscription y renderizar un Link para cada uno.    
            <Link
              key={subscription.creatorId}
              href={`/users/${subscription.user.id}`}
            >
              {JSON.stringify(subscription)}
            </Link>
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
