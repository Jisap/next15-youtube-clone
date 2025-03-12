

import { DEFAULT_LIMIT } from "@/constant";
import HomeView from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";


// Nos aseguramos que la página se renderice en cada solicitud. Es util cuando los datos cambian con frecuencia.
// Se evita asi que la página se almacene en caché, asegurando que siempre se obtengan los datos más recientes del servidor.
export const dynamic = "force-dynamic"; 

interface PageProps {
  searchParams: Promise<{categoryId?: string}>;
}

const Page = async({ searchParams }: PageProps) => {

  const { categoryId } = await searchParams;
   
  void trpc.categories.getMany.prefetch();               // Almacena en caché del server la respuesta de getMany para que HomeView lo use.
  void trpc.videos.getMany.prefetchInfinite({
    categoryId, 
    limit: DEFAULT_LIMIT,
  })

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
}

export default Page;