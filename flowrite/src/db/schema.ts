import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  primaryKey,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// ── Auth.js / NextAuth Tables ──────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const authSessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ── Flowrite Essays Table ──────────────────────────────────────────────────────

export const essays = pgTable(
  "essays",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    threadId: varchar("thread_id", { length: 12 }).notNull(),
    parentId: varchar("parent_id", { length: 12 }),
    part: integer("part").default(1).notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    goalType: varchar("goal_type", { length: 16 }).notNull().default("time"),
    goalValue: integer("goal_value").notNull().default(300),
    wordCount: integer("word_count").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    hardcoreMode: boolean("hardcore_mode").notNull().default(false),
    prompt: text("prompt"),
    summaryText: text("summary_text"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    threadIdx: index("idx_essays_thread").on(table.threadId),
    userIdx: index("idx_essays_user").on(table.userId),
    createdIdx: index("idx_essays_created").on(table.createdAt),
  })
);

export type EssaySelect = typeof essays.$inferSelect;
export type EssayInsert = typeof essays.$inferInsert;
