import { Button } from "@/components/ui/button"
import { Trash, Trash2Icon } from "lucide-react"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"


interface PlaylistHeaderSectionProps {
  playlistId: string
}

export const PlaylistHeaderSection = ({ playlistId }: PlaylistHeaderSectionProps) => {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error...</p>}>
          <PlaylistHeaderSectionSuspense playlistId={playlistId} />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
}

export const PlaylistHeaderSectionSuspense = ({ playlistId }: PlaylistHeaderSectionProps) => {
  
  
  
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className='text-2xl font-bold'>History</h1>
        <p className='text-sm text-gmuted-foreground'>
          Videos from the playlist
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}

