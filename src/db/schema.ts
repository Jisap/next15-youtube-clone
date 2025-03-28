

import { relations } from "drizzle-orm";

import { pgTable, uuid, text, timestamp, uniqueIndex, integer, pgEnum, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const reactionType = pgEnum("reaction_type", ["like", "dislike"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name").notNull(),
  bannerUrl: text("banner_url"),
  bannerKey: text("banner_key"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]); 

// Se crea un índice único llamado `clerk_id_idx` sobre la columna `clerkId`.
// Este índice garantiza que no haya duplicados en la columna `clerkId` y mejora el rendimiento de las consultas que filtran por `clerkId`

export const userRelations = relations(users, ({many}) => ({       // Cada user tiene muchos videos
  video: many(videos),
  videoViews: many(videoViews),
  videoReactions: many(videoReactions),
  subscriptions: many(subscriptions, {                             // Un usuario puede suscribirse a muchos otros usuarios.
    relationName: "subscriptions_viewer_id_fkey" 
  }),  
  subscribers: many(subscriptions, {                               // Un usuario puede tener muchos suscriptores (otros usuarios que lo siguen).
    relationName: "subscriptions_creator_id_fkey"
  }),
  comments: many(comments),                                        // Un usuario puede tener muchos comentarios
  commentReactions: many(commentReactions),                        // Un usuario puede tener muchas reacciones a comentarios
  playlists: many(playlists),                                      // Un usuario puede tener muchas playlists
}));

export const subscriptions = pgTable("subscriptions", {
  viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),   // Representa al usuario que sigue o se suscribe a otro usuario.
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Representa al usuario que es seguido o suscrito por otros.
  createdAt: timestamp("created_at").defaultNow().notNull(), 
  updatedAt: timestamp("updated_at").defaultNow().notNull(), 
}, (t) => [
  primaryKey({
    name: "subscriptions_pk",
    columns: [t.viewerId, t.creatorId]
  }),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({               // Se agregan relaciones a la tabla subscriptions
  viewer: one(users, {                                                                       // Cada subscription tiene un viewerId que apunta a un id en la tabla users.
    fields: [subscriptions.viewerId],
    references: [users.id], 
    relationName: "subscriptions_viewer_id_fkey"
  }),
  creator: one(users, {                                                                      // Cada suscripción tiene un creatorId que representa al usuario que está siendo seguido.
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "subscriptions_creator_id_fkey"
  })
}))

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},(t) => [uniqueIndex("name_idx").on(t.name)]);

export const videoVisibility = pgEnum("video_visibility", [
  "private",
  "public",
])

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  muxStatus: text("mux_status"),
  muxAssetId: text("mux_asset_id").unique(),
  muxUploadId: text("mux_upload_id").unique(),
  muxPlayBackId: text("mux_playback_id").unique(),
  muxTrackId: text("mux_track_id").unique(),
  muxTrackStatus: text("mux_track_status"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailKey: text("thumbnail_key"),
  previewUrl: text("preview_url"),
  previewKey: text("preview_key"),
  duration: integer("duration").default(0).notNull(),
  visibility: videoVisibility("visibility").default("private").notNull(),
  userId: uuid("user_id").references(() => users.id, {                                       // Referencia a la tabla `users` con el campo `id` ("user_id")
    onDelete: "cascade",
  }).notNull(), 
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoInsertSchema = createInsertSchema(videos);                                  // Genera un esquema de validación que se usa para insertar nuevos registros en la tabla videos.
export const videoUpdateSchema = createUpdateSchema(videos);                                  // Crea un esquema de validación para actualizar registros en la tabla videos.
export const videoSelectSchema = createSelectSchema(videos);                                  // Define un esquema de validación para seleccionar registros de la tabla videos.

export const videoRelations = relations(videos, ({ one, many }) => ({                         // Relaciones entre las tablas 
  user: one(users, {                                                                          // Cada video tiene un usuario 
    fields: [videos.userId],                                                                    
    references: [users.id],                                                                    
  }),                                                                                           
  category: one(categories, {                                                                 // Cada video tiene una categoría
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  views: many(videoViews),                                                                    // Cada video tiene muchas visualizaciones
  reactions: many(videoReactions),                                                            // Cada video tiene muchas reacciones
  comments: many(comments),                                                                   // Cada video tiene muchos comentarios
  playlistVideos: many(playlistVideos),                                                       // Cada video puede estar en muchas playlists
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  videos: many(videos)
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),                                                                // Referencia al id de otro comentario (para comentarios anidados o respuestas). parentId = NULL es un comentario principal.
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),      // Ref a la tabla users. Cada comentario pertenece a un usuario
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),   // Ref a la tabla videos. Cada comentario pertenece a un video
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},(t) => {
  return [
    foreignKey({
      columns: [t.parentId],              // Indica que la columna parentId hace referencia a otra columna de la misma tabla
      foreignColumns: [t.id],             // concretamente a la columna id de la tabla comments
      name: "comments_parent_id_fkey",
  })
  .onDelete("cascade")
  ]
})

// Comentario A(id = 1, parentId = NULL)
// ├─ Comentario B(id = 2, parentId = 1)
// │  ├─ Comentario C(id = 3, parentId = 2)
// └─ Comentario D(id = 4, parentId = 1)

export const commentRelations = relations(comments, ({ one, many }) => ({                       // Relaciones para la tabla comments
  user: one(users, {                                                                            // Cada comentario se corresponde con un usuario.
    fields: [comments.userId],
    references: [users.id],
  }),
  videos: one(videos, {                                                                         // Cada comentario se corresponde con un video.
    fields: [comments.videoId],
    references: [videos.id],
  }),
  parent: one(comments, {                                                                       // Cada comentario se corresponde con un parentId.
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey"
  }),
  reactions: many(commentReactions),                                                            // Cada comentario tiene muchas reacciones (likes, dislikes)
  replies: many(comments, {                                                                     // Cada comentario puede tener muchas respuestas (otros comments)    
    relationName: "comments_parent_id_fkey"
  })                                                                
}))

export const commentInsertSchema = createInsertSchema(comments);                                // Genera un esquema de validación que se usa para insertar nuevos registros en la tabla comments.
export const commentUpdateSchema = createUpdateSchema(comments);                                // Crea un esquema de validación para actualizar registros en la tabla comments.
export const commentSelectSchema = createSelectSchema(comments);  

export const commentReactions = pgTable("comment_reactions", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  type: reactionType("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({
    name: "comment_reactions_pk",
    columns: [t.userId, t.commentId]
  }),
]);

export const commentReactionRelations = relations(commentReactions, ({ one }) => ({             // Relaciones para la tabla comment_reactions
  user: one(users, {                                                                            // Cada reaction tiene un usuario
    fields: [commentReactions.userId],                                                          // Cada fila en comment_reactions tiene un userId que apunta a un id en la tabla users.
    references: [users.id],                                                                     // Cada userId de comment_reactions apunta a un id en la tabla users.
  }),
  comment: one(comments, {                                                                      // cada reaction se corresponde con un comentario
    fields: [commentReactions.commentId],                                                       // Cada fila en comment_reactions tiene un commentId que apunta a un id en la tabla comments.
    references: [comments.id],                                                                  // Cada commentId de comment_reactions apunta a un id en la tabla comments.
  }),
}));

export const videoViews = pgTable("video_views", {                                              // La tabla video_views no almacena un campo llamado video_views explícitamente.
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),        // Cada fila en la tabla representa una visualización única de un video por parte de un usuario.
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),     // La relación entre userId y videoId permite rastrear quién ha visto qué.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey ({
    name: "video_views_pk",
    columns: [t.userId, t.videoId]
  }),
])

export const videoViewRelations = relations(videoViews, ({ one }) => ({                          // Relaciones para la tabla video_views
  user: one(users, {                                                                             // Relación "muchos" a "uno" con la tabla users
    fields: [videoViews.userId],                                                                 // Cada fila en videoViews tiene un userId que apunta a un id en la tabla users.
    references: [users.id],                                                                      // Cada userId de videoViews apunta a un id en la tabla users.
  }),
  video: one(videos, {                                                                           // Relación "muchos" a "uno" con la tabla videos
    fields: [videoViews.videoId],                                                                // Cada fila en videoViews tiene un videoId que apunta a un id en la tabla videos.
    references: [videos.id],                                                                     // Cada videoId de videoViews apunta a un id en la tabla videos.
  }),
}));

export const videoViewSelectSchema = createSelectSchema(videoViews);                             // Esquema de validación para leer datos de la tabla videoViews.
export const videoViewInsertSchema = createInsertSchema(videoViews);                             // Esquema de validación para insertar datos en la tabla videoViews.
export const videoViewUpdateSchema = createUpdateSchema(videoViews);                             // Esquema de validación para actualizar datos en la tabla videoViews.




export const videoReactions = pgTable("video_reactions", {                                       // La tabla video_reactions no almacena un campo llamado video_reactions explícitamente.
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),         // Cada fila en la tabla representa una visualización única de un video por parte de un usuario.
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),      // La relación entre userId y videoId permite rastrear quién ha visto qué.
  type: reactionType("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({
    name: "video_reactions_pk",
    columns: [t.userId, t.videoId]
  }),
]);

export const videoReactionRelations = relations(videoReactions, ({ one }) => ({                  // Relaciones para la tabla video_reactions
  user: one(users, {                                                                             // Cada reaction tiene un usuario
    fields: [videoReactions.userId],                                                             // Cada fila en video_reactions tiene un userId que apunta a un id en la tabla users.
    references: [users.id],                                                                      // Cada userId de video_reactions apunta a un id en la tabla users.
  }),
  video: one(videos, {                                                                           // cada reaction se corresponde con un video
    fields: [videoReactions.videoId],                                                            // Cada fila en video_reactions tiene un videoId que apunta a un id en la tabla videos.
    references: [videos.id],                                                                     // Cada videoId de video_reactions apunta a un id en la tabla videos.
  }),
}));

export const videoReactionSelectSchema = createSelectSchema(videoReactions);                     // Esquema de validación para leer datos de la tabla video_reactions.
export const videoReactionInsertSchema = createInsertSchema(videoReactions);                     // Esquema de validación para insertar datos en la tabla video_reactions.
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions); 

export const playlistVideos = pgTable("playlist_videos", {                                       // Relaciona las listas de reproducción con los videos que contienen.
  playlistId: uuid("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},(t) => [
  primaryKey({                                                                                   // Esto significa que la combinación de playlistId y videoId debe ser única en la tabla, 
    name: "playlist_videos_pk",                                                                  // evitando que un mismo video aparezca más de una vez en la misma playlist.
    columns: [t.playlistId, t.videoId]
  })
]);

export const playlistVideoRelations = relations(playlistVideos, ({ one }) => ({                  // Define las relaciones explícitas entre la tabla playlistVideos y las tablas playlists y videos.
  playlist: one(playlists, {                                                                     // Indica que cada fila en playlistVideos está relacionada con una sola fila en playlists.
    fields: [playlistVideos.playlistId],                                                         // Cada playlistVideos tiene un nombre
    references: [playlists.id],
  }),
  video: one(videos, {                                                                           // Indica que cada fila en playlistVideos pertenece a un solo video en videos.
    fields: [playlistVideos.videoId],                                                            // Cada playlistVideos tiene un videoId
    references: [videos.id],
  }),
}))

export const playlists = pgTable("playlists", {                                                  // Contiene la información básica sobre cada lista de reproducción
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistRelations = relations(playlists, ({ one, many }) => ({                      // Define las relaciones explícitas entre la tabla playlist y las tablas users y videoPlaylists.
  user: one(users, {                                                                             // Indica que cada fila en playlistVideos está relacionada con una sola fila en users.
    fields: [playlists.userId],                                                                  // Cada playlistVideos es creada por un usuario.
    references: [users.id],
  }),
  playlistVideos: many(playlistVideos),                                                          // Una playlist puede contener muchos videos, que se almacenan en la tabla playlistVideos.
}))                                                                                              // Cada 