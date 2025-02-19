import Image from "next/image"
import { formatDuration } from "@/lib/utils";

interface VideoThumbnailProps {
  title: string;
  duration?: number;
  imageUrl?: string | null;
  previewUrl?: string | null;
}

export const VideoThumbnail = ({
  title,
  duration,
  imageUrl,
  previewUrl
}: VideoThumbnailProps) => {

  return (
    <div className="relative group">
      {/* Thumbnail wrapper*/}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image 
          src={imageUrl ?? "/placeholder.svg"}
          alt={title}
          fill
          className="size-full object-cover group-hover:opacity-0"
        />
        <Image
          src={previewUrl ?? "/placeholder.svg"}
          alt={title}
          fill
          className="size-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>

      {/* Video Duration box */}
      <div className="absolute bottom-2 right-2 px-1 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration ?? 0)}  {/* Proporciona un valor predeterminado de 0 */}
      </div>
    </div>
  )
}