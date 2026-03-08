import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { assertHasPermission } from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const deleteOrderInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const deleteOrder = procedures.auth
	.input(deleteOrderInput)
	.mutation(async ({ input, ctx }) => {
		assertHasPermission(ctx.permissions, {
			orders: ['delete'],
		});

		const [deletedOrder] = await db
			.delete(orders)
			.where(eq(orders.id, input.id))
			.returning();

		return deletedOrder ?? null;
	});
