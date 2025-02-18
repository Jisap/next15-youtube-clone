import Image from "next/image"

interface VideoThumbnailProps {
  title: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
}

export const VideoThumbnail = ({
  imageUrl,
  title,
  previewUrl
}: VideoThumbnailProps) => {

  return (
    <div className="relative group">
      {/* Thumbnail wrapper*/}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image 
          src={imageUrl ?? "/placeholder.svg"}
          alt="Thumbnail"
          fill
          className="size-full object-cover group-hover:opacity-0"
        />
        <Image
          src={previewUrl ?? "/placeholder.svg"}
          alt="Thumbnail"
          fill
          className="size-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>

      {/* Video Duration box */}
      <div>

      </div>
    </div>
  )
}