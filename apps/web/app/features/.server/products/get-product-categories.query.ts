import { and, asc, count, eq, like, sql } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasAnyPermission,
	canReadAllProducts,
} from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import {
	productCategories,
	products,
} from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

const getProductCategoriesInput = z
	.object({
		search: z.string().trim().optional(),
	})
	.optional();

export const getProductCategories = procedures.auth
	.input(getProductCategoriesInput)
	.query(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ products: ['list-all'] },
			{ products: ['list-assigned'] },
		]);
		const search = input?.search;

		const categories = canReadAllProducts(ctx.permissions)
			? await db
					.select({
						id: productCategories.id,
						name: productCategories.name,
						productsCount: count(products.id),
					})
					.from(productCategories)
					.leftJoin(products, eq(products.categoryId, productCategories.id))
					.where(
						search ? like(productCategories.name, `%${search}%`) : undefined,
					)
					.groupBy(productCategories.id)
					.orderBy(asc(productCategories.name))
			: await db
					.select({
						id: productCategories.id,
						name: productCategories.name,
						productsCount: sql<number>`count(distinct ${products.id})`,
					})
					.from(productCategories)
					.innerJoin(products, eq(products.categoryId, productCategories.id))
					.innerJoin(orderItems, eq(orderItems.productId, products.id))
					.innerJoin(orders, eq(orders.id, orderItems.orderId))
					.where(
						and(
							eq(orders.assignedToUserId, ctx.user.id),
							search ? like(productCategories.name, `%${search}%`) : undefined,
						),
					)
					.groupBy(productCategories.id)
					.orderBy(asc(productCategories.name));

		return categories;
	});
