"use client"

import { InfiniteScroll } from "@/components/infinite-scroll"
import { DEFAULT_LIMIT } from "@/constant"
import { trpc } from "@/trpc/client"
import { Suspense, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail"
import { snakeCaseToTitle } from "@/lib/utils"
import { format } from "date-fns"
import { Globe2Icon, LockIcon } from "lucide-react"




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

  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery({  // SuspenseInfiniteQuery de TRPC es una variante de SuspenseQuery de Tanstack Query
    limit: DEFAULT_LIMIT                                                  // El objeto query contiene los métodos de consulta para manejar la consulta infinita
  },{
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  // TanStack Query maneja la paginación automáticamente al guardar cada respuesta como una "página" dentro de videos.pages.

  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[510px]">Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.pages.flatMap(
              (page) => page.items.map(
                (video) => {
                  return (
                  <Link href={`/studio/videos/${video.id}`} key={video.id} legacyBehavior>
                    <TableRow className="cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="relative aspect-video w-36 shrink-0">
                            <VideoThumbnail 
                              imageUrl={video.thumbnailUrl} 
                              previewUrl={video.previewUrl} 
                              title={video.title}  
                              duration={video.duration || 0}
                            />
                          </div>
                          <div className="flex flex-col overflow-hidden gap-y-1">
                            <span className="text-sm line-clamp-1">{video.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{video.description || "No description"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {
                            video.visibility === "private" 
                              ? (<LockIcon className="size-4 mr-2" />) 
                              : (<Globe2Icon className="size-4 mr-2" />)
                          }
                          {snakeCaseToTitle(video.visibility)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {snakeCaseToTitle(video.muxStatus || "error")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm truncate">
                        {format(new Date(video.createdAt), "d MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        views
                      </TableCell>
                      <TableCell className="text-right">
                        Comments
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        Likes
                      </TableCell>
                    </TableRow>
                  </Link>
                )}
              )
            )}
          </TableBody>
        </Table>
      </div>
      
      <InfiniteScroll
        isManual                                      
        hasNextPage={query.hasNextPage}                        // hasNextPage: Se determina basándose en la presencia de nextCursor de nuestro procedimiento getMany
        isFetchingNextPage={query.isFetchingNextPage}          // Se activa cuando se está cargando la siguiente página mediante fetchNextPage.
        fetchNextPage={query.fetchNextPage}                    // fetchNextPage es una función que tRPC genera automáticamente. Toma el nextCursor de la última página, hace una nueva petición con ese cursor y añade los nuevos datos al final de videos.pages
      />                                                       
    </div>
  )
}

