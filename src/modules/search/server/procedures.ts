import { db } from "@/db";
import { users, videoReactions, videos, videoViews } from "@/db/schema";


import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc, ilike, getTableColumns } from "drizzle-orm";
import { z } from "zod";


export const searchRouter = createTRPCRouter({
    getMany: baseProcedure                                              // Indica que este endpoint no requiere autenticación.
      .input(                                                           // Valida los parámetros de entrada:
        z.object({
          query: z.string().nullish(),                                  // 1º Parámetro de busqueda: query
          categoryId: z.string().uuid().nullish(),                      // 2º Parámetro de filtrado: categoryId
          cursor: z.object({                                            // 3º Cursor que es un objeto con:
            id: z.string().uuid(),                                      // Identificador del último video cargado.
            updatedAt: z.date()                                         // Fecha de actualización del último video cargado.  
          })
          .nullish(),
          limit: z.number().min(1).max(100),                            // Y 4º Limit que es el número de videos a recuperar 
        })
    )
    .query(async ({ input }) => {                                       // Validados los datos se procede a la consulta a la base de datos.
      
      const { cursor, limit, query, categoryId } = input;               // Se extraen los valores de input (query, cursor, limit, categoryId).

        const data = await db
          .select({                                                     // De la tabla videos se seleccionan los campos:
            ...getTableColumns(videos),                                 // props relativas a la tabla videos.                              
            user: users,                                                // se agrega la relacion de usuarios
            viewCount: db.$count(                                                                 
              videoViews, eq(videoViews.videoId, videos.id)),           // videoCount: número de visualizaciones del video.
              likeCount: db.$count(                                         // likeCount: número de likes del video.
                videoReactions, and(                                                 // En la tabla videoReactions se filtran los likes.
                  eq(videoReactions.videoId, videos.id),                             // correspondientes al video
                  eq(videoReactions.type, "like")                                    // con el tipo de reaction "like".
                )),
              dislikeCount: db.$count(                                      // dislikeCount: número de dislikes del video.
                videoReactions, and(                                                 // En la tabla videoReactions se filtran los likes.
                  eq(videoReactions.videoId, videos.id),                             // correspondientes al video
                  eq(videoReactions.type, "dislike")                                 // con el tipo de reaction "dislike".
                ))  
          })
          .from(videos)                                                 // Solo se obtienen los videos 
          .innerJoin(users, eq(videos.userId, users.id))
          .where(and(
            ilike(videos.title, `%${query}%`),                          // que coincidan con el query proporcionado,
            categoryId ? eq(videos.categoryId, categoryId) : undefined, // y que pertenecen a la categoría proporcionada.
            cursor                                                      // y si hay un cursor. Este cursor se usa para obtener solo los videos más antiguos
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