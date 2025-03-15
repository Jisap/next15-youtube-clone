import { HydrateClient } from "@/trpc/server"
import { PlaylistsView } from "@/modules/playlists/ui/views/playlist-view"




const Page = async() => {
  return (
    <HydrateClient>
      <PlaylistsView />
    </HydrateClient>
  )
}

export default Page