
import { baseProcedure, protectedProcedure, createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';



export const AppRouter = createTRPCRouter({ // Se crea un enrutador tRPC
  categories: categoriesRouter,              // que contiene un subrouter para las categorías -> procedimientos
  studio: studioRouter,
  videos: videosRouter,
  videoViews: videoViewsRouter,
});

export type AppRouter = typeof AppRouter