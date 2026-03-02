import { eq } from 'drizzle-orm';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { isOrderLate } from '@/features/orders/order-status';

export const getOrders = procedures.auth.query(async () => {
	const ordersRows = await db.select().from(orders);

	const enrichedOrders = await Promise.all(
		ordersRows.map(async (order) => {
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
		}),
	);

	return enrichedOrders;
});
