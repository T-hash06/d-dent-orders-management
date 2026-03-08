import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_STATUS_VALUES } from '@/features/orders/domain/order-status';

const createOrderItemInput = z.object({
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

const createOrderInput = z.object({
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
	items: z.array(createOrderItemInput).min(1, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const createOrder = procedures.auth
	.input(createOrderInput)
	.mutation(async ({ input, ctx }) => {
		return db.transaction(async (tx) => {
			const [createdOrder] = await tx
				.insert(orders)
				.values({
					customerId: input.customerId,
					assignedToUserId: input.assignedToUserId ?? null,
					expectedDeliveryAt: input.expectedDeliveryAt,
					status: input.status,
					deliveryAddress: input.deliveryAddress,
					createdById: ctx.user.id,
					updatedById: ctx.user.id,
				})
				.returning();

			await tx.insert(orderItems).values(
				input.items.map((item) => ({
					orderId: createdOrder.id,
					productId: item.productId,
					quantity: item.quantity,
					price: item.price,
					createdById: ctx.user.id,
					updatedById: ctx.user.id,
				})),
			);

			return createdOrder;
		});
	});
