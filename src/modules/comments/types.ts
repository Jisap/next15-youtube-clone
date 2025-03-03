import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";




export type CommentGetManyOutput =
  inferRouterOutputs<AppRouter>['comments']['getMany']; // Obtiene el tipo de salida de la función getMany de comments