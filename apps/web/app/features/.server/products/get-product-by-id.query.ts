import { and, eq, getTableColumns } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertCanAny,
	buildEntityActions,
	buildProductAssignedWhere,
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
		assertCanAny(ctx.ability, [
			{
				action: 'list-all',
				subjectType: 'Product',
			},
			{
				action: 'list-assigned',
				subjectType: 'Product',
				subjectValue: { assignedToUserId: ctx.user.id },
			},
		]);
		const canUpdateProducts = ctx.ability.can('update', 'Product');
		const canDeleteProducts = ctx.ability.can('delete', 'Product');

		const inAssignedOrderScope = buildProductAssignedWhere({
			ability: ctx.ability,
			userId: ctx.user.id,
		});

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
