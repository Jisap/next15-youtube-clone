import { db } from "@/db";
import { subscriptions, users, videoReactions, videos, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { videoUpdateSchema } from '../../../db/schema';
import { and, DBQueryConfig, desc, eq, getTableColumns, inArray, isNotNull, lt, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { workflow } from "@/lib/workflow";
import { view } from "drizzle-orm/sqlite-core";




export const videosRouter = createTRPCRouter({
  getManySubscribed: protectedProcedure                                 // Indica que este endpoint si requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        cursor: z.object({                                              // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.
          updatedAt: z.date()                                           // Fecha de actualización del último video cargado.  
        })
          .nullish(),
        limit: z.number().min(1).max(100),                              // Y 3º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input,ctx }) => {                                   // Validados los datos se procede a la consulta a la base de datos.

      const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit).
      const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.
      
      const viewerSubcription = db.$with("viewer_subscriptions").as(    // Creamos una CTE con los creadores a los que el usuario está suscrito.
        db
          .select({
            userId: subscriptions.creatorId,                            // Seleccionamos los ids de los creadores de videos
          })
          .from(subscriptions)                                          // desde la tabla subscriptions
          .where(
            eq(subscriptions.viewerId, userId)                          // Filtramos solo las suscripciones donde el usuario autenticado es el seguidor.
          )
      );

      // Subscriptions
      // id	creatorId	viewerId     userId = 201
      // 1	  101	      201           result     [ { userId: 101 },
      // 2	  102	      201                        { userId: 102 },
      // 3	  103	      202          
      // 4	  104	      201                        { userId: 101 }, ]

      const data = await db
        .with(viewerSubcription)                                        // Se incluye la CTE `viewer_subscriptions` en la consulta principal
        .select({                                                       // De la tabla videos se seleccionan los campos:
          ...getTableColumns(videos),                                   // props relativas a la tabla videos.                              
          user: users,                                                  // se agrega la relacion de usuarios
          viewCount: db.$count(                                         // videoCount: número de visualizaciones del video.                                
            videoViews, eq(videoViews.videoId, videos.id)
          ),
          likeCount: db.$count(                                         // likeCount: número de likes del video.
            videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                          // correspondientes al video
              eq(videoReactions.type, "like")                                 // con el tipo de reaction "like".
            )),
          dislikeCount: db.$count(                                      // dislikeCount: número de dislikes del video.
            videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                          // correspondientes al video
              eq(videoReactions.type, "dislike")                              // con el tipo de reaction "dislike".
            ))
        })
        .from(videos)                                                   // Solo se obtienen los videos 
        .innerJoin(users, eq(videos.userId, users.id))                  // (se agrega la relación de usuarios)
        .innerJoin(                                                     // Agregamos la lista de creadores a los que el usuario está suscrito.
          viewerSubcription,
          eq(viewerSubcription.userId, users.id)                              // Incluimos los users cuyos is = creatorId 
        )
        .where(and(
          eq(videos.visibility, "public"),                              // que sean públicos (visibility = "public")
          cursor                                                        // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
            ? or(
              lt(videos.updatedAt, cursor.updatedAt),                   // filtra los videos cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
              and(
                eq(videos.updatedAt, cursor.updatedAt),                 // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                lt(videos.id, cursor.id)
              )
            )
            : undefined,
        )).orderBy(desc(videos.updatedAt), desc(videos.id))             // Se ordena en orden descendente por updatedAt y luego por id.
        .limit(limit + 1)                                               // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


      const hasMore = data.length > limit;                              // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.

      const items = hasMore ? data.slice(0, -1) : data;                 // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

      const lastItem = items[items.length - 1];                         // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

      const nextCursor = hasMore                                          // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
        ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
        : null

      return {
        items,
        nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
      }
    }),
  getManyTrending: baseProcedure                                      // Indica que este endpoint no requiere autenticación.
    .input(                                                           // Valida los parámetros de entrada:
      z.object({  
        cursor: z.object({                                            // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                      // Identificador del último video cargado.
          viewCount: z.number()                                         // Fecha de actualización del último video cargado.  
        })
          .nullish(),
        limit: z.number().min(1).max(100),                            // Y 2º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input }) => {                                     // Validados los datos se procede a la consulta a la base de datos.

      const { cursor, limit } = input;                                // Se extraen los valores de input (cursor, limit).

      const viewCountSubquery = db.$count(                            // Se crea una subquery para obtener el número de visualizaciones de los videos.
        videoViews, eq(videoViews.videoId, videos.id)
      ) 

      const data = await db
        .select({                                                     // De la tabla videos se seleccionan los campos:
          ...getTableColumns(videos),                                 // props relativas a la tabla videos.                              
          user: users,                                                // se agrega la relacion de usuarios
          viewCount: viewCountSubquery,                               // videoCount: número de visualizaciones del video.
          likeCount: db.$count(                                       // likeCount: número de likes del video.
            videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                          // correspondientes al video
              eq(videoReactions.type, "like")                                 // con el tipo de reaction "like".
            )),
          dislikeCount: db.$count(                                    // dislikeCount: número de dislikes del video.
            videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                          // correspondientes al video
              eq(videoReactions.type, "dislike")                              // con el tipo de reaction "dislike".
            ))
        })
        .from(videos)                                                 // Solo se obtienen los videos 
        .innerJoin(users, eq(videos.userId, users.id))                // (se agrega la relación de usuarios)
        .where(and(
          eq(videos.visibility, "public"),                            // que sean públicos (visibility = "public")
          
          cursor                                                      // Y si hay un cursor, (Este cursor se usa para obtener los videos con mas visualizaciones)
            ? or(                                                     // se combinan dos condiciones  
              lt(viewCountSubquery, cursor.viewCount),                // 1. filtra los videos cuyo nº de visualizaciones (viewCountSubquery) sea menor (<) que la del cursor. Esto asegura que solo se obtengan videos con menos visualizaciones que el último video de la página anterior.
              and(                                                    // 2. Si dos videos tienen el mismo nº de visualizaciones, se usa id < cursor.id como desempate.
                eq(viewCountSubquery, cursor.viewCount),                   // Verifica que el número de visualizaciones del video sea igual al del cursor.              
                lt(videos.id, cursor.id)                                   // Filtra los videos cuyo ID es menor que el del cursor. Esto asegura que solo se obtengan videos más antiguos (con un ID menor) que el último video de la página anterior.
              )
            )
            : undefined,
        )).orderBy(desc(viewCountSubquery), desc(videos.id))          // Se ordena en orden descendente por nº de visualizaciones y luego por id.
        .limit(limit + 1)                                             // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


      const hasMore = data.length > limit;                            // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.

      const items = hasMore ? data.slice(0, -1) : data;               // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

      const lastItem = items[items.length - 1];                       // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

      const nextCursor = hasMore                                      // Si hasMore = true se crea un objeto nextCursor con el id y el viewCount del lastItem
        ? {
          id: lastItem.id,
          viewCount: lastItem.viewCount,
        }
        : null

      return {
        items,
        nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
      }
    }),
  getMany: baseProcedure                                                // Indica que este endpoint no requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        categoryId: z.string().uuid().nullish(),                        // 1º Parámetro de filtrado: categoryId
        cursor: z.object({                                              // 2º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.
          updatedAt: z.date()                                           // Fecha de actualización del último video cargado.  
        })
        .nullish(),
        limit: z.number().min(1).max(100),                              // Y 3º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input }) => {                                       // Validados los datos se procede a la consulta a la base de datos.
        
      const { cursor, limit, categoryId } = input;                      // Se extraen los valores de input (cursor, limit, categoryId).
  
        const data = await db
          .select({                                                     // De la tabla videos se seleccionan los campos:
            ...getTableColumns(videos),                                 // props relativas a la tabla videos.                              
            user: users,                                                // se agrega la relacion de usuarios
            viewCount: db.$count(                                       // videoCount: número de visualizaciones del video.                                
              videoViews, eq(videoViews.videoId, videos.id)
            ),           
            likeCount: db.$count(                                       // likeCount: número de likes del video.
              videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
                eq(videoReactions.videoId, videos.id),                          // correspondientes al video
                eq(videoReactions.type, "like")                                 // con el tipo de reaction "like".
              )),
            dislikeCount: db.$count(                                    // dislikeCount: número de dislikes del video.
              videoReactions, and(                                              // En la tabla videoReactions se filtran los likes.
                eq(videoReactions.videoId, videos.id),                          // correspondientes al video
                eq(videoReactions.type, "dislike")                              // con el tipo de reaction "dislike".
              ))  
            })
            .from(videos)                                                 // Solo se obtienen los videos 
            .innerJoin(users, eq(videos.userId, users.id))                // (se agrega la relación de usuarios)
            .where(and(
              eq(videos.visibility, "public"),                            // que sean públicos (visibility = "public")
              categoryId ? eq(videos.categoryId, categoryId) : undefined, // y que pertenecen a la categoría proporcionada.
              cursor                                                      // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
                ? or(
                  lt(videos.updatedAt, cursor.updatedAt),                 // filtra los videos cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),               // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                    lt(videos.id, cursor.id)
                  ) 
                )
                : undefined,
            )).orderBy(desc(videos.updatedAt), desc(videos.id))           // Se ordena en orden descendente por updatedAt y luego por id.
            .limit(limit + 1)                                             // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.
  
  
          const hasMore = data.length > limit;                            // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.
  
          const items = hasMore ? data.slice(0, -1) : data;               // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 
  
          const lastItem = items[items.length - 1];                       // Se extrae el último elemento de items para establecer el cursor de la siguiente página.
  
      const nextCursor = hasMore                                          // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
            ? {
              id: lastItem.id,
              updatedAt: lastItem.updatedAt,
            }
            : null
  
          return {
            items,
            nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
          }
    }),
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

