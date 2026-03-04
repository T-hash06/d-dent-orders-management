import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const completeOrderInput = z.object({
	orderId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const completeOrder = procedures.auth
	.input(completeOrderInput)
	.mutation(async ({ input, ctx }) => {
		return db.transaction(async (tx) => {
			const [order] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, input.orderId));

			if (!order) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: m.orderNotFound({}, { locale: getLocaleFromAsyncStorage() }),
					cause: new z.ZodError([
						{
							code: 'custom',
							message: m.orderNotFound(
								{},
								{ locale: getLocaleFromAsyncStorage() },
							),
							path: ['orderId'],
						},
					]),
				});
			}

			if (order.assignedToUserId !== ctx.user.id) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: m.orderNotOwnedByUser(
						{},
						{ locale: getLocaleFromAsyncStorage() },
					),
					cause: new z.ZodError([
						{
							code: 'custom',
							message: m.orderNotOwnedByUser(
								{},
								{ locale: getLocaleFromAsyncStorage() },
							),
							path: ['orderId'],
						},
					]),
				});
			}

			const [updatedOrder] = await tx
				.update(orders)
				.set({ status: 'completed' })
				.where(eq(orders.id, input.orderId))
				.returning();

			return updatedOrder;
		});
	});
