import { pgTable, text, timestamp, uuid, integer, decimal, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: uniqueIndex('user_email_idx').on(table.email)
}));

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  providerIdAccountIdIdx: uniqueIndex('account_provider_id_account_id_idx').on(table.providerId, table.accountId)
}));

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent')
}, (table) => ({
  tokenIdx: uniqueIndex('session_token_idx').on(table.token),
  userIdIdx: index('session_user_id_idx').on(table.userId)
}));

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  identifierIdx: index('verification_identifier_idx').on(table.identifier)
}));

export const gymSession = pgTable('gym_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('gym_session_user_id_idx').on(table.userId),
  dateIdx: index('gym_session_date_idx').on(table.date)
}));

export const exerciseLog = pgTable('exercise_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymSessionId: uuid('gym_session_id').notNull().references(() => gymSession.id, { onDelete: 'cascade' }),
  exerciseName: text('exercise_name').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  unit: text('unit').default('kg'),
  notes: text('notes'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  gymSessionIdIdx: index('exercise_log_gym_session_id_idx').on(table.gymSessionId),
  exerciseNameIdx: index('exercise_log_exercise_name_idx').on(table.exerciseName)
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  gymSessions: many(gymSession)
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const gymSessionRelations = relations(gymSession, ({ one, many }) => ({
  user: one(user, {
    fields: [gymSession.userId],
    references: [user.id]
  }),
  exerciseLogs: many(exerciseLog)
}));

export const exerciseLogRelations = relations(exerciseLog, ({ one }) => ({
  gymSession: one(gymSession, {
    fields: [exerciseLog.gymSessionId],
    references: [gymSession.id]
  })
}));