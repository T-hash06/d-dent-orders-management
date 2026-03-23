import { eq, sql } from 'drizzle-orm';
import {
	assertCanAny,
	buildEntityActions,
	canReadAllCustomers,
	canReadAssignedCustomers,
} from '@/features/.server/auth/authorization.lib';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getCustomers = procedures.auth.query(async ({ ctx }) => {
	assertCanAny(ctx.ability, [
		{
			action: 'list-all',
			subjectType: 'Customer',
		},
		{
			action: 'list-assigned',
			subjectType: 'Customer',
			subjectValue: { assignedToUserId: ctx.user.id },
		},
	]);

	const canUpdateCustomers = ctx.ability.can('update', 'Customer');
	const canDeleteCustomers = ctx.ability.can('delete', 'Customer');
	const canReadAll = canReadAllCustomers(ctx.ability);
	const canReadAssigned = canReadAssignedCustomers(ctx.ability, ctx.user.id);

	const rows = canReadAll
		? await db.select().from(customers)
		: await db
				.selectDistinct({
					id: customers.id,
					name: customers.name,
					identifier: customers.identifier,
					phone: customers.phone,
					address: customers.address,
					createdAt: customers.createdAt,
					updatedAt: customers.updatedAt,
					createdById: customers.createdById,
					updatedById: customers.updatedById,
				})
				.from(customers)
				.innerJoin(orders, eq(orders.customerId, customers.id))
				.where(
					canReadAssigned
						? eq(orders.assignedToUserId, ctx.user.id)
						: sql`1 = 0`,
				);

	return rows.map((customer) => ({
		...customer,
		actions: buildEntityActions({
			canUpdate: canUpdateCustomers,
			canDelete: canDeleteCustomers,
		}),
	}));
});
