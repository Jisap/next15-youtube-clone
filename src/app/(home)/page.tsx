

import { HydrateClient, trpc } from "@/trpc/server";
import { PageClient } from "./protected/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function Home() {

  //void trpc.hello.prefetch({ text: "Antonio" });    // Almacena en caché la respuesta de hello para que el cliente la use.
  void trpc.categories.getMany.prefetch()

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      {/* Maneja la carga mientras los datos se obtienen. */}
      <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <PageClient />
      </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
