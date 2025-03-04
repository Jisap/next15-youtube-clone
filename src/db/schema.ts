

import { relations } from "drizzle-orm";

import { pgTable, uuid, text, timestamp, uniqueIndex, integer, pgEnum, primaryKey } from "drizzle-orm/pg-core";
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
  comments: many(comments)                                         // Un usuario puede tener muchos comentarios
}));

export const subscriptions = pgTable("subscriptions", {
  viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),   // Representa al usuario que sigue o se suscribe a otro usuario.
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Representa al usuario que es seguido o suscrito por otros.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  primaryKey({
    name: "subscriptions_pk",
    columns: [t.viewerId, t.creatorId]
  }),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({         // Se agregan relaciones a la tabla subscriptions
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
  comments: many(comments)                                                                    // Cada video tiene muchos comentarios
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  videos: many(videos)
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentRelations = relations(comments, ({ one, many }) => ({                       // Relaciones para la tabla comments
  user: one(users, {                                                                            // Cada comentario se corresponde con un usuario.
    fields: [comments.userId],
    references: [users.id],
  }),
  videos: one(videos, {                                                                         // Cada comentario se corresponde con un video.
    fields: [comments.videoId],
    references: [videos.id],
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
])                                   

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

export const videoViewRelations = relations(videoViews, ({ one, many }) => ({                    // Relaciones para la tabla video_views
  users: one(users, {                                                                            // Relación "muchos" a "uno" con la tabla users
    fields: [videoViews.userId],                                                                 // Cada fila en videoViews tiene un userId que apunta a un id en la tabla users.
    references: [users.id],                                                                      // Cada userId de videoViews apunta a un id en la tabla users.
  }),
  videos: one(videos, {                                                                          // Relación "muchos" a "uno" con la tabla videos
    fields: [videoViews.videoId],                                                                // Cada fila en videoViews tiene un videoId que apunta a un id en la tabla videos.
    references: [videos.id],                                                                     // Cada videoId de videoViews apunta a un id en la tabla videos.
  }),
  //views: many(videoViews) 
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

export const videoReactionRelations = relations(videoReactions, ({ one, many }) => ({            // Relaciones para la tabla video_reactions
  users: one(users, {                                                                            // Cada reaction tiene un usuario
    fields: [videoReactions.userId],                                                             // Cada fila en video_reactions tiene un userId que apunta a un id en la tabla users.
    references: [users.id],                                                                      // Cada userId de video_reactions apunta a un id en la tabla users.
  }),
  videos: one(videos, {                                                                          // cada reaction se corresponde con un video
    fields: [videoReactions.videoId],                                                            // Cada fila en video_reactions tiene un videoId que apunta a un id en la tabla videos.
    references: [videos.id],                                                                     // Cada videoId de video_reactions apunta a un id en la tabla videos.
  }),
}));

export const videoReactionSelectSchema = createSelectSchema(videoReactions);                     // Esquema de validación para leer datos de la tabla video_reactions.
export const videoReactionInsertSchema = createInsertSchema(videoReactions);                     // Esquema de validación para insertar datos en la tabla video_reactions.
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions); 
