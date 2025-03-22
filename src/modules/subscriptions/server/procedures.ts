
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";


export const SubscriptionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({userId: z.string().uuid()}))
    .mutation(async({ input, ctx }) => {
      const { userId } = input;                                  // A quien se va a subscribir (creatorId)
      
      if(userId === ctx.user.id){
        throw new TRPCError({ code: "BAD_REQUEST" })             // "You can't subscribe to yourself"
      }

      const  [createdSubscription] = await db
        .insert(subscriptions)
        .values({
          viewerId: ctx.user.id,                                 // El subscriptor es el usuario autenticado
          creatorId: userId                                      // el creatorId es el usuario que se va a subscribir que viene en el input
        })
        .returning()

      return createdSubscription
    }),
  remove: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;                                  // A quien se va a des-subscribir (creatorId)

      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST" })             // "You can't subscribe to yourself"
      }

      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, ctx.user.id),             // El subscriptor es el usuario autenticado
            eq(subscriptions.creatorId, userId)                  // creatorId === userId del input
          )
        )
        .returning()

      return deletedSubscription
    }),
   getMany: protectedProcedure                                            // Indica que este endpoint requiere autenticación.
      .input(                                                             // Valida los parámetros de entrada:
        z.object({
          cursor: z.object({                                              // 1º Cursor que es un objeto con:
            creatorId: z.string().uuid(),                                 // Identificador del último video cargado.
            updatedAt: z.date()                                           // Fecha de actualización del último video cargado.  
          })
          .nullish(),
          limit: z.number().min(1).max(100),                              // Y 2º Limit que es el número de videos a recuperar 
        })
      )
      .query(async ({ input, ctx }) => {                                  // Validados los datos se procede a la consulta a la base de datos.
          
        const { cursor, limit } = input;                                  // Se extraen los valores de input (cursor, limit).
        const { id: userId } = ctx.user;                                  // Obtenemos el id de usuario autenticado desde el ctx.

          const data = await db
            .select({                                                     // De la tabla videos se seleccionan los campos:
              ...getTableColumns(subscriptions),                          // props relativas a la tabla videos.                              
              user: {
                ...getTableColumns(users),                                // se agrega la relacion de usuarios
                subscriberCount: db.$count(                               // subscriberCount: número de subscriptiones del usuario.                                
                  subscriptions, eq(subscriptions.creatorId, users.id)
                ),           
              }}
            )
            .from(subscriptions)                                           // Solo se obtienen las subscriptiones 
            .innerJoin(users, eq(subscriptions.creatorId, users.id))       // (se agrega la relación de usuarios)
            .where(
              and(
                eq(subscriptions.viewerId, userId),                        // que pertenecen al usuario autenticado
                cursor                                                     // Y si hay un cursor, (Este cursor se usa para obtener solo las subscripciones más antiguas)
                  ? or(
                    lt(subscriptions.updatedAt, cursor.updatedAt),         // filtra las subscripciones cuya fecha de actualización (updatedAt) sea anterior (<) a la del cursor.
                    and(
                      eq(subscriptions.updatedAt, cursor.updatedAt),       // Si dos subscripciones tienen la misma updatedAt, se usa el creatorId menor como desempate.
                      lt(subscriptions.creatorId, cursor.creatorId)
                    ) 
                  )
                  : undefined,
              )).orderBy(                                                   // Se ordena en orden descendente por updatedAt y luego por creatorId.
                desc(subscriptions.updatedAt), 
                desc(subscriptions.creatorId)
              )           
              .limit(limit + 1)                                             // Se recupera limit + 1 elementos para determinar si hay más páginas disponibles.
    
    
            const hasMore = data.length > limit;                            // Si data contiene más elementos(limit+1) de los solicitados (limit), significa que hay más videos disponibles.
    
            const items = hasMore ? data.slice(0, -1) : data;               // Si hay más elementos, se elimina el último para no enviarlo al cliente y así no superar el limit 
    
            const lastItem = items[items.length - 1];                       // Se extrae el último elemento de items para establecer el cursor de la siguiente página.
    
        const nextCursor = hasMore                                          // Si hasMore = true se crea un objeto nextCursor con el id y updatedAt del lastItem
              ? {
                creatorId: lastItem.creatorId,
                updatedAt: lastItem.updatedAt,
              }
              : null
    
            return {
              items,
              nextCursor, // Este cursor se utilizará en la próxima solicitud para obtener los siguientes videos.
            }
      }),
})

      

