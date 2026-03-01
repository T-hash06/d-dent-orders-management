import { randomUUID } from 'node:crypto';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '@/features/.server/auth/auth.schema';

export const todos = sqliteTable('todo', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
});

export type Todo = typeof todos.$inferSelect;
