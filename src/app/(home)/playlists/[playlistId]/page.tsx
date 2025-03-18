import { DEFAULT_LIMIT } from "@/constant"
import { VideosView } from "@/modules/playlists/ui/views/videos-view"
import { HydrateClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic" // Cada vez que un usuario acceda a la página, se hará una solicitud al servidor para obtener los datos más recientes.


interface PageProps {
  params: Promise<{ playlistId: string }>
}


const Page = async({ params }: PageProps) => {

  const { playlistId } = await params

  void trpc.playlists.getVideos.prefetchInfinite({ playlistId, limit: DEFAULT_LIMIT })
  void trpc.playlists.getOne.prefetch({ id: playlistId })

  return (
    <HydrateClient>
      <VideosView playlistId={playlistId} />
    </HydrateClient>
  )
}

export default Page