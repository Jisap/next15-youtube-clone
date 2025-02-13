

import HomeView from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";


export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{categoryId?: string}>;
}

const Page = async({ searchParams }: PageProps) => {

  const { categoryId } = await searchParams;
   
  void trpc.categories.getMany.prefetch();               // Almacena en caché del server la respuesta de getMany para que HomeView lo use.

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
}

export default Page;