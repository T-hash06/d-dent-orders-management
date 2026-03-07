import { randomUUID } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '@/features/.server/auth/better-auth.schema';

export const customers = sqliteTable('customers', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	name: text('name').notNull(),
	identifier: text('identifier').notNull(),
	phone: text('phone').notNull(),
	address: text('address').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	createdById: text('created_by_id')
		.notNull()
		.references(() => users.id),
	updatedById: text('updated_by_id')
		.notNull()
		.references(() => users.id),
});

export const customersRelations = relations(customers, ({ one }) => ({
	createdBy: one(users, {
		fields: [customers.createdById],
		references: [users.id],
	}),
	updatedBy: one(users, {
		fields: [customers.updatedById],
		references: [users.id],
	}),
}));
