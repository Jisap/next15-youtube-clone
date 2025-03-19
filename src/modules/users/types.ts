

import { AppRouter } from "@/trpc/routers/_app"
import { inferRouterOutputs } from "@trpc/server"



export const THUMBNAIL_FALLBACK = "/placeholder.svg"

export type UserGetOneOutput =
  inferRouterOutputs<AppRouter>['users']['getOne']; // Obtiene el tipo de salida de la función getOne de users

