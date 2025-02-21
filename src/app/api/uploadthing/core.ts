import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
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
    .middleware(async ({ input }) => {                                   // 3º Middleware: Validación de usuario
      const {userId: clerkUserId } = await auth();                       // Obtiene el userId de Clerk
      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [user] = await db                                            // Busca el usuario en la base de datos
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))

      if(!user) throw new UploadThingError("Unauthorized");

      return { user, ...input };                                         // Retorna el user junto con el videoId validado (metadata)
    })
    .onUploadComplete(async ({ metadata, file }) => {                    // 4º Acción al completar la subida del file
      await db                                                              // Actualiza la base de datos
        .update(videos)                                                     // actualizando en la tabla videos la dirección de la imagen devuelta por UploadThing
        .set({                                                               
          thumbnailUrl: file.url,
        })
        .where(and(
          eq(videos.id, metadata.videoId),                                  // donde el id del video de base de datos = el id validado por UploadThing
          eq(videos.userId, metadata.user.id)                               // donde el userId del video de base de datos = el userId validado por UploadThing
        ))

      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
