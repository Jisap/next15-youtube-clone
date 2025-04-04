import { DEFAULT_LIMIT } from '@/constant';
import { StudioView } from '@/modules/studio/ui/views/studio-view';
import { HydrateClient, trpc } from '@/trpc/server'
import React from 'react'

export const dynamic = "force-dynamic";

const Page = async() => {

  void trpc.studio.getMany.prefetchInfinite({limit: DEFAULT_LIMIT});  // Almacena en caché del server la respuesta de getMany para que StudioView lo use.

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  )
}

export default Page