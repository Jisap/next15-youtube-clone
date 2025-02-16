import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { is } from "drizzle-orm";
import { useEffect } from "react";



interface InfiniteScrollProps {
  isManual?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export const InfiniteScroll = ({
  isManual=false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollProps) => {

  const { isIntersecting, targetRef } = useIntersectionObserver({
    threshold: 0.5,                                                               // Señal de que el elemento está visible
    rootMargin: "100px",                                                          // Margen de la pantalla donde el elemento está visible
  });

  useEffect(() => {
    if(isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage();
    }
  },[isIntersecting, hasNextPage, isFetchingNextPage, isManual])

  return (
    <div className="flex flex-col items-center gap-4 p-4"> 
      <div ref={targetRef} className="h-1"/>
    </div>
  )
}