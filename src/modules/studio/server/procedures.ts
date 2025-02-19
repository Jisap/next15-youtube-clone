import { db } from "@/db";
import { videos } from "@/db/schema";


import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { z } from "zod";


export const studioRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, id),                                            // Selecciona el video de bd que coincida con el id proporcionado
          eq(videos.userId, userId),                                    // y que sea del usuario autenticado.
        ));

        if(!video) throw new TRPCError({code: "NOT_FOUND"});            // Si no se encuentra el video, se lanza un error.
       
      return video;
    }),
    getMany: protectedProcedure                                         // Indica que este endpoint requiere autenticación.
      .input(                                                           // Valida los parámetros de entrada:
        z.object({
          cursor: z.object({                                            // 1º Cursor que es un objeto con:
            id: z.string().uuid(),                                      // Identificador del último video cargado.
            updatedAt: z.date()                                         // Fecha de actualización del último video cargado.  
          })
          .nullish(),
          limit: z.number().min(1).max(100),                            // Y 2º Limit que es el número de videos a recuperar 
        })
    )
    .query(async ({ctx, input}) => {                                    // Validados los datos se procede a la consulta a la base de datos.
      
      const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit) .
      const { id: userId } = ctx.user;                                  // y el userId del usuario autenticado

        const data = await db
          .select()
          .from(videos)                                                 // Solo se obtienen los videos 
          .where(and(
            eq(videos.userId, userId),                                  // del usuario autenticado.
            cursor                                                      // si hay un cursor. Este cursor se usa para obtener solo los videos más antiguos
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),               // Filtra los videos cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),             // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                    lt(videos.id, cursor.id)
                  ) 
                )
              : undefined,
          )).orderBy(desc(videos.updatedAt), desc(videos.id))           // Se ordena en orden descendente por updatedAt y luego por id.
          .limit(limit + 1)                                             // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


        const hasMore = data.length > limit;                            // Si data contiene más elementos de los solicitados (limit), significa que hay más videos disponibles.

        const items = hasMore ? data.slice(0, -1) : data;               // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

        const lastItem = items[items.length - 1];                       // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

        const nextCursor = hasMore
          ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
          : null

        return {
          items,
          nextCursor,
        }
  }),
});