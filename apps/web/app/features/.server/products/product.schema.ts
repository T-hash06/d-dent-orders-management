import { randomUUID } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '@/features/.server/auth/auth.schema';

export const productCategories = sqliteTable('product_categories', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	name: text('name').notNull(),
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

export const products = sqliteTable('products', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	categoryId: text('category_id')
		.notNull()
		.references(() => productCategories.id),
	name: text('name').notNull(),
	variant: text('variant').notNull(),
	price: real('price').notNull(),
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

export const productsRelations = relations(products, ({ one }) => ({
	category: one(productCategories, {
		fields: [products.categoryId],
		references: [productCategories.id],
	}),
	createdBy: one(users, {
		fields: [products.createdById],
		references: [users.id],
	}),
	updatedBy: one(users, {
		fields: [products.updatedById],
		references: [users.id],
	}),
}));
