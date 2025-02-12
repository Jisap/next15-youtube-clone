import { z } from 'zod';
import { baseProcedure, protectedProcedure, createTRPCRouter } from '../init';


export const appRouter = createTRPCRouter({                // enrutador tRPC muy simple con un solo procedimiento llamado hello
  hello: protectedProcedure                                // Define un procedimiento llamado hello.
    .input(                                                // Aquí es donde se define el esquema de validación para la entrada de este procedimiento. 
      z.object({                                           // Zod te permite especificar qué tipo de datos esperas recibir del cliente.
        text: z.string(),
      }),
    )
    .query((opts) => {                                     // Define la función que se ejecuta cuando se llama este procedimiento.
      console.log({ dbUser: opts.ctx.user });              // Puedes acceder a cualquier propiedad de contexto de tRPC.
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;