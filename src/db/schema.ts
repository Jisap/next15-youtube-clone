

import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";


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

export const userRelations = relations(users, ({many}) => ({  // Cada user tiene muchos videos
  video: many(videos)
}))

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},(t) => [uniqueIndex("name_idx").on(t.name)]);

export const categoryRelations = relations(categories, ({ many }) => ({  // Cada category tiene muchos videos
  video: many(videos)
}))

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  userId: uuid("user_id").references(() => users.id, {                   // Referencia a la tabla `users` con el campo `id` ("user_id")
    onDelete: "cascade",
  }).notNull(), 
  categoryId: uuid("category_id").references(() => categories.id, {      // Referencia a la tabla `categories` con el campo `id` ("category_id")
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoRelations = relations(videos, ({ one }) => ({          // Relaciones entre las tablas (Cada video tiene un usuario)
  user: one(users, {                                                     // Relación 1-1 con la tabla `users`
    fields: [videos.userId],                                             // Drizzle ORM necesita relations() para entender cómo conectar los datos a nivel de consultas. 
    references: [users.id],                                              // De esta manera se define que, al hacer una consulta de videos,   
  }),                                                                    // Drizzle ORM podrá incluir automáticamente los datos del usuario al que pertenece ese video. 
  category: one(categories, {
    fields: [videos.categoryId],                                         // Relación 1-1 con la tabla `categories`
    references: [categories.id],                                         // De esta manera se define que, al hacer una consulta de videos,
  })                                                                     // Drizzle ORM podrá incluir automáticamente los datos de la categoría a la que pertenece ese video.
}))