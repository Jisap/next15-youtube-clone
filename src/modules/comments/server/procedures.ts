import { db } from "@/db";
import { commentReactions, comments, users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { z } from "zod";


export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [deletedComment] = await db
        .delete(comments)
        .where(and(
          eq(comments.id, id),
          eq(comments.userId, userId)
        ))
        .returning()

      if(!deletedComment){
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return deletedComment
    }),
  create: protectedProcedure
    .input(z.object({
      parentId: z.string().uuid().nullish(), // Puede o no venir
      videoId: z.string().uuid(),
      value: z.string(),
    }))
    .mutation(async({ input, ctx }) => {
      const { parentId, videoId, value } = input;
      const { id: userId } = ctx.user;

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []))  //Buscamos un comentario cuyo id se corresponda con el parentId (reply)

      if(!existingComment && parentId){
        throw new TRPCError({ code: "NOT_FOUND" })                // No se encontró un comentario con el parentId proporcionado
      }

      if(existingComment?.parentId && parentId){
        throw new TRPCError({ code: "BAD_REQUEST" })              // Previene la creación de respuestas anidadas. No se permite crear una respuesta a esta respuesta, 
      }

      const [createdComment] = await db                           // Si no se encontró un comentario con el parentId proporcionado, se crea un nuevo comentario
        .insert(comments)                             
          .values({
            userId,
            videoId,
            parentId,
            value
          })
          .returning()

        return createdComment
    }),
  getMany: baseProcedure
    .input(z.object({
      videoId: z.string().uuid(),
      parentId: z.string().uuid().nullish(),
      cursor: z.object({
        id: z.string().uuid(),
        updatedAt: z.date()
      }).nullish(), // not required
      limit: z.number().min(1).min(1).max(100),
    })
  )
  .query(async({ input, ctx }) => {
    const { clerkUserId } = ctx;
    const { parentId, videoId, cursor, limit } = input;
    let userId;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))
    
    if(user){
      userId = user.id // Se asigna a userId el id de la tabla users correspondiente al clerkUserId
    }

    const viewerReactions = db.$with("viewer_reactions").as(           // Subconsulta para obtener las reacciones del usuario actual.   
      db
        .select({
          commentId: commentReactions.commentId,                       // Se selecciona el id del comentario de la tabla commentReactions
          type: commentReactions.type,                                 // Se selecciona el tipo de reaction (like o dislike)
        })
        .from(commentReactions)
        .where(inArray(commentReactions.userId, userId ? [userId] : [])) // Filtramos solo las reacciones del usuario actual
    )

    const replies = db.$with("replies").as(                            // Subconsulta para obtener el conteo de respuestas del comentario actual.
      db
        .select({
          parentId: comments.parentId,
          count: count(comments.id).as("count")
        })
        .from(comments)
        .where(isNotNull(comments.parentId))
        .groupBy(comments.parentId)
    )

    const [totalData, data ] = await Promise.all([
      db
        .select({
          count: count()                                               // Se obtiene el número total de comentarios para el video sin contar las replies
        })
        .from(comments) 
        .where(and(
          eq(comments.videoId, videoId),
          isNull(comments.parentId)
        )),                         

      db                                                               // Consulta principal para obtener los comentarios con información adicional.
        .with(viewerReactions, replies)                                    // Se añade la subconsulta de viewerReactions (reacciones del usuario actual) y de replies (conteo de respuestas)
        .select({
          ...getTableColumns(comments),                                    // Se seleccionan las columnas de la tabla comments
          user: users,                                                     // Se añade la relación con la tabla users
          viewerReaction: viewerReactions.type,                            // Selecciona la reacción del usuario actual      
          replyCount: replies.count,                                       // Se selecciona el conteo de respuestas del comentario actual
          likeCount: db.$count(                                            // Se obtiene el número de likes para cada comentario
            commentReactions,                                                       // Para ellos buscamos en commentReactions
            and(
              eq(commentReactions.type, "like"),                                    // solo los likes 
              eq(commentReactions.commentId, comments.id),                          // que apunten al comentario actual
            )
          ),
          dislikeCount: db.$count(                                            // Se obtiene el número de dislikes para cada comentario
            commentReactions,                                                       // Para ellos buscamos en commentReactions
            and(
              eq(commentReactions.type, "dislike"),                                 // solo los dislikes 
              eq(commentReactions.commentId, comments.id),                          // que apunten al comentario actual
            )
          )
        })
        .from(comments)                                                // De la tabla comments 
        .where(and(
          eq(comments.videoId, videoId),                               // se  mostrarán solo comentarios del video especificado.
          parentId                                                     // Si el comentario es una respuesta
            ? eq(comments.parentId, parentId)                          // se mostrarán solo los comentarios que sean respuestas
            : isNull(comments.parentId),                               // sino lo es solo se mostrarán los comentarios que no sean respuestas
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
        .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId)) // Unimos con las reacciones del usuario.
        .leftJoin(replies, eq(comments.id, replies.parentId))          // Unimos el conteo de respuestas del comentario.
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