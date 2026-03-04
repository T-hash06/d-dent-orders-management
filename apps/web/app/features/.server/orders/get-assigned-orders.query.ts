import { eq } from 'drizzle-orm';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignedOrders = procedures.auth.query(async ({ ctx }) => {
	const userId = ctx.user.id;

	const assignedOrders = await db
		.select()
		.from(orders)
		.where(eq(orders.assignedToUserId, userId));

	return assignedOrders;
});
