import { AppRouter } from "@/trpc/routers/_app"
import { inferRouterOutputs } from "@trpc/server"



export const THUMBNAIL_FALLBACK = "/placeholder.svg"

export type VideoGetOneOutput =
  inferRouterOutputs<AppRouter>['videos']['getOne']; // Obtiene el tipo de salida de la función getOne de videos

//TODO: Change to videos getMany
export type VideoGetManyOutput =
  inferRouterOutputs<AppRouter>['suggestions']['getMany']; // Obtiene el tipo de salida de la función getMany de suggestions

