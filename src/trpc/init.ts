import { db } from '@/db';
import { users } from '@/db/schema';
import { ratelimit } from '@/lib/ratelimit';
import { auth } from '@clerk/nextjs/server';
import { initTRPC, TRPCError } from '@trpc/server';                  // función que inicializa tRPC en el backend
import { eq } from 'drizzle-orm';
import { cache } from 'react';                                       // memoiza la función createTRPCContext. Memoizar significa que el resultado de la función se guarda en caché, y si la función se llama con los mismos argumentos de nuevo, el resultado guardado se devuelve en lugar de ejecutar la función de nuevo.
import superjson from 'superjson'



export const createTRPCContext = cache(async () => {                 // Crea el contexto para tRPC, que incluirá información del usuario autenticado.
  const { userId } = await auth()
  return { clerkUserId: userId };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;  // Define el tipo del contexto de tRPC para su uso en toda la aplicación


const t = initTRPC.context<Context>().create({                        // Inicializa tRPC con el contexto y una transformación para manejar serialización de datos complejos.
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;                             // Crea una función helper para crear instancias de routers tRPC. Un router es una colección de procedimientos relacionados
export const createCallerFactory = t.createCallerFactory;             // Crea una función para generar "callers". Un caller te permite ejecutar procedimientos tRPC directamente en el backend, sin necesidad de una solicitud HTTP.
export const baseProcedure = t.procedure;                             // Crea una función helper (base) para definir procedimientos tRPC base. Un procedimiento es una función que se ejecuta en el servidor cuando el cliente hace una solicitud.  




export const protectedProcedure = t.procedure.use(async function isAuthed(opts){ // Esta base de procedimiento colocado en _app.ts solo permite ejecutar el procedimiento si el usuario está autenticado.
  const { ctx } = opts;
  if (!ctx.clerkUserId) throw new TRPCError({ code: 'UNAUTHORIZED' });           // Verifica que el usuario esté autenticado.         

  const [user] = await db                                                        // Busca al usuario en la base de datos utilizando su ID de Clerk.   
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.clerkUserId))
    .limit(1)

  if(!user) {
    throw new TRPCError({ code: "UNAUTHORIZED"})
  }

  const { success } = await ratelimit.limit(user.id);                             // Aplica rate limiting con Upstash para evitar exceso de solicitudes.
  if(!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

  return opts.next({                                                              // Si pasa todas las verificaciones, permite la ejecución del procedimiento con el usuario en el contexto. 
    ctx: {
      ...ctx,
      user
    }
  });
})