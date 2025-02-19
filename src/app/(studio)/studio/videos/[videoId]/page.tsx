import { VideoView } from "@/modules/studio/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic"


interface PageProps {
  params: Promise<{ videoId: string }>
}

const Page = async({ params }: PageProps) => {

  const { videoId } = await params;

  void trpc.studio.getOne.prefetch( { id: videoId } ); // Petición a la api para obtener el video -> almacenamiento en caché del server.
  void trpc.categories.getMany.prefetch();             // Petición a la api para obtener las categorías -> almacenamiento en caché del server.

  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  )
}

export default Page