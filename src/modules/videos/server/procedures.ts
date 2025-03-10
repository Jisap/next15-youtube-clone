import { db } from "@/db";
import { subscriptions, users, videoReactions, videos, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { videoUpdateSchema } from '../../../db/schema';
import { and, eq, getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { workflow } from "@/lib/workflow";




export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))                                         // Se requiere de un id de un video
    .query(async ({ input, ctx }) => {
      
      const { clerkUserId } = ctx;                                                      // Se requiere la identificación del usuario logueado -> ctx 
      
      let userId;
      
      const [user] = await db                                                           // Busca en la base de datos si existe un usuario con ese ID de Clerk
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if(user){
        userId = user.id                                                               // Si existe, guarda su ID interno para uso posterior 
      }  
      
      const viewerReactions = db.$with("viewer_reactions").as(                         // Crea una subconsulta temporal llamada "viewer_reactions"
        db
          .select({                                                                    // Esta subconsulta obtiene el tipo de reacción (like/dislike) que el usuario actual ha dado al video
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : []))
      );

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))              // Filtra los resultados para obtener solo las suscripciones cuyo viewerId coincide con userId.
      )

      const [existingVideo] = await db                                                 // Consulta ppal: 
        .with(
          viewerReactions,                                                             // Se agrega la subconsulta "viewer_reactions" a la consulta ppal (*)
          viewerSubscriptions                                                          // También se agrega la subconsulta "viewer_subscriptions" para obtener la cantidad de suscripciones del usuario.
        )                                    
        .select({
          ...getTableColumns(videos),                                                  // Selecciona todas las columnas del video
          user: {
            ...getTableColumns(users),                                                 // Incluye datos del creador del video mediante un JOIN con la tabla de usuarios
            subscriberCount: db.$count(                                                // Cuenta el número de suscriptores del video mirando en la tabla subscriptions
              subscriptions, 
              eq(subscriptions.creatorId, users.id)                                    // Para ello se buscan los creatorIds de las suscripciones que coincidan con el id del user actual
            ),
            viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean) // Verifica si el usuario autenticado está suscrito al creador del video
          },
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),         // Cuenta el número de veces que el video ha sido visto
          likeCount: db.$count(                                                        // Cuenta el número de veces que el video ha sido "me gusta"
            videoReactions, 
              and(
                eq(videoReactions.videoId, videos.id),                                          // se usa la tabla original no la cte
                eq(videoReactions.type, "like")
              ),   
          ),
          dislikeCount: db.$count(                                                     // Cuenta el número de veces que el video ha sido "no me gusta"
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),                                            // se usa la tabla original no la cte
              eq(videoReactions.type, "dislike")
            ),
          ),
          viewerReaction: viewerReactions.type                                         // (*) Devuelve el tipo de reacción del usuario actual (like/dislike)
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))                                 // Añade la relación de usuario correspondiente al creador del video
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))             // (*) Se mantienen las columnas de videos independientemente de si hay coincidencias con la tabla de viewer_reactions
        .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id))    // Idem para las suscripciones
        .where(and(eq(videos.id, input.id)))
        // .groupBy(
        //   videos.id,
        //   users.id,
        //   viewerReactions.type                                                      //  Combina todas las filas que tienen el mismo videos.id, users.id y viewerReactions.type en un solo grupo.  
        // )

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
  revalidate: protectedProcedure             // Verifica el estado de procesamiento en Mux y actualiza la bd con información crítica: muxStatus, muxPlayBackId
    .input(z.object({ id: z.string() }))                                  
    .mutation(async ({ ctx, input }) => {                           // Se verifica que el video exista y pertenezca al usuario autenticado.
      const { id: userId } = ctx.user;                                    
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      if(!existingVideo.muxUploadId){
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const upload = await mux.video.uploads.retrieve(              // Revisa que el video tenga un muxUploadId (identificador de subida en Mux). 
        existingVideo.muxUploadId
      )

      if(!upload || !upload.asset_id){
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const asset = await mux.video.assets.retrieve(                 // Con el muxUploadId se obtiene el asset (video) en Mux
        upload.asset_id
      )

      if(!asset){ 
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const playbackId = asset.playback_ids?.[0].id                  // Desde el asset se extrae el playback_id (identificador de reproducción en Mux) y luego el status
      const duration = asset.duration                                // También se extrae la duración del video
        ? Math.round(asset.duration * 1000) 
        : 0;

      const [updatedVideo] = await db                                // Actualización en base de datos. Esto permite al frontend saber si el video está listo y cómo reproducirlo.   
        .update(videos)
        .set({
          muxStatus: asset.status,    // Estado actual del video
          muxPlayBackId: playbackId,  // Usado por el frontend para generar la URL de reproducción.
          muxAssetId: asset.id,       // Referencia al recurso en Mux.
          duration,                   // Duración del video.
        })
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))
        .returning()

      return updatedVideo
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

