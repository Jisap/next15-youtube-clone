
import { videoReactions } from '@/db/schema';
import { baseProcedure, protectedProcedure, createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedures';



export const AppRouter = createTRPCRouter({ // Se crea un enrutador tRPC
  categories: categoriesRouter,              // que contiene un subrouter para las categorías -> procedimientos
  studio: studioRouter,
  videos: videosRouter,
  videoViews: videoViewsRouter,
  videoReactions: videoReactionsRouter,
});

export type AppRouter = typeof AppRouter