import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "non_binary", "other"]);
export const lookingForEnum = pgEnum("looking_for", ["relationship", "friendship", "casual", "marriage"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  birthDate: varchar("birth_date", { length: 10 }).notNull(),
  gender: genderEnum("gender").notNull(),
  lookingFor: lookingForEnum("looking_for").default("relationship"),
  bio: text("bio").default(""),
  city: varchar("city", { length: 100 }).default(""),
  country: varchar("country", { length: 100 }).default(""),
  photoUrl: text("photo_url").default(""),
  coverPhotoUrl: text("cover_photo_url").default(""),
  photo1Url: text("photo_1_url").default(""),
  photo2Url: text("photo_2_url").default(""),
  photo3Url: text("photo_3_url").default(""),
  photo4Url: text("photo_4_url").default(""),
  interests: text("interests").default(""),
  occupation: varchar("occupation", { length: 150 }).default(""),
  isOnline: boolean("is_online").default(false),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  isPremium: boolean("is_premium").default(false),
  prefGender: varchar("pref_gender", { length: 20 }).default("all"),
  prefAgeMin: integer("pref_age_min").default(18),
  prefAgeMax: integer("pref_age_max").default(99),
  prefLookingFor: varchar("pref_looking_for", { length: 20 }).default("all"),
  prefMaxDistance: integer("pref_max_distance").default(999999),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  prompt1Question: varchar("prompt_1_question", { length: 200 }).default(""),
  prompt1Answer: text("prompt_1_answer").default(""),
  prompt2Question: varchar("prompt_2_question", { length: 200 }).default(""),
  prompt2Answer: text("prompt_2_answer").default(""),
  prompt3Question: varchar("prompt_3_question", { length: 200 }).default(""),
  prompt3Answer: text("prompt_3_answer").default(""),
  boostEndAt: timestamp("boost_end_at"),
  lastBoostAt: timestamp("last_boost_at"),
  boostViews: integer("boost_views").default(0),
  boostLikes: integer("boost_likes").default(0),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull().default(true),
  isSuperLike: boolean("is_super_like").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterUserId: integer("reporter_user_id").notNull().references(() => users.id),
  reportedUserId: integer("reported_user_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details").default(""),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerUserId: integer("blocker_user_id").notNull().references(() => users.id),
  blockedUserId: integer("blocked_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  fromUserId: integer("from_user_id").references(() => users.id),
  content: text("content").default(""),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
