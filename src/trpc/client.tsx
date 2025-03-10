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
import { APP_URL } from '@/constant';


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
    if (APP_URL) return `https://${APP_URL}`;                       // En el servidor, se utiliza process.env.VERCEL_URL si está disponible (para despliegues en Vercel) 
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
  
  const [trpcClient] = useState(() =>                                              // Se usa useState con una función de inicialización, lo que significa que la función solo se ejecutará una vez, cuando el componente se monte.
    trpc.createClient({                                                            // Se usa createClient de tRPC para configurar el cliente.
      links: [                                                                     // Configuracion de links -> links en tRPC define cómo se comunican las solicitudes con el backend.
        httpBatchLink({                                                            // httpBatchLink es un link que permite permite agrupar varias solicitudes en una sola petición HTTP.
          transformer: superjson,                                                        // superjson permite serializar y deserializar datos complejos correctamente.
          url: getUrl(),                                                                 // getUrl devuelve devuelve la URL del servidor tRPC.
          async headers() {                                                              // Agrega un header personalizado para identificar el origen de la petición.
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          }
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