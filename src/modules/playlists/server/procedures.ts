import { db } from "@/db";
import { playlists, playlistVideos, users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";





export const playlistsRouter = createTRPCRouter({
  getLiked: protectedProcedure                                          // Indica que este endpoint requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        cursor: z.object({                                              // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.  
          likedAt: z.date()                                             // Fecha de visualización del último video gustado.
        })
          .nullish(),
        limit: z.number().min(1).max(100),                              // Y 3º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input, ctx }) => {                                  // Validados los datos se procede a la consulta a la base de datos.
      const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.
      const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit).

      const viewerVideoReactions = db.$with("viewer_video_reactions").as( // Crea una subconsulta temporal llamada "viewer_video_reactions"
        db
          .select({                                                     // Esta subconsulta tiene dos columnas:
            videoId: videoReactions.videoId,                            // videoId: El identificador del video sobre el que se hizo like.
            likedAt: videoReactions.updatedAt                           // viewedAt: La fecha y hora de la última visualización del video 
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),                        // Filtra solo las vistas del usuario autenticado.
              eq(videoReactions.type, "like")                           // Filtra solo los registros de tipo like.
            )
          )
      )

      const data = await db
        .with(viewerVideoReactions)                                     // Se incluye la CTE `viewer_video_reactions` en la consulta principal
        .select({                                                       // Esta consulta mostrará las siguiente columnas:
          ...getTableColumns(videos),                                   // De la tabla videos se mostrarán los campos relativos a la tabla videos.                              
          user: users,                                                  // Se mostrará la relacion de usuarios
          likedAt: viewerVideoReactions.likedAt,                        // likedAt: Fecha y hora de la última visualización del video.
          viewCount: db.$count(                                         // videoCount: número de visualizaciones del video.                                
            videoViews, eq(videoViews.videoId, videos.id)
          ),
          likeCount: db.$count(                                         // likeCount: número de likes del video.
            videoReactions, and(                                            // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                        // correspondientes al video
              eq(videoReactions.type, "like")                               // con el tipo de reaction "like".
            )),
          dislikeCount: db.$count(                                      // dislikeCount: número de dislikes del video.
            videoReactions, and(                                            // En la tabla videoReactions se filtran los likes.
              eq(videoReactions.videoId, videos.id),                        // correspondientes al video
              eq(videoReactions.type, "dislike")                            // con el tipo de reaction "dislike".
            ))
        })
        .from(videos)                                                   // Solo se obtienen los videos 
        .innerJoin(users, eq(videos.userId, users.id))                  // (se agrega la relación de usuarios)
        .innerJoin(
          viewerVideoReactions, eq(videos.id, viewerVideoReactions.videoId))  // Se agrega la relación de viewerVideoReactions
        .where(and(
          eq(videos.visibility, "public"),                              // que sean públicos (visibility = "public")
          cursor                                                        // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
            ? or(
              lt(viewerVideoReactions.likedAt, cursor.likedAt),                 // filtra los videos cuya fecha de reacción (likedAt) sea anterior (<) a la del cursor.
              and(
                eq(viewerVideoReactions.likedAt, cursor.likedAt),               // Si dos videos tienen la misma likedAt, se usa id < cursor.id como desempate.
                lt(videos.id, cursor.id)
              )
            )
            : undefined,
        )).orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))  // Se ordena en orden descendente por viewedAt y luego por id.
        .limit(limit + 1)                                                // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


      const hasMore = data.length > limit;                               // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.

      const items = hasMore ? data.slice(0, -1) : data;                  // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

      const lastItem = items[items.length - 1];                          // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

      const nextCursor = hasMore                                         // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
        ? {
          id: lastItem.id,
          likedAt: lastItem.likedAt,
        }
        : null

      return {
        items,
        nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
      }
    }),
  getHistory: protectedProcedure                                        // Indica que este endpoint requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        cursor: z.object({                                              // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.  
          viewedAt: z.date()                                            // Fecha de visualización del último video cargado.
        })
        .nullish(),
        limit: z.number().min(1).max(100),                              // Y 3º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input, ctx }) => {                                  // Validados los datos se procede a la consulta a la base de datos.
      const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.
      const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit).
  
      const viewerVideoViews = db.$with("viewer_video_views").as(       // Crea una subconsulta temporal llamada "viewer_video_views"
        db
          .select({                                                     // Esta subconsulta tiene dos columnas:
            videoId: videoViews.videoId,                                // videoId: El identificador del video visto.
            viewedAt: videoViews.updatedAt                              // viewedAt: La fecha y hora de la última visualización del video 
          })
          .from(videoViews)
          .where(
            eq(videoViews.userId, userId)                               // Filtra solo las vistas del usuario autenticado.
          )
      )

        const data = await db
          .with(viewerVideoViews)                                       // Se incluye la CTE `viewer_video_views` en la consulta principal
          .select({                                                     // Esta consulta mostrará las siguiente columnas:
            ...getTableColumns(videos),                                 // De la tabla videos se mostrarán los campos relativos a la tabla videos.                              
            user: users,                                                // Se mostrará la relacion de usuarios
            viewedAt: viewerVideoViews.viewedAt,                        // viewedAt: Fecha y hora de la última visualización del video.
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
            .innerJoin(
              viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))  // Se agrega la relación de viewerVideoViews
            .where(and(
              eq(videos.visibility, "public"),                            // que sean públicos (visibility = "public")
              cursor                                                      // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
                ? or(
                  lt(viewerVideoViews.viewedAt, cursor.viewedAt),                 // filtra los videos cuya fecha de visualización (viewedAt) sea anterior (<) a la del cursor.
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),               // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                    lt(videos.id, cursor.id)
                  ) 
                )
                : undefined,
            )).orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))  // Se ordena en orden descendente por viewedAt y luego por id.
            .limit(limit + 1)                                             // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.
  
  
          const hasMore = data.length > limit;                            // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.
  
          const items = hasMore ? data.slice(0, -1) : data;               // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 
  
          const lastItem = items[items.length - 1];                       // Se extrae el último elemento de items para establecer el cursor de la siguiente página.
  
      const nextCursor = hasMore                                          // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
            ? {
              id: lastItem.id,
              viewedAt: lastItem.viewedAt,
            }
            : null
  
          return {
            items,
            nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
          }
    }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { name } = input;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
        })
        .returning();

      if(!createdPlaylist) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdPlaylist;
    }),
  // Agrega un video a una lista de reproducción
  addVideo: protectedProcedure
    .input(z.object({
      playlistId: z.string().uuid(),
      videoId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, playlistId),                             // Verifica si el playlist existe
            eq(playlists.userId, userId)                              // Verifica si el usuario es el dueño del playlist
          ))

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(
          eq(videos.id, videoId),                                      // Verifica si el video existe en la base de datos
        )

      if(!existingVideo){
        throw new TRPCError({ code: "NOT_FOUND" });                    // Si no existe, se lanza un error
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),                 // Verifica si en lista de reproducción existe unu registro con el mismo playlistId y videoId
            eq(playlistVideos.videoId, videoId)        
          )
        )

      if(existingPlaylistVideo){
        throw new TRPCError({ code: "CONFLICT" });                     // Si existe, se lanza un error
      }

      const [createdPlaylistVideo] = await db                          // Si se pasan todos los tests, se inserta el registro en la tabla playlistVideos
        .insert(playlistVideos)
        .values({
          playlistId,
          videoId,
        })
        .returning();

      return createdPlaylistVideo;
    }),
  // Elimina un video de una lista de reproducción
  removeVideo: protectedProcedure
    .input(z.object({
      playlistId: z.string().uuid(),
      videoId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, playlistId),                             // Verifica si el playlist existe
            eq(playlists.userId, userId)                              // Verifica si el usuario es el dueño del playlist
          ))

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(
          eq(videos.id, videoId),                                      // Verifica si el video existe en la base de datos
        )

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });                    // Si no existe, se lanza un error
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),                 // Verifica si en lista de reproducción existe un registro con el mismo playlistId y videoId
            eq(playlistVideos.videoId, videoId)
          )
        )

      if (!existingPlaylistVideo) {
        throw new TRPCError({ code: "CONFLICT" });                     // Si no existe, se lanza un error
      }

      const [deletedPlaylistVideo] = await db                          // Si se pasan todos los tests, se borra el registro en la tabla playlistVideos
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),                 // Verifica si en lista de reproducción existe un registro con el mismo playlistId y videoId
            eq(playlistVideos.videoId, videoId)
          )
        )
        .returning();

      return deletedPlaylistVideo;
    }),
  // Devuelve playlists de un usuario autenticado
  getMany: protectedProcedure                                           // Indica que este endpoint requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        cursor: z.object({                                              // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.  
          updatedAt: z.date()                                           // Fecha de visualización del último video cargado.
        })
          .nullish(),
        limit: z.number().min(1).max(100),                              // Y 2º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input, ctx }) => {                                  // Validados los datos se procede a la consulta a la base de datos.
      const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.
      const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit).

      const data = await db
        .select({                                                       // Esta consulta mostrará las siguiente columnas:
          ...getTableColumns(playlists),                                // De la tabla playlists se mostrarán los campos relativos a la misma.                              
          videoCount: db.$count(                                        // videoCount: número de videos del playlist.
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId)
          ),
          user: users,                                                  // Se agrega la relación de usuarios
        })
        .from(playlists)                                                // Solo se obtienen las playlists 
        .innerJoin(users, eq(playlists.userId, users.id))               // Solo se seleccionarán playlists cuyos userId existan en la tabla users. 
        .where(and(
          eq(playlists.userId, userId),                                 // Filtramos solo las suscripciones del usuario actual
          cursor                                                        // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
            ? or(
              lt(playlists.updatedAt, cursor.updatedAt),                // filtra playlist cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
              and(
                eq(playlists.updatedAt, cursor.updatedAt),              // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                lt(playlists.id, cursor.id)
              )
            )
            : undefined,
        )).orderBy(desc(playlists.updatedAt), desc(playlists.id))       // Se ordena en orden descendente por updatedAt y luego por id.
        .limit(limit + 1)                                               // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


      const hasMore = data.length > limit;                              // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.

      const items = hasMore ? data.slice(0, -1) : data;                 // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

      const lastItem = items[items.length - 1];                         // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

      const nextCursor = hasMore                                        // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
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
  // Devuelve playlists de un usuario autenticado con info extra sobre si un video concreto se encuentra en ellas
  getManyForVideo: protectedProcedure                                   // Indica que este endpoint requiere autenticación.
    .input(                                                             // Valida los parámetros de entrada:
      z.object({
        videoId: z.string().uuid(),                                     // El id del video que se desea agregar a la playlists.
        cursor: z.object({                                              // 1º Cursor que es un objeto con:
          id: z.string().uuid(),                                        // Identificador del último video cargado.  
          updatedAt: z.date()                                           // Fecha de visualización del último video cargado.
        })
          .nullish(),
        limit: z.number().min(1).max(100),                              // Y 2º Limit que es el número de videos a recuperar 
      })
    )
    .query(async ({ input, ctx }) => {                                  // Validados los datos se procede a la consulta a la base de datos.
      const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.
      const { cursor, limit, videoId } = input;                         // Se extraen los valores de input (cursor, limit y videoId).

      const data = await db
        .select({                                                       // Esta consulta mostrará las siguiente columnas:
          ...getTableColumns(playlists),                                // De la tabla playlists se mostrarán los campos relativos a la misma.                              
          videoCount: db.$count(                                        // videoCount: número de videos del playlist.
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId)
          ),
          user: users,                                                  // Se agrega la relación de usuarios
          containsVideo: videoId                                        // Verificamos si existe alguna fila en playlistVideos (pv) donde el id del nombre de la lista coincide el id de la lista de reproducción y el id del video 
            ? sql<boolean>`(
              SELECT EXISTS ( 
                SELECT 1
                FROM ${playlistVideos} pv
                WHERE pv.playlist_id = ${playlists.id} AND pv.video_id = ${videoId}
              )
            )`
            : sql<boolean>`false`
        })
        .from(playlists)                                                // Solo se obtienen las playlists 
        .innerJoin(users, eq(playlists.userId, users.id))               // Solo se seleccionarán playlists cuyos userId existan en la tabla users. 
        .where(and(
          eq(playlists.userId, userId),                                 // Filtramos solo las suscripciones del usuario actual
          cursor                                                        // Y si hay un cursor, (Este cursor se usa para obtener solo los videos más antiguos)
            ? or(
              lt(playlists.updatedAt, cursor.updatedAt),                // filtra playlist cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
              and(
                eq(playlists.updatedAt, cursor.updatedAt),              // Si dos videos tienen la misma updatedAt, se usa id < cursor.id como desempate.
                lt(playlists.id, cursor.id)
              )
            )
            : undefined,
        )).orderBy(desc(playlists.updatedAt), desc(playlists.id))       // Se ordena en orden descendente por updatedAt y luego por id.
        .limit(limit + 1)                                               // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.


      const hasMore = data.length > limit;                              // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.

      const items = hasMore ? data.slice(0, -1) : data;                 // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 

      const lastItem = items[items.length - 1];                         // Se extrae el último elemento de items para establecer el cursor de la siguiente página.

      const nextCursor = hasMore                                        // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
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
})

