

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs"
import { and, eq } from "drizzle-orm";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { UTApi } from "uploadthing/server";
import path from "path";
import os from "os";
import fs from "fs/promises";


interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}

export const { POST } = serve(
  async (context) => {

    const utapi = new UTApi();
    const input = context.requestPayload as InputType;
    const { videoId, userId, prompt } = input;

    const video = await context.run("get-video", async() => {
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, videoId),
          eq(videos.userId, userId)
        ));

      if (!existingVideo) throw new Error("Video not found");

      return existingVideo;
    });

    
    // Open AI
    const { body } = await context.call<{ data: { url: string }[] }>(
      "generate-thumbnail",
      {
        url: "https://api.openai.com/v1/images/generations",
        method: "POST",
        body :{
          prompt: prompt,
          n: 1,
          model: "dall-e-3",
          size: "1792x1024",
        },
       headers: {
         authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
       }    
      }
    )
    
     const tempThumbnailUrl = body.data[0].url 
     if(!tempThumbnailUrl){
       throw new Error("Bad request")
     }
    
    await context.run("cleanup-thumbnail", async () => {
      if(video.thumbnailKey){
        await utapi.deleteFiles(video.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(
            eq(videos.id, videoId),
            eq(videos.userId, userId)
          ))
      }
    
    const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
      const { data, error } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);
    
      if(!data){
        throw new Error("Bad request")
      }
    
      return data
    })
    
    await context.run("update-video", async() => {
      await db
        .update(videos)
        .set({
          thumbnailKey: uploadedThumbnail.key,
          thumbnailUrl: uploadedThumbnail.url,
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, video.userId)
        ))
    })

    })



    // Google Generative AI
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 

    // const promptParts: Part[] = [{ text: prompt }];

    // try {
    //   const result = await model.generateContent({
    //     contents: [{ parts: promptParts, role: "user" }],
    //   });

    //   const response = await result.response;

    //   if (
    //     response && response.candidates &&
    //     response.candidates.length > 0 &&
    //     response.candidates[0].content &&
    //     response.candidates[0].content.parts
    //   ) {
    //     const textParts = response.candidates[0].content.parts;

    //     if (textParts && textParts.length > 0) {
    //       // Asumiendo que la respuesta es un texto con la URL de la imagen
    //       const textPart = textParts[0]; // Obtenemos el primer elemento
    //       if (textPart && textPart.text) { // Verificamos que exista y que tenga la propiedad text
    //         const imageUrl = textPart.text.trim();

    //         // Validar la URL de la imagen
    //         try {
    //           new URL(imageUrl); // Intenta crear una URL para validarla
    //         } catch (error) {
    //           throw new Error("Invalid image URL received from Gemini.");
    //         }

    //         await context.run("cleanup-thumbnail", async () => {
    //           if (video.thumbnailKey) {
    //             await utapi.deleteFiles(video.thumbnailKey);
    //             await db
    //               .update(videos)
    //               .set({ thumbnailKey: null, thumbnailUrl: null })
    //               .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    //           }
    //         });

    //         const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
    //           const response = await fetch(imageUrl);

    //           if (!response.ok) {
    //             throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
    //           }

    //           const buffer = await response.arrayBuffer();
    //           const blob = new Blob([buffer]);
    //           (blob as any).name = `${videoId}.png`;

    //           const { data, error } = await utapi.uploadFiles(blob as any);

    //           if (!data) {
    //             throw new Error("Failed to upload thumbnail to UploadThing.");
    //           }

    //           const uploadedFile = Array.isArray(data) ? data[0] : data; // Acceder al primer elemento si es un array
    //           return uploadedFile;
    //         });

    //         await context.run("update-video", async () => {
    //           await db
    //             .update(videos)
    //             .set({
    //               thumbnailKey: uploadedThumbnail.key,
    //               thumbnailUrl: uploadedThumbnail.url,
    //             })
    //             .where(and(eq(videos.id, videoId), eq(videos.userId, video.userId)));
    //         });
    //       } else {
    //         throw new Error("No text property in the first part of the response.");
    //       }
    //     } else {
    //       throw new Error("No text parts in the response.");
    //     }
    //   } else {
    //     throw new Error("Invalid response format from Gemini API.");
    //   }
    // } catch (error) {
    //   console.error("Error generating or processing thumbnail:", error);
    //   throw error;
    // }
   
})