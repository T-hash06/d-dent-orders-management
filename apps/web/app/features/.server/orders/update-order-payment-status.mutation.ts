import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_PAYMENT_STATUS_VALUES } from '@/features/orders/domain/order-payment-status';

const updateOrderPaymentStatusInput = z.object({
	orderId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	paymentStatus: z.enum(ORDER_PAYMENT_STATUS_VALUES, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const updateOrderPaymentStatus = procedures.auth
	.input(updateOrderPaymentStatusInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'update-payment-status', 'Order');

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
			const [updatedOrder] = await tx
				.update(orders)
				.set({ paymentStatus: input.paymentStatus, updatedById: ctx.user.id })
				.where(eq(orders.id, input.orderId))
				.returning();

			return updatedOrder;
		});
	});
