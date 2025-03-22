"use client"


import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constant";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { SubscriptionItem, SubscriptionItemSkeleton } from "../components/subscription-item";


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
      <div className="flex flex-col gap-4">
        {Array.from({length: 8}).map((_, index) => (
          <SubscriptionItemSkeleton
            key={index}
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
              <SubscriptionItem
                name={subscription.user.name}
                imageUrl={subscription.user.imageUrl}
                subscriberCount={subscription.user.subscriberCount}
                onUnsubscribe={() => unsubscribe.mutate({ userId: subscription.creatorId })}
                disabled={unsubscribe.isPending}
              />
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
