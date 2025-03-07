import { useMemo } from "react";
import { VideoGetManyOutput } from "../../types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { User } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import VideoMenu from "./video-menu";


interface VideoInfoProps {
  data: VideoGetManyOutput["items"][number];
  onRemove?:() => void;
}

const VideoInfo = ({ data, onRemove }: VideoInfoProps) => {

  const compactViews = useMemo(() => { // Intl.NumberFormat es una API de JavaScript que permite formatear números de acuerdo con las convenciones de un idioma específico.
      return Intl.NumberFormat("en", {   // 1000 -> 1k, 1000000 -> 1m, 1000000000 -> 1b
        notation: "compact"
      }).format(data.viewCount)
    },[data.viewCount]);
  
    const compactDate = useMemo(() => { 
      return formatDistanceToNow(data.createdAt, {addSuffix: true})
    }, [data.createdAt])

  return (
    <div className="flex gap-3">
      <Link href={`/users/${data.user.id}`}>
        <UserAvatar 
          imageUrl={data.user.imageUrl}
          name={data.user.name}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/videos/${data.id}`}>
          <h3 className="font-medium line-clamp-1 lg:line-clamp-2 text-base break-words">
            {data.title}
          </h3>
        </Link>

        <Link href={`/users/${data.user.id}`}>
          <UserInfo 
            name={data.user.name}
          />
        </Link>

        <Link href={`/videos/${data.id}`}>
          <p className="text-sm text-gray-600 line-clamp-1">
            {compactViews} views · {compactDate}
          </p>
        </Link>
      </div>

      <div className="flex-shrink-0">
        <VideoMenu
          videoId={data.id}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
}

export default VideoInfo