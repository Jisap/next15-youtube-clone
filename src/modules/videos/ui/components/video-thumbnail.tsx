import Image from "next/image"

interface VideoThumbnailProps {
  imageUrl?: string | null;
}

export const VideoThumbnail = ({imageUrl}: VideoThumbnailProps) => {

  return (
    <div className="relative">
      {/* Thumbnail wrapper*/}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image 
          src={imageUrl ?? "/placeholder.svg"}
          alt="Thumbnail"
          fill
          className="size-full object-cover"
        />
      </div>

      {/* Video Duration box */}
      <div>

      </div>
    </div>
  )
}