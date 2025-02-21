

import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, uniqueIndex, integer, pgEnum } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

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
  video: many(videos)
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
  userId: uuid("user_id").references(() => users.id, {              // Referencia a la tabla `users` con el campo `id` ("user_id")
    onDelete: "cascade",
  }).notNull(), 
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoInsertSchema = createInsertSchema(videos);        // Genera un esquema de validación que se usa para insertar nuevos registros en la tabla videos.
export const videoUpdateSchema = createUpdateSchema(videos);        // Crea un esquema de validación para actualizar registros en la tabla videos.
export const videoSelectSchema = createSelectSchema(videos);        // Define un esquema de validación para seleccionar registros de la tabla videos.

export const videoRelations = relations(videos, ({ one }) => ({     // Relaciones entre las tablas (Cada video tiene un usuario)
  user: one(users, {                                                // Relación 1-1 con la tabla `users`
    fields: [videos.userId],                                        // Drizzle ORM necesita relations() para entender cómo conectar los datos a nivel de consultas. 
    references: [users.id],                                         // De esta manera se define que, al hacer una consulta de videos,   
  }),                                                               // Drizzle ORM podrá incluir automáticamente los datos del usuario al que pertenece ese video.
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  })
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  videos: many(videos)
}));