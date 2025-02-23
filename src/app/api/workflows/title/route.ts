

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs"
import { and, eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";


interface InputType {
  userId: string;
  videoId: string;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(
  async (context) => {

    const input = context.requestPayload as InputType;
    const { videoId, userId } = input;

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

    const transcript = await context.run("get-transcript", async() => {
      const trackUrl = `https://stream.mux.com/${video.muxPlayBackId}/text/${video.muxTrackId}.txt`
      const response = await fetch(trackUrl)
      const text = response.text();
      if(!text){
        throw new Error("Bad request")
      }
      return text
    })

    // Claude API
    // const { body } = await context.api.anthropic.call(
    //   "generate-title",
    //   {
    //     token: process.env.CLAUDE_API_KEY!,
    //     operation: "messages.create",
    //     body: {
    //       model: "claude-3-5-sonnet-20241022",
    //       max_tokens: 1024,
    //       messages: [
    //         { 
    //           "role": "user", 
    //           "content": TITLE_SYSTEM_PROMPT  
    //         }
    //       ]
    //     },
    //   }
    // );
    // console.log(body.content[0].text)
    // const title = body.content[0].text;
    
    // DeepSeek API
    // const { body } = await context.api.openai.call(
    //   "generate-title",
    //   {
    //     baseURL: "https://api.deepseek.com",
    //     token: process.env.DEEPSEEK_API_KEY!,
    //     operation: "chat.completions.create",
    //     body: {
    //       model: "gpt-4o",
    //       messages: [
    //         {
    //           role: "system",
    //           content: TITLE_SYSTEM_PROMPT,
    //         },
    //         {
    //           role: "user",
    //           content: "User shouts back 'hi!'"
    //         }
    //       ],
    //     },
    //   }
    // );

    // console.log(body.choices[0].message.content);
    // const title = body.choices[0].message.content;

    // Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `${TITLE_SYSTEM_PROMPT}\nTranscript: ${transcript}\nVideo description: ${video.description}'`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const title = text;
    console.log("text",text);

    if(!title){
      throw new Error("Bad request")
    }


    await context.run("update-video", async() => {
      await db
        .update(videos)
        .set({
          title: title || video.title,
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, video.userId)
        ))
    })
  }
)