import { db } from "@/db";
import { videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


export const videoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({videoId: z.string().uuid()}))
    .mutation(async({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideoView] = await db
        .select()
        .from(videoViews)
        .where(and(
          eq(videoViews.videoId, videoId),
          eq(videoViews.userId, userId)
        ))

      if (existingVideoView) {                          // Si ya existe un registro de visualización para ese video por parte de ese usuario, 
        return existingVideoView                        // el procedimiento simplemente devuelve ese registro y no crea uno nuevo.
        }

      const [createdVideoView] = await db               // Si no existe un registro previo, se inserta un nuevo registro en la tabla
        .insert(videoViews)                             // Si se necesita calcular métricas (como el número total de visualizaciones), se pueden usar consultas SQL con funciones de agregación como COUNT.
          .values({
            userId,
            videoId
          })
          .returning()

        return createdVideoView
    })
})