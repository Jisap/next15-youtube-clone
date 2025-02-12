import { initTRPC } from '@trpc/server';                             // función que inicializa tRPC en el backend
import { cache } from 'react';                                       // memoiza la función createTRPCContext. Memoizar significa que el resultado de la función se guarda en caché, y si la función se llama con los mismos argumentos de nuevo, el resultado guardado se devuelve en lugar de ejecutar la función de nuevo.
import superjson from 'superjson'

export const createTRPCContext = cache(async () => {                 // Define el contexto de los procedimientos tRPC. Permite acceder a datos como información del usuario autenticado, conexiones a bases de datos, o cualquier otra cosa que necesites para manejar las solicitudes.
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});

const t = initTRPC.create({                                          // Instancia de tRPC.  El objeto que se pasa a create() permite configurar tRPC.
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;                             // Crea una función helper para crear routers tRPC. Un router es una colección de procedimientos relacionados
export const createCallerFactory = t.createCallerFactory;             // Crea una función para generar "callers". Un caller te permite ejecutar procedimientos tRPC directamente en el backend, sin necesidad de una solicitud HTTP.
export const baseProcedure = t.procedure;                             // Crea una función helper para definir procedimientos tRPC base. Un procedimiento es una función que se ejecuta en el servidor cuando el cliente hace una solicitud.  