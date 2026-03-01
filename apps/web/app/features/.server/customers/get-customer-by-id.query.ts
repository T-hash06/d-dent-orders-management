import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const getCustomerByIdInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const getCustomerById = procedures.auth
	.input(getCustomerByIdInput)
	.query(async ({ input }) => {
		const [customer] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, input.id));

		return customer ?? null;
	});
