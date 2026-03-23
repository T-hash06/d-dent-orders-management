import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const deleteCustomerInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const deleteCustomer = procedures.auth
	.input(deleteCustomerInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'delete', 'Customer');

		const [deletedCustomer] = await db
			.delete(customers)
			.where(eq(customers.id, input.id))
			.returning();

		return deletedCustomer ?? null;
	});
