"use client"

import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { VideoPlayer } from '../components/video-player';
import { VideoBanner } from '../components/video-banner';
import { VideoTopRow } from '../components/video-top-row';
import { useAuth } from '@clerk/nextjs';



interface VideoSectionProps {
  videoId: string
}

const VideoSection = ({ videoId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <VideoSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
  
  const { isSignedIn } = useAuth();

  const utils = trpc.useUtils();
  const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });     // Obtiene el video con el id especificado

  const createView = trpc.videoViews.create.useMutation({                   // Obtiene la mutación para crear una nueva visualización del video
    onSuccess: () => {                                                      // Si tiene éxito, se invalida la consulta para obtener el video actualizado
      utils.videos.getOne.invalidate({ id: videoId });                      // Invalida la consulta para obtener el video actualizado
    }                                                      
  });                  

  const handlePlay = () => {                                                // Cuando se reproduce el video,
    if(!isSignedIn) return;                                                 // si el usuario esta autenticado
    createView.mutate({ videoId });                                         // se aplica la mutación y se crea una nueva visualización del video
  }
 
  return (
   <>
      <div className={cn(
        "aspect-video bg-black rounded-xl overflow-hidden relative",
        video.muxStatus !== "ready" && "rounded-b-none"
      )}>
        <VideoPlayer 
          autoPlay
          onPlay={handlePlay}
          playbackId={video.muxPlayBackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>
      <VideoBanner status={video.muxStatus} />
      <VideoTopRow video={video}/>
   </>
  )
}

export default VideoSection