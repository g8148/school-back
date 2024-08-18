import { relations } from "drizzle-orm";
import { date, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventName: varchar("event_name", { length: 200 }).notNull(),
  createAt: date("create_at").defaultNow(),
});

export const eventRelations = relations(events, ({ many }) => ({
  eventClasses: many(eventClass),
}));

export const eventClass = pgTable("event_class", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  className: varchar("class_name", { length: 4 }).notNull(),
  totalEntries: integer("total_entries").notNull().default(0),
  soldEntries: integer("sold_entries").notNull().default(0),
  createAt: date("create_at").defaultNow(),
});

export const eventClassRelations = relations(eventClass, ({ one }) => ({
  event: one(events, {
    fields: [eventClass.eventId],
    references: [events.id],
  }),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
});
