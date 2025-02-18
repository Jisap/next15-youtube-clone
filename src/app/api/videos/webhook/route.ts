import { eq } from "drizzle-orm";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetDeletedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
} from "@mux/mux-node/resources/webhooks"
import { headers } from "next/headers";
import { mux } from "@/lib/mux";
import { db } from "@/db";
import { videos } from "@/db/schema";

const SIGNIN_SECRET = process.env.MUX_WEBHOOK_SECRET!;

type WenhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent


// Este endpoint en Next.js maneja los webhooks de Mux para actualizar el estado de los videos en la base de datos
// cuando se envian videos a Mux

export const POST = async(request: Request) => {
  if(!SIGNIN_SECRET){
    throw new Error("MUX_WEBHOOK_SECRET no definido")
  }

  const headersPayload = await headers();                                       // Se obtienen los headers de la solicitud 
  const muxSignature = headersPayload.get("mux-signature");                     // y se busca el header mux-signature, que Mux envía para verificar la autenticidad del webhook.

  if(!muxSignature){
    throw new Response("No signature found", {status: 401})
  }

  const payload = await request.json();                                         // Se obtiene el cuerpo de la solicitud (payload).
  const body = JSON.stringify(payload);                                         // Se convierte a JSON en forma de string (body).

  mux.webhooks.verifySignature(                                                 // Se usa mux.webhooks.verifySignature para validar que la firma mux-signature es correcta usando SIGNIN_SECRET. 
    body,
    {
      "mux-signature": muxSignature,  
    },
    SIGNIN_SECRET 
  )

  switch (payload.type as WenhookEvent["type"]) {                               // Se obtiene el tipo de evento del payload.
    
    case "video.asset.created": {                                               // Si el evento es "video.asset.created", significa que un nuevo video ha sido creado en Mux.
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];       // Se extrae la información del data del evento.  
      if(!data.upload_id){
        return new Response("No upload ID found", {status: 400})
      }

      await db                                                                  // Se actualiza la base de datos usando Drizzle 
        .update(videos)                                                         // Se busca en la tabla videos 
        .set({                                                                          // con Set se establecen los valores de muxAssetId y muxStatus 
          muxAssetId: data.id,                                                          // id en mux del video subido
          muxStatus: data.status                                                        // status del video subido
        })
        .where(eq(videos.muxUploadId, data.upload_id))                          // la fila donde muxUploadId coincida con data.upload_id
      break;
    }
    // Este nuevo evento "video.asset.ready" se ejecuta cuando un video en 
    // Mux ha sido procesado completamente y está listo para la reproducción.
    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];         // data contiene los datos enviados por Mux cuando el video está listo.
      const playbackId = data.playback_ids?.[0].id                              // Se extrae el playbackId del primer elemento de la lista de playback_ids. El playbackId es un identificador único que Mux asigna a un video para permitir su reproducción.
      
      if(!data.upload_id){
        return new Response("No upload ID found", {status: 400})
      }

      if(!playbackId){
        return new Response("No playback ID found", {status: 400})
      }

      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.png`   // Se crea una URL para obtener la miniatura del video
      const previewUrl = `https://image.mux.com/${playbackId}/animated.gif`      // Se crea una URL para obtener una vista previa del video
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;     // Se obtiene la duración del video                                            

      await db                                                                   // Actualiza la base de datos con la información final del video 
        .update(videos)
        .set({
          muxStatus: data.status,                                                // Se actualiza con el estado actual del video ("ready").
          muxPlayBackId: playbackId,                                             // Se guarda el playbackId en la base de datos para reproducir el video en el frontend. 
          muxAssetId: data.id,                                                   // Se guarda el id del video en Mux.
          thumbnailUrl,                                                          // Se guarda la URL de la miniatura del video.
          previewUrl,                                                            // Se guarda la URL de la vista previa del video.
          duration,                                                              // Se guarda la duración del video.
        })
        .where(eq(videos.muxUploadId, data.upload_id))                           // Se busca la fila en la tabla videos donde muxUploadId coincide con data.upload_id
      break;
    }
    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];
    
      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 })
      }

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id))
      break;
    }

    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 })
      }

      await db
        .delete(videos)
        .where(eq(videos.muxUploadId, data.upload_id))
      break;
    }

    // Se activa cuando una pista (track) de un video en Mux está lista para usarse.
    // Este evento es útil cuando un video tiene pistas adicionales, como: Subtítulos, audio alternativo, transcripciones
    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & { 
        asset_id: string;                                                      // Typescript no puede inferir el tipo de asset_id, por lo que se lo asignamos manualmente
      }

      
      const assetId = data.asset_id;                                            // Se extrae el ID del video en Mux.
      const trackId = data.id;                                                  // Se extrae el ID de la pista en Mux.
      const status = data.status;                                               // Se extrae el estado de la pista en Mux.

      if (!assetId) {
        return new Response("Missing asset ID", { status: 400 })
      }

      await db
        .update(videos)
        .set({                                                                  // Esto permite almacenar el estado de los subtítulos o audios alternativos dentro del sistema.
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId))
      break;
    }
  }

  return new Response("Webhook received", {status: 200})
}