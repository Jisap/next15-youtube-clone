import 'server-only'; 

import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';                                                     // Cache, se utiliza para evitar que se cree una nueva instancia de QueryClient en cada petición.
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { AppRouter } from './routers/_app';



// Creación de un cliente de React Query con caché
export const getQueryClient = cache(makeQueryClient);                              // Devuelve siempre la misma instancia de React Query dentro de la misma petición.


// Creación de un "caller" para ejecutar procedimientos de tRPC en el servidor
const caller = createCallerFactory(AppRouter)(createTRPCContext);                  // Genera una función para llamar procedimientos de tRPC sin cliente HTTP.


//Crea y exporta las herramientas de hidratación de tRPC para React Query en un entorno de RSC (React Server Components).  
//- `trpc`: Cliente de tRPC adaptado a React Query, que permite realizar llamadas a los procedimientos definidos en `appRouter`.
//- `HydrateClient`: Componente que se utiliza para hidratar los datos de React Query en el cliente después de haberlos obtenido en el servidor.

export const { trpc, HydrateClient } = createHydrationHelpers<typeof AppRouter>(
  caller,        // Llamador de tRPC que permite ejecutar procedimientos directamente en el servidor
  getQueryClient // Cliente de React Query con caché para mejorar la eficiencia de las consultas
);
