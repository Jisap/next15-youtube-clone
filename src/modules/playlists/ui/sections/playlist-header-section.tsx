"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/trpc/client"
import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { toast } from "sonner"


interface PlaylistHeaderSectionProps {
  playlistId: string
}

export const PlaylistHeaderSection = ({ playlistId }: PlaylistHeaderSectionProps) => {
  return (
    <div>
      <Suspense fallback={<PlaylistHeaderSectionSkeleton />}>
        <ErrorBoundary fallback={<p>Error...</p>}>
          <PlaylistHeaderSectionSuspense playlistId={playlistId} />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
};

const PlaylistHeaderSectionSkeleton = () => {
  return(
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-32" />
    </div>
  )
}

export const PlaylistHeaderSectionSuspense = ({ playlistId }: PlaylistHeaderSectionProps) => {
  
  const utils = trpc.useUtils();
  const router = useRouter();

  const [playlist] = trpc.playlists.getOne.useSuspenseQuery({ id: playlistId }); // Obtiene la información de una playlist concreta
  
  const remove = trpc.playlists.remove.useMutation({
    onSuccess: () => {
      toast.success("Playlist removed");
      utils.playlists.getMany.invalidate();
      router.push("/playlists");
    },
    onError: () => {
      toast.error("Something went wrong");
    }
  });

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className='text-2xl font-bold'>{playlist.name}</h1>
        <p className='text-sm text-gmuted-foreground'>
          Videos from the playlist
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => remove.mutate({ id: playlistId })}
        disabled={remove.isPending}
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}

