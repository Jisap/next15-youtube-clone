"use client"

import { InfiniteScroll } from "@/components/infinite-scroll"
import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import { Suspense, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"



export const VideoSection = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <VideoSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}


export const VideoSectionSuspense = () => {

  const [data, query] = trpc.studio.getMany.useSuspenseInfiniteQuery({  // SuspenseInfiniteQuery de TRPC es una variante de SuspenseQuery de Tanstack Query
    limit: DEFAULT_LIMIT                                                // El objeto query contiene los métodos de consulta para manejar la consulta infinita
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  // TanStack Query maneja la paginación automáticamente al guardar cada respuesta como una "página" dentro de data.pages.

  return (
    <div>
      {JSON.stringify(data)}
      <InfiniteScroll
        isManual                                      
        hasNextPage={query.hasNextPage}                        // hasNextPage: Se determina basándose en la presencia de nextCursor de nuestro procedimiento getMany
        isFetchingNextPage={query.isFetchingNextPage}          // Se activa cuando se está cargando la siguiente página mediante fetchNextPage.
        fetchNextPage={query.fetchNextPage}                    // fetchNextPage es una función que tRPC genera automáticamente. Toma el nextCursor de la última página, hace una nueva petición con ese cursor y añade los nuevos datos al final de data.pages
      />                                                       
    </div>
  )
}

