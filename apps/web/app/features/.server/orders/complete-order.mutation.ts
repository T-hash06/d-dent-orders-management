import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasAnyPermission,
	forbiddenError,
	hasPermission,
} from '@/features/.server/auth/authorization.lib';
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
		assertHasAnyPermission(ctx.permissions, [
			{ orders: ['update-status-all'] },
			{ orders: ['update-status-assigned'] },
		]);
		const canUpdateAnyOrderStatus = hasPermission(ctx.permissions, {
			orders: ['update-status-all'],
		});

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

			if (!canUpdateAnyOrderStatus && order.assignedToUserId !== ctx.user.id) {
				throw forbiddenError();
			}

			const [updatedOrder] = await tx
				.update(orders)
				.set({ status: 'completed', updatedById: ctx.user.id })
				.where(eq(orders.id, input.orderId))
				.returning();

			return updatedOrder;
		});
	});
