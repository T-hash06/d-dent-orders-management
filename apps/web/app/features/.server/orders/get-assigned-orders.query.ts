import { eq } from 'drizzle-orm';
import {
	assertHasPermission,
	buildOrderActions,
} from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignedOrders = procedures.auth.query(async ({ ctx }) => {
	assertHasPermission(ctx.permissions, {
		orders: ['list-assigned'],
	});

	const userId = ctx.user.id;

	const assignedOrders = await db
		.select()
		.from(orders)
		.where(eq(orders.assignedToUserId, userId));

	return assignedOrders.map((order) => ({
		...order,
		actions: buildOrderActions({
			permissions: ctx.permissions,
			userId,
			assignedToUserId: order.assignedToUserId,
		}),
	}));
});
