
import { comments, subscriptions, videoReactions } from '@/db/schema';
import { baseProcedure, protectedProcedure, createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedures';
import { SubscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';
import { commentReactionsRouter } from '@/modules/comments-reactions/server/procedures';
import { suggestionRouter } from '@/modules/suggestions/server/procedures';
import { searchRouter } from '@/modules/search/server/procedures';
import { playlistsRouter } from '@/modules/playlists/server/procedures';
import { usersRouter } from '@/modules/users/server/procedures';



export const AppRouter = createTRPCRouter({ // Se crea un enrutador tRPC
  categories: categoriesRouter,              // que contiene un subrouter para las categorías -> procedimientos
  studio: studioRouter,
  videos: videosRouter,
  videoViews: videoViewsRouter,
  videoReactions: videoReactionsRouter,
  subscriptions: SubscriptionsRouter,
  comments: commentsRouter,
  commentsReactions: commentReactionsRouter,
  suggestions: suggestionRouter,
  search: searchRouter,
  playlists: playlistsRouter,
  users: usersRouter,
});

export type AppRouter = typeof AppRouter