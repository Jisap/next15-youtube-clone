

import { DEFAULT_LIMIT } from "@/constant";
import { SubscribedView } from "@/modules/home/ui/views/subscribed-view";


import { HydrateClient, trpc } from "@/trpc/server";


// Nos aseguramos que la página se renderice en cada solicitud. Es util cuando los datos cambian con frecuencia.
// Se evita asi que la página se almacene en caché, asegurando que siempre se obtengan los datos más recientes del servidor.
export const dynamic = "force-dynamic"; 



const Page = async() => {
   
  void trpc.videos.getManySubscribed.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  })

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      <SubscribedView />
    </HydrateClient>
  );
}

export default Page;