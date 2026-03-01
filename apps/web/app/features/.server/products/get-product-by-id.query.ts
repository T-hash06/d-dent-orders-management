import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { products } from '@/features/.server/products/product.schema';
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
	.query(async ({ input }) => {
		const [product] = await db
			.select()
			.from(products)
			.where(eq(products.id, input.id));

		return product ?? null;
	});
