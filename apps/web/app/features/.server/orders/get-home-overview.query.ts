import { and, eq } from 'drizzle-orm';
import {
	assertHasAnyPermission,
	assertHasPermission,
	canAccessAnalyticsGroup,
	canBeAssignedOrder,
	canReadAllOrders,
	canReadAssignedOrders,
} from '@/features/.server/auth/authorization.lib';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { isOrderLate } from '@/features/orders/domain/order-status';

export const getHomeOverview = procedures.auth.query(async ({ ctx }) => {
	assertHasPermission(ctx.permissions, { analytics: ['list'] });
	assertHasAnyPermission(ctx.permissions, [
		{ analytics: ['overview-all'] },
		{ analytics: ['overview-assigned'] },
	]);
	assertHasAnyPermission(ctx.permissions, [
		{ orders: ['list-all'] },
		{ orders: ['list-assigned'] },
	]);
	const canReadOverviewAll = canAccessAnalyticsGroup(
		ctx.permissions,
		'overview',
		'all',
	);
	const canReadOverviewAssigned = canAccessAnalyticsGroup(
		ctx.permissions,
		'overview',
		'assigned',
	);
	const shouldScopeToAssigned =
		!canReadOverviewAll &&
		canReadOverviewAssigned &&
		!canReadAllOrders(ctx.permissions) &&
		canReadAssignedOrders(ctx.permissions);

	const allOrders = await db
		.select()
		.from(orders)
		.where(
			shouldScopeToAssigned
				? eq(orders.assignedToUserId, ctx.user.id)
				: undefined,
		);

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

	const assignedPendingOrders = canBeAssignedOrder(ctx.permissions)
		? await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.assignedToUserId, ctx.user.id),
						eq(orders.status, 'pending'),
					),
				)
		: [];

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
