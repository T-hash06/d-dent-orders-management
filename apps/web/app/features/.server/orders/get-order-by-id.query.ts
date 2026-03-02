import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';
import { isOrderLate } from '@/features/orders/order-status';

const getOrderByIdInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const getOrderById = procedures.auth
	.input(getOrderByIdInput)
	.query(async ({ input }) => {
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, input.id));

		if (!order) {
			return null;
		}

		const [customer] = await db
			.select({
				id: customers.id,
				name: customers.name,
				identifier: customers.identifier,
				phone: customers.phone,
				address: customers.address,
			})
			.from(customers)
			.where(eq(customers.id, order.customerId));

		const items = await db
			.select({
				id: orderItems.id,
				orderId: orderItems.orderId,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				price: orderItems.price,
			})
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id));

		return {
			...order,
			isLate: isOrderLate(order.status, order.expectedDeliveryAt),
			customer,
			items,
		};
	});
