import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();                                           // Crea una instancia de UploadThing.


export const ourFileRouter = {                                           // Definición del enrutador de archivos. Este contiene:                                             
  thumbnailUploader: f({                                                 // 1º Configuración del uploader con la instancia de UploadThing
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({                                                    // 2º Validación de la entrada: videoId
      videoId: z.string().uuid(),
     }))
    .middleware(async ({ input }) => {                                   // 3º Middleware: Validación de usuario y gestión del thumbnailKey
      const {userId: clerkUserId } = await auth();                       // Obtiene el userId de Clerk
      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [user] = await db                                            // Busca el usuario en la base de datos
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))

      if(!user) throw new UploadThingError("Unauthorized");

      const [existingVideo] = await db                                   // Busca si el video ya existe en base de datos
        .select({
          thumbnailKey: videos.thumbnailKey,                             // y selecciona el campo thumbnailKey
        })
        .from(videos)
        .where(and(
          eq(videos.id, input.videoId),                                  // donde el id del video de base de datos = al id del input
          eq(videos.userId, user.id)                                     // donde el userId del video de base de datos = el userId del usuario logueado
        ))

        if(!existingVideo){
          throw new UploadThingError("Not found")
        }

        if(existingVideo.thumbnailKey){                                   // Si el video existe y tiene un thumbnailKey
          const utapi = new UTApi();
          await utapi.deleteFiles(existingVideo.thumbnailKey);            // borra el archivo de uploadthing
          await db                                                        // Y borra la referencia en la tabla videos
            .update(videos)
            .set({ 
              thumbnailKey: null,
              thumbnailUrl: null,
            })
            .where(and(
              eq(videos.id, input.videoId),
              eq(videos.userId, user.id)
            ))
        }

      return { user, ...input };                                         // 4º Retorna el user junto con el videoId validado (metadata)
    })
    .onUploadComplete(async ({ metadata, file }) => {                    // 5º Acción al completar la subida del file
      await db                                                              // Actualiza la base de datos
        .update(videos)                                                     // actualizando en la tabla videos la dirección de la imagen devuelta por UploadThing
        .set({                                                              // y el key de referencia en uploadthing       
          thumbnailUrl: file.url,
          thumbnailKey: file.key,
        })
        .where(and(
          eq(videos.id, metadata.videoId),                                  // donde el id del video de base de datos = el id validado por UploadThing
          eq(videos.userId, metadata.user.id)                               // donde el userId del video de base de datos = el userId validado por UploadThing
        ))

      return { uploadedBy: metadata.user.id };
    }),
  bannerlUploader: f({                                                   // 1º Configuración del uploader con la instancia de UploadThing
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {                                             // 2º Middleware: 
      const { userId: clerkUserId } = await auth();                       // Obtiene el userId de Clerk
      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [existingUser] = await db                                     // Busca el usuario en la base de datos con ese userId
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))

      if (!existingUser) throw new UploadThingError("Unauthorized");

      

      if (existingUser.bannerKey) {                                      // Si el usuario existe y tiene un bannerKey
        const utapi = new UTApi();
        await utapi.deleteFiles(existingUser.bannerKey);                 // borra el archivo de uploadthing
        await db                                                         // Y borra la referencia en bd de la tabla users
          .update(users)
          .set({
            bannerKey: null,
            bannerUrl: null,
          })
          .where(and(
            eq(users.id, existingUser.id)
          ))
      }

      return { userId: existingUser.id };                                // 3º Retorna el userId 
    })
    .onUploadComplete(async ({ metadata, file }) => {                    // 4º Acción al completar la subida del file
      await db                                                              // Actualiza la base de datos
        .update(users)                                                      // actualizando en la tabla users la dirección de la imagen devuelta por UploadThing
        .set({                                                              // y el key de referencia en uploadthing       
          bannerUrl: file.url,
          bannerKey: file.key,
        })
        .where(and(
          eq(users.id, metadata.userId),                                    // donde el id del usuario de base de datos = el id validado por UploadThing
        ))

      return { uploadedBy: metadata.userId};
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
