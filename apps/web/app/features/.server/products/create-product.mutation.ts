import { eq, getTableColumns } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import {
	productCategories,
	products,
} from '@/features/.server/products/product.schema';
import { resolveProductCategoryId } from '@/features/.server/products/resolve-product-category-id';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const categoryIdInput = z
	.string({
		error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
	})
	.min(1, {
		error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
	});

const createProductInput = z.object({
	name: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	categoryId: categoryIdInput,
	variant: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	price: z
		.number({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.nonnegative({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const createProduct = procedures.auth
	.input(createProductInput)
	.mutation(async ({ input, ctx }) => {
		const categoryId = await resolveProductCategoryId({
			categoryId: input.categoryId,
			userId: ctx.user.id,
		});

		const [createdProduct] = await db
			.insert(products)
			.values({
				name: input.name,
				categoryId,
				variant: input.variant,
				price: input.price,
				createdById: ctx.user.id,
				updatedById: ctx.user.id,
			})
			.returning({
				id: products.id,
			});

		if (!createdProduct) {
			return null;
		}

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
			.where(eq(products.id, createdProduct.id));

		return product ?? null;
	});
