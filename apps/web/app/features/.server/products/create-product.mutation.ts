import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { products } from '@/features/.server/products/product.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const createProductInput = z.object({
	name: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	type: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
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
		const [createdProduct] = await db
			.insert(products)
			.values({
				name: input.name,
				type: input.type,
				variant: input.variant,
				price: input.price,
				createdById: ctx.user.id,
				updatedById: ctx.user.id,
			})
			.returning();

		return createdProduct;
	});
