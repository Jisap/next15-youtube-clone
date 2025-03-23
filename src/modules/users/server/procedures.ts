
import { db } from "@/db";
import { subscriptions, users, videos } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, eq, getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";





export const usersRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))                                         // Se requiere de un id de un usuario
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

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(                 // Se crea una subconsulta para obtener las suscripciones del usuario actual
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))              // Para ello se filtra los resultados para obtener solo las suscripciones cuyo viewerId coincide con userId.
      )

      const [existingUser] = await db                                                  // Consulta ppal: obtener datos del usuario solicitado
        .with(
          viewerSubscriptions                                                          // Se agrega la subconsulta "viewer_subscriptions" para obtener la cantidad de suscripciones del usuario.
        )                                    
        .select({
          ...getTableColumns(users),                                                   // Se mostrarán  todas las columnas de users                                
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),  // Agrega una propiedad viewerSubscribed, que será true o false dependiendo de si el usuario autenticado está suscrito al usuario que estamos consultando.
          videoCount: db.$count(videos, eq(videos.userId, users.id)),                  // Cuenta el número de videos del usuario solicitado
          subscriberCount: db.$count(
            subscriptions, eq(subscriptions.creatorId, users.id)                       // Cuenta el número de suscriptores del usuario solicitado
          ), 
        })
        .from(users)
        .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id))    // De todos los usuarios (users), quiero saber si el usuario autenticado (viewer) los sigue (creatorId = users.id).
        .where(and(eq(users.id, input.id)))                                            // El where filtra para buscar exactamente el usuario con el id que pasamos en el input.
        

      if(!existingUser){
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return existingUser
    }),
  
})


