import Link from "next/link"
import { PlaylistGetManyOutput } from "../../types"
import { THUMBNAIL_FALLBACK } from "@/modules/videos/types"
import { PlaylistThumbnail } from "./playlist-thumbnail"
import { PlaylistInfo } from "./playlist-info"



interface PlaylistGridCardProps {
  data: PlaylistGetManyOutput["items"][number]
}

export const PlaylistGridCard = ({ data }: PlaylistGridCardProps) => {
  return (
    <Link href={`/playlists/${data.id}`}>
      <div className="flex flex-col gap-2 w-full group">
        <PlaylistThumbnail
          imageUrl={THUMBNAIL_FALLBACK}
          title={data.name}
          videoCount={data.videoCount}
        />
        <PlaylistInfo data={data} />
      </div>
    </Link>
  )
}
