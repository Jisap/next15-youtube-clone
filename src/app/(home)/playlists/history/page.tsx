import { DEFAULT_LIMIT } from "@/constant"
import { HistoryView } from "@/modules/playlists/ui/views/history-view"
import { HydrateClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic" // Cada vez que un usuario acceda a la página, se hará una solicitud al servidor para obtener los datos más recientes.


const Page = () => {

  void trpc.playlists.getHistory.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <HydrateClient>
      <HistoryView />
    </HydrateClient>
  )
}

export default Page