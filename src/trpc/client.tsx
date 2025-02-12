'use client';
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';
import superjson from 'superjson';


export const trpc = createTRPCReact<AppRouter>();                                  // Se crea un cliente tRPC

let clientQueryClientSingleton: QueryClient;                                       // Variable global que almacena una única instancia de QueryClient en el lado del cliente.


function getQueryClient() {                                                        // Función que devuelve una instancia de QueryClient.
  if (typeof window === 'undefined') {                                             // En el servidor siempre se devuelve una instancia de QueryClient.
    return makeQueryClient();
  } 
  return (clientQueryClientSingleton ??= makeQueryClient());                       // En el cliente se usa las instancia singleton de QueryClient.
}


function getUrl() {                                                                // Esta función determina la URL base para las solicitudes tRPC.  
  const base = (() => {
    if (typeof window !== 'undefined') return '';                                  // En el navegador a URL base es vacía (se usa la ruta relativa /api/trpc).
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;        // En el servidor, se utiliza process.env.VERCEL_URL si está disponible (para despliegues en Vercel) 
    return 'http://localhost:3000';                                                // o http://localhost:3000 en desarrollo local.
  })();
  return `${base}/api/trpc`;
}


export function TRPCProvider(                                                      // Componente que proporciona tanto el cliente tRPC como el QueryClient a la aplicación.
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();                                            // getQueryClient(), que devuelve una instancia de QueryClient (nueva en el servidor o singleton en el cliente). 
  const [trpcClient] = useState(() =>                                              // trpc.createClient, que configura el cliente tRPC con un enlace (httpBatchLink) para enviar solicitudes a la URL base.
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson, 
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    //trpc.Provider proporciona el cliente tRPC a la aplicación.
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {/* El componente QueryClientProvider proporciona el QueryClient a la aplicación. */}
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}