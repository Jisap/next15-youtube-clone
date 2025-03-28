import Image from "next/image"
import { formatDuration } from "@/lib/utils";
import { THUMBNAIL_FALLBACK } from "../../types";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps {
  title: string;
  duration?: number;
  imageUrl?: string | null;
  previewUrl?: string | null;
}

export const VideoThumbnailSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden transition-all group-hover:rounded-none rounded-xl aspect-video">
      <Skeleton className="size-full" />
    </div>
  )
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
          src={imageUrl ?? THUMBNAIL_FALLBACK}
          alt={title}
          fill
          className="size-full object-cover group-hover:opacity-0"
        />
        <Image
          src={previewUrl ?? THUMBNAIL_FALLBACK}
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