import { randomUUID } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '@/features/.server/auth/better-auth.schema';
import { customers } from '@/features/.server/customers/customer.schema';
import { products } from '@/features/.server/products/product.schema';
import { ORDER_STATUS_VALUES } from '@/features/orders/domain/order-status';

export const orders = sqliteTable('orders', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	customerId: text('customer_id')
		.notNull()
		.references(() => customers.id),
	assignedToUserId: text('assigned_to_user_id').references(() => users.id),
	expectedDeliveryAt: integer('expected_delivery_at', {
		mode: 'timestamp_ms',
	}).notNull(),
	status: text('status', {
		enum: ORDER_STATUS_VALUES,
	})
		.notNull()
		.default('pending'),
	deliveryAddress: text('delivery_address').notNull(),
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

export const orderItems = sqliteTable('order_items', {
	id: text('id')
		.primaryKey()
		.$default(() => randomUUID()),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id, {
			onDelete: 'cascade',
		}),
	productId: text('product_id')
		.notNull()
		.references(() => products.id),
	quantity: integer('quantity').notNull(),
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

export const ordersRelations = relations(orders, ({ many, one }) => ({
	items: many(orderItems),
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id],
	}),
	assignedToUser: one(users, {
		fields: [orders.assignedToUserId],
		references: [users.id],
	}),
	createdBy: one(users, {
		fields: [orders.createdById],
		references: [users.id],
	}),
	updatedBy: one(users, {
		fields: [orders.updatedById],
		references: [users.id],
	}),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
	createdBy: one(users, {
		fields: [orderItems.createdById],
		references: [users.id],
	}),
	updatedBy: one(users, {
		fields: [orderItems.updatedById],
		references: [users.id],
	}),
}));
