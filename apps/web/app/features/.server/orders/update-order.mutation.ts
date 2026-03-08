import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_STATUS_VALUES } from '@/features/orders/domain/order-status';

const updateOrderItemInput = z.object({
	productId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	quantity: z
		.number({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.int({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.positive({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
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

const updateOrderInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	customerId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	assignedToUserId: z
		.string({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.nullable()
		.optional(),
	expectedDeliveryAt: z.coerce.date<string>({
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	status: z.enum(ORDER_STATUS_VALUES, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	deliveryAddress: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	items: z.array(updateOrderItemInput).min(1, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const updateOrder = procedures.auth
	.input(updateOrderInput)
	.mutation(async ({ input, ctx }) => {
		return db.transaction(async (tx) => {
			const [updatedOrder] = await tx
				.update(orders)
				.set({
					customerId: input.customerId,
					assignedToUserId: input.assignedToUserId ?? null,
					expectedDeliveryAt: input.expectedDeliveryAt,
					status: input.status,
					deliveryAddress: input.deliveryAddress,
					updatedById: ctx.user.id,
				})
				.where(eq(orders.id, input.id))
				.returning();

			await tx.delete(orderItems).where(eq(orderItems.orderId, input.id));

			await tx.insert(orderItems).values(
				input.items.map((item) => ({
					orderId: input.id,
					productId: item.productId,
					quantity: item.quantity,
					price: item.price,
					createdById: ctx.user.id,
					updatedById: ctx.user.id,
				})),
			);

			return updatedOrder;
		});
	});
