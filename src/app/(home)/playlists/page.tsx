import { HydrateClient, trpc } from "@/trpc/server"
import { PlaylistsView } from "@/modules/playlists/ui/views/playlist-view"
import { DEFAULT_LIMIT } from "@/constant"


export const dynamic = "force-dynamic"

const Page = async() => {

  void trpc.playlists.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <HydrateClient>
      <PlaylistsView />
    </HydrateClient>
  )
}

export default Page