import { and, eq, gte, lt, lte, ne } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasAnyPermission,
	buildOrderActions,
	canReadAllOrders,
	canReadAssignedOrders,
} from '@/features/.server/auth/authorization.lib';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';
import {
	isOrderLate,
	ORDER_STATUS_VALUES,
} from '@/features/orders/domain/order-status';

const getOrdersInput = z
	.object({
		lateOnly: z.boolean().optional(),
		status: z.enum(ORDER_STATUS_VALUES).optional(),
		expectedDeliveryFrom: z.coerce.date<string>().optional(),
		expectedDeliveryTo: z.coerce.date<string>().optional(),
	})
	.optional();

export const getOrders = procedures.auth
	.input(getOrdersInput)
	.query(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ orders: ['list-all'] },
			{ orders: ['list-assigned'] },
		]);
		const shouldScopeToAssigned =
			!canReadAllOrders(ctx.permissions) &&
			canReadAssignedOrders(ctx.permissions);

		const ordersRows = await db
			.select()
			.from(orders)
			.where(
				and(
					shouldScopeToAssigned
						? eq(orders.assignedToUserId, ctx.user.id)
						: undefined,
					input?.lateOnly ? ne(orders.status, 'completed') : undefined,
					input?.lateOnly ? ne(orders.status, 'cancelled') : undefined,
					input?.lateOnly
						? lt(orders.expectedDeliveryAt, new Date())
						: undefined,
					input?.status ? eq(orders.status, input.status) : undefined,
					input?.expectedDeliveryFrom
						? gte(orders.expectedDeliveryAt, input.expectedDeliveryFrom)
						: undefined,
					input?.expectedDeliveryTo
						? lte(orders.expectedDeliveryAt, input.expectedDeliveryTo)
						: undefined,
				),
			);

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
						details: orderItems.details,
					})
					.from(orderItems)
					.where(eq(orderItems.orderId, order.id));

				return {
					...order,
					isLate: isOrderLate(order.status, order.expectedDeliveryAt),
					customer,
					items,
					actions: buildOrderActions({
						permissions: ctx.permissions,
						userId: ctx.user.id,
						assignedToUserId: order.assignedToUserId,
					}),
				};
			}),
		);

		return enrichedOrders;
	});
