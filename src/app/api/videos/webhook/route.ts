
import { eq } from "drizzle-orm";
import {
  VideoAssetCreatedWebhookEvent,
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


// Este endpoint en Next.js maneja los webhooks de Mux para actualizar el estado de los videos en la base de datos

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
          muxAssetId: data.id,
          muxStatus: data.status
        })
        .where(eq(videos.muxUploadId, data.upload_id))                          // la fila donde muxUploadId coincida con data.upload_id
      break;
    }
  }

  return new Response("Webhook received", {status: 200})
}