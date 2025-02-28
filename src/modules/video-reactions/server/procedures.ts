import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({videoId: z.string().uuid()}))
    .mutation(async({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideoReactionLike] = await db             // Se buscan videos en los que el usuario haya dado like
        .select()
        .from(videoReactions)
        .where(and(
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.userId, userId),
          eq(videoReactions.type, "like")
        ))

      if (existingVideoReactionLike) {                          // Si ya existe un registro de "like" para ese video por parte de ese usuario, 
        const [deletedViewerReaction] = await db                // Se borra el registro existente
          .delete(videoReactions)
          .where(and(
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, "like")
          ))
          .returning()
        
        return deletedViewerReaction
      }

      const [createdVideoReaction] = await db                    // Si no encontramos likes del usuario en el video 
        .insert(videoReactions)                                  // se inserta un nuevo registro de videoReactions con type = "like"
          .values({
            userId,
            videoId,
            type: "like"
          })
        .onConflictDoUpdate({                                           // Cuando ya existe una reacción del usuario para un video, 
          target: [videoReactions.userId, videoReactions.videoId],      // solo se actualiza el campo type en la base de datos en lugar de insertar un nuevo registro.
            set: {
              type: "like"
            }
          })
          .returning()

        return createdVideoReaction
    }),
  dislike: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideoReactionDislike] = await db             
        .select()
        .from(videoReactions)
        .where(and(
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.userId, userId),
          eq(videoReactions.type, "dislike")
        ))

      if (existingVideoReactionDislike) {                           
        const [deletedViewerReaction] = await db                
          .delete(videoReactions)
          .where(and(
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, "dislike")
          ))
          .returning()

        return deletedViewerReaction
      }

      const [createdVideoReaction] = await db               
        .insert(videoReactions)                             
        .values({
          userId,
          videoId,
          type: "dislike"
        })
        .onConflictDoUpdate({                                          
          target: [videoReactions.userId, videoReactions.videoId],
          set: {
            type: "dislike"
          }
        })
        .returning()

      return createdVideoReaction
    })
})