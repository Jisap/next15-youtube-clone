
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
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
})

      

