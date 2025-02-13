

import HomeView from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{categoryId?: string}>;
}

const Page = async({ searchParams }: PageProps) => {

  const { categoryId } = await searchParams;
   
  void trpc.categories.getMany.prefetch();               // Almacena en caché la respuesta de getMany para que HomeView lo use.

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
}

export default Page;