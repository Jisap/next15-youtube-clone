import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({commentId: z.string().uuid()}))
    .mutation(async({ input, ctx }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingCommentReactionLike] = await db             // Se buscan comentarios en los que el usuario haya dado like
        .select()
        .from(commentReactions)
        .where(and(
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.userId, userId),
          eq(commentReactions.type, "like")
        ))

      if (existingCommentReactionLike) {                        // Si ya existe un registro de "like" para ese comentario por parte de ese usuario, 
        const [deletedViewerReaction] = await db                // Se borra el registro existente
          .delete(commentReactions)
          .where(and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
          ))
          .returning()
        
        return deletedViewerReaction
      }

      const [createdCommentReaction] = await db                    // Si no encontramos likes del usuario en el comentario
        .insert(commentReactions)                                  // se inserta un nuevo registro de commentReactions con type = "like"
          .values({
            userId,
            commentId,
            type: "like"
          })
        .onConflictDoUpdate({                                           // Cuando ya existe una reacción del usuario para un comentario, 
          target: [commentReactions.userId, commentReactions.commentId],// solo se actualiza el campo type en la base de datos en lugar de insertar un nuevo registro.
            set: {
              type: "like"
            }
          })
          .returning()

        return createdCommentReaction
    }),
  dislike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingCommentReactionDislike] = await db             
        .select()
        .from(commentReactions)
        .where(and(
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.userId, userId),
          eq(commentReactions.type, "dislike")
        ))

      if (existingCommentReactionDislike) {                           
        const [deletedViewerReaction] = await db                
          .delete(commentReactions)
          .where(and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
          ))
          .returning()

        return deletedViewerReaction
      }

      const [createdVideoReaction] = await db               
        .insert(commentReactions)                             
        .values({
          userId,
          commentId,
          type: "dislike"
        })
        .onConflictDoUpdate({                                          
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: "dislike"
          }
        })
        .returning()

      return createdVideoReaction
    })
})