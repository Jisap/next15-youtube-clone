import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, count, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";


export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      value: z.string(),
    }))
    .mutation(async({ input, ctx }) => {
      const { videoId, value } = input;
      const { id: userId } = ctx.user;

      const [createdComment] = await db               
        .insert(comments)                             
          .values({
            userId,
            videoId,
            value
          })
          .returning()

        return createdComment
    }),
  getMany: baseProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      cursor: z.object({
        id: z.string().uuid(),
        updatedAt: z.date()
      }).nullish(), // not required
      limit: z.number().min(1).min(1).max(100),
    })
  )
  .query(async({ input }) => {
    const { videoId, cursor, limit } = input;

    const [totalData, data ] = await Promise.all([
      db
        .select({
          count: count()                                               // Se obtiene el número total de comentarios para el video
        })
        .from(comments)
        .where(eq(comments.videoId, videoId)),

      db
        .select({
          ...getTableColumns(comments),
          user: users,
        })
        .from(comments)
        .where(and(
          eq(comments.videoId, videoId),
          cursor                                                       // Si hay un cursor. Este cursor se usa para obtener solo los comentarios más antiguos
            ? or(
              lt(comments.updatedAt, cursor.updatedAt),                // Filtra los comentarios cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
              and(
                eq(comments.updatedAt, cursor.updatedAt),              // Si dos comentarios tienen la misma updatedAt, se usa id < cursor.id como desempate.
                lt(comments.id, cursor.id)
              )
            )
            : undefined,                                               // Si no hay cursor, no se aplica filtro adicional
        ))
        .innerJoin(users, eq(comments.userId, users.id))               // Se añade la info del user que hizo el comentario
        .orderBy(desc(comments.updatedAt), desc(comments.id))          // Ordena los comentarios de forma descendente por fecha de actualización y luego por id.
        .limit(limit + 1)                                              // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.
      
    ])

    const hasMore = data.length > limit;                               // Si data contiene más elementos de los solicitados (limit), significa que hay más videos disponibles.

    const items = hasMore ? data.slice(0, -1) : data;                  // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

    const lastItem = items[items.length - 1];                          // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

    const nextCursor = hasMore
      ? {
        id: lastItem.id,
        updatedAt: lastItem.updatedAt,
      }
      : null

    return {
      totalCount: totalData[0].count,
      items,
      nextCursor
    }
  })
})