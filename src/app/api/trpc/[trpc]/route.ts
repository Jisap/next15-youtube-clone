import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';


const handler = (req: Request) =>                       // Configura un endpoint API en Next.js que maneja las solicitudes tRPC. Convierte las solicitudes HTTP fetch (que recibe Next.js) en llamadas a los procedimientos tRPC. 
  fetchRequestHandler({                                 // La función handler recibe una solicitd HTTP (req) y devuelve una función que llamará los procedimientos tRPC.
    endpoint: '/api/trpc',                              // Para ello especifica el endpoint tRPC.
    req,                                                // recibe la solicitud HTTP
    router: appRouter,                                  // recibe el enrutador tRPC qué establece que procedimientos tRPC están disponibles.
    createContext: createTRPCContext,                   // Pasa la función createTRPCContext Esto le dice a fetchRequestHandler cómo crear el contexto para cada solicitud.
  });
export { handler as GET, handler as POST };