import { db } from "@/db";
import { users, videoReactions, videos, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { videoUpdateSchema } from '../../../db/schema';
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { workflow } from "@/lib/workflow";




export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))                                   // Se requiere de un id de un video
    .query(async ({ input, ctx }) => {
      
      const { clerkUserId } = ctx;                                                // Se requiere la identificación del usuario logueado -> ctx 
      
      let userId;
      
      const [user] = await db                                                     // Busca en la base de datos si existe un usuario con ese ID de Clerk
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if(user){
        userId = user.id                                                          // Si existe, guarda su ID interno para uso posterior 
      }  
      
      const viewerReactions = db.$with("viewer_reactions").as(                    // Crea una subconsulta temporal llamada "viewer_reactions"
        db
          .select({                                                               // Esta subconsulta obtiene el tipo de reacción (like/dislike) que el usuario actual ha dado al video
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : []))
      )

      const [existingVideo] = await db                                            // Consulta ppal: 
        .select({
          ...getTableColumns(videos),                                             // Selecciona todas las columnas del video
          user: {
            ...getTableColumns(users),                                            // Incluye datos del creador del video mediante un JOIN con la tabla de usuarios
          },
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),    // Cuenta el número de veces que el video ha sido visto
          likeCount: db.$count(                                                   // Cuenta el número de veces que el video ha sido "me gusta"
            videoReactions, 
              and(
                eq(videoReactions.videoId, videos.id),
                eq(videoReactions.type, "like")
              ),   
          ),
          dislikeCount: db.$count(                                                // Cuenta el número de veces que el video ha sido "no me gusta"
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            ),
          ),
          viewerReaction: viewerReactions.type                                    // Devuelve el tipo de reacción del usuario actual (like/dislike)
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))                            // Añade la relación de usuario correspondiente al creador del video
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))        // Se mantienen las columnas de videos independientemente de si hay coincidencias con la tabla de viewer_reactions
        .where(and(eq(videos.id, input.id)))

      if(!existingVideo){
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return existingVideo
    }),
  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/workflows/description`,
        body: { userId, videoId: input.id }
      })
      return { workflowRunId }
    }),
  generateTitle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/workflows/title`,
        body: { userId, videoId: input.id }
      })
      return { workflowRunId }
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
    .mutation(async({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/workflows/thumbnail`,
        body: { userId, videoId: input.id, prompt: input.prompt }
      })
      return { workflowRunId }
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async({ ctx, input}) => {
      const { id: userId } = ctx.user;
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ));

      if(!existingVideo){
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      if(existingVideo.thumbnailKey){
        const utapi = new UTApi();
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db                                                        
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(and(
            eq(videos.id, input.id),
            eq(videos.userId, userId)
          ))
      }

      if(!existingVideo.muxPlayBackId){
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const utapi = new UTApi();
      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlayBackId}/thumbnail.png`
      const uploadedThumbnail = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

      if(!uploadedThumbnail.data){
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl, thumbnailKey })
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))
        .returning()
      
      return updatedVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async({ ctx, input}) => {
      const { id: userId } = ctx.user;
      const [removedVideo] = await db
        .delete(videos)
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))
        .returning()

        if(!removedVideo){
          throw new TRPCError({ code: "NOT_FOUND" })
        }

        return removedVideo
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async({ ctx, input}) => {
      const { id: userId } = ctx.user;

      if(!input.id){
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date()
        })
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))
        .returning()
      
      if(!updatedVideo){
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return updatedVideo
    }),
  create: protectedProcedure.mutation(async ({ctx}) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({ // Devuelve una url segura para subir el video
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              }
            ]
          }
        ]
      },
      cors_origin: "*",
    })

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id
      })
      .returning();

    return {
      video: video,
      url: upload.url
    }
  })
})

