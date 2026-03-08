import { and, eq, getTableColumns, sql } from 'drizzle-orm';
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
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const getProductByIdInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const getProductById = procedures.auth
	.input(getProductByIdInput)
	.query(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ products: ['list-all'] },
			{ products: ['list-assigned'] },
		]);
		const canUpdateProducts = hasPermission(ctx.permissions, {
			products: ['update'],
		});
		const canDeleteProducts = hasPermission(ctx.permissions, {
			products: ['delete'],
		});

		const inAssignedOrderScope =
			!canReadAllProducts(ctx.permissions) &&
			canReadAssignedProducts(ctx.permissions)
				? sql`EXISTS (
				SELECT 1
				FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE oi.product_id = ${products.id}
				  AND o.assigned_to_user_id = ${ctx.user.id}
			)`
				: undefined;

		const [product] = await db
			.select({
				...getTableColumns(products),
				category: {
					id: productCategories.id,
					name: productCategories.name,
				},
			})
			.from(products)
			.innerJoin(
				productCategories,
				eq(products.categoryId, productCategories.id),
			)
			.where(and(eq(products.id, input.id), inAssignedOrderScope));

		if (!product) {
			return null;
		}

		return {
			...product,
			actions: buildEntityActions({
				canUpdate: canUpdateProducts,
				canDelete: canDeleteProducts,
			}),
		};
	});
