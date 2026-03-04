import { and, eq } from 'drizzle-orm';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { isOrderLate } from '@/features/orders/order-status';

export const getHomeOverview = procedures.auth.query(async ({ ctx }) => {
	const allOrders = await db.select().from(orders);

	const stats = {
		totalOrders: allOrders.length,
		pendingOrders: allOrders.filter((order) => order.status === 'pending')
			.length,
		inProgressOrders: allOrders.filter(
			(order) => order.status === 'in_progress',
		).length,
		completedOrders: allOrders.filter((order) => order.status === 'completed')
			.length,
	};

	const assignedPendingOrders = await db
		.select()
		.from(orders)
		.where(
			and(
				eq(orders.assignedToUserId, ctx.user.id),
				eq(orders.status, 'pending'),
			),
		);

	const assignedPending = await Promise.all(
		assignedPendingOrders.map(async (order) => {
			const [customer] = await db
				.select({ name: customers.name })
				.from(customers)
				.where(eq(customers.id, order.customerId));

			const items = await db
				.select({ quantity: orderItems.quantity, price: orderItems.price })
				.from(orderItems)
				.where(eq(orderItems.orderId, order.id));

			const total = items.reduce(
				(sum, item) => sum + item.quantity * item.price,
				0,
			);

			return {
				id: order.id,
				status: order.status,
				expectedDeliveryAt: order.expectedDeliveryAt,
				deliveryAddress: order.deliveryAddress,
				customerName: customer?.name ?? '-',
				itemCount: items.length,
				total,
				isLate: isOrderLate(order.status, order.expectedDeliveryAt),
			};
		}),
	);

	const sortedAssignedPending = assignedPending
		.sort(
			(a, b) => a.expectedDeliveryAt.getTime() - b.expectedDeliveryAt.getTime(),
		)
		.slice(0, 5);

	return {
		stats: {
			...stats,
			myPendingOrders: assignedPendingOrders.length,
		},
		assignedPending: sortedAssignedPending,
	};
});
