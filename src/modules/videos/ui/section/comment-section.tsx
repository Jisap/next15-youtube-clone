"use client"

import { InfiniteScroll } from "@/components/infinite-scroll"
import { DEFAULT_LIMIT } from "@/constant"
import { CommentForm } from "@/modules/comments/ui/components/comment-form"
import { CommentItem } from "@/modules/comments/ui/components/comment-item"
import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

interface CommentSectionProps {
  videoId: string
}


export const CommentSection = ({ videoId }: CommentSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CommentSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CommentSectionSuspense = ({ videoId }: CommentSectionProps) => {

  const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery({          // SuspenseInfiniteQuery de TRPC es una variante de SuspenseQuery de Tanstack Query
    videoId, limit: DEFAULT_LIMIT                                                     // El objeto query contiene los métodos de consulta para manejar la consulta infinita 
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor                               // getNextPageParam determina cuál será el cursor para la próxima página de datos.
  }                                                                                   // lastPage representa la última página de datos recibida desde el backend.
  )                                                                                   // lastPage.nextCursor es el cursor que el backend devolvió para obtener la siguiente tanda de comentarios.

  // TanStack Query maneja la paginación automáticamente al guardar cada respuesta como una "página" dentro de comments.pages.

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <h1>
          0 Comments
        </h1>
        <CommentForm videoId={videoId} />
        <div className="flex flex-col gap-4 mt-2">
          {comments.pages.flatMap(
            (page) => page.data).map(
              (comment) => (
                <CommentItem 
                  key={comment.id}
                  comment={comment}
                />
          ))}
          <InfiniteScroll
            isManual
            hasNextPage={query.hasNextPage}                        // hasNextPage: Se determina basándose en la presencia de nextCursor de nuestro procedimiento getMany
            isFetchingNextPage={query.isFetchingNextPage}          // Se activa cuando se está cargando la siguiente página mediante fetchNextPage.
            fetchNextPage={query.fetchNextPage}                    // fetchNextPage es una función que tRPC genera automáticamente. Toma el nextCursor de la última página, hace una nueva petición con ese cursor y añade los nuevos datos al final de videos.pages
          />    
        </div>
      </div>
    </div>
  )
}

export default CommentSection