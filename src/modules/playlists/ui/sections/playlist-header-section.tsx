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
    <div>
      PlaylistHeaderSectionSuspensse
    </div>
  )
}

