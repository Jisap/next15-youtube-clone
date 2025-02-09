
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