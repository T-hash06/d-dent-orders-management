import { and, eq, like, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasAnyPermission,
	buildEntityActions,
	canReadAllProducts,
	canReadAssignedProducts,
	hasPermission,
} from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import {
	productCategories,
	products,
} from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

const getProductsInput = z
	.object({
		categoryId: z.string().trim().optional(),
		search: z.string().trim().optional(),
	})
	.optional();

export const getProducts = procedures.auth
	.input(getProductsInput)
	.query(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ products: ['list-all'] },
			{ products: ['list-assigned'] },
		]);
		const canUpdateProducts = hasPermission(ctx.permissions, { products: ['update'] });
		const canDeleteProducts = hasPermission(ctx.permissions, { products: ['delete'] });

		const categoryId = input?.categoryId;
		const search = input?.search;
		const inAssignedOrderScope =
			!canReadAllProducts(ctx.permissions) && canReadAssignedProducts(ctx.permissions)
				? sql`EXISTS (
				SELECT 1
				FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE oi.product_id = ${products.id}
				  AND o.assigned_to_user_id = ${ctx.user.id}
			)`
				: undefined;

		const result = await db
			.select({
				id: products.id,
				categoryId: products.categoryId,
				name: products.name,
				variant: products.variant,
				price: products.price,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt,
				createdById: products.createdById,
				updatedById: products.updatedById,
				category: {
					id: productCategories.id,
					name: productCategories.name,
				},
				hasPendingOrders: sql<boolean>`NOT EXISTS (
					SELECT 1 FROM order_items oi
					JOIN orders o ON oi.order_id = o.id
					WHERE oi.product_id = products.id AND o.status != 'completed'
				)`,
			})
			.from(products)
			.innerJoin(
				productCategories,
				eq(products.categoryId, productCategories.id),
			)
			.where(
				and(
					inAssignedOrderScope,
					categoryId ? eq(products.categoryId, categoryId) : undefined,
					search
						? or(
								like(products.name, `%${search}%`),
								like(products.variant, `%${search}%`),
								like(productCategories.name, `%${search}%`),
							)
						: undefined,
				),
			);

		return result.map((product) => ({
			...product,
			actions: buildEntityActions({
				canUpdate: canUpdateProducts,
				canDelete: canDeleteProducts,
			}),
		}));
	});
