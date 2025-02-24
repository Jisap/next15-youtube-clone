import { FormSection } from "../sections/form-section";


interface VideoViewProps {
  videoId: string;
}

export const VideoView = ({ videoId }: VideoViewProps) => {
  return (
    <div className="px-4 pt-2.5 max-w-screen-lg lg:max-w-screen-2xl mx-auto">
      <FormSection videoId={videoId} />
    </div>
  )
}