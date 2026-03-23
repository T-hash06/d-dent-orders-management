import { eq } from 'drizzle-orm';
import {
	assertCanAny,
	buildOrderActions,
} from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignedOrders = procedures.auth.query(async ({ ctx }) => {
	assertCanAny(ctx.ability, [
		{
			action: 'list-assigned',
			subjectType: 'Order',
			subjectValue: { assignedToUserId: ctx.user.id },
		},
	]);

	const userId = ctx.user.id;

	const assignedOrders = await db
		.select()
		.from(orders)
		.where(eq(orders.assignedToUserId, userId));

	return assignedOrders.map((order) => ({
		...order,
		actions: buildOrderActions({
			ability: ctx.ability,
			userId,
			assignedToUserId: order.assignedToUserId,
		}),
	}));
});
