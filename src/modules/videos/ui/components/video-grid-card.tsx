import { VideoGetManyOutput } from "../../types";




interface VideoGridCardProps {
  data: VideoGetManyOutput["items"][number];
  onRemove?:() => void;
}

const VideoGridCard = ({
  data,
  onRemove,
}: VideoGridCardProps) => {
  return (
    <div>
      Grid Card
    </div>
  )
}

export default VideoGridCard