

import { HydrateClient, trpc } from "@/trpc/server";
import { PageClient } from "./protected/client";
import { Suspense } from "react";

export default async function Home() {

  void trpc.hello.prefetch({ text: "Antonio" });    // Almacena en caché la respuesta de hello para que el cliente la use.

  return (
    // Hidrata esos datos en el cliente.
    <HydrateClient>
      {/* Maneja la carga mientras los datos se obtienen. */}
      <Suspense fallback={<p>Loading...</p>}>
        <PageClient />
      </Suspense>
    </HydrateClient>
  );
}
