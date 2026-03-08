import { eq } from 'drizzle-orm';
import {
	assertHasAnyPermission,
	buildEntityActions,
	canReadAllCustomers,
	canReadAssignedCustomers,
	hasPermission,
} from '@/features/.server/auth/authorization.lib';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orders } from '@/features/.server/orders/order.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getCustomers = procedures.auth.query(async ({ ctx }) => {
	assertHasAnyPermission(ctx.permissions, [
		{ customers: ['list-all'] },
		{ customers: ['list-assigned'] },
	]);
	const canUpdateCustomers = hasPermission(ctx.permissions, { customers: ['update'] });
	const canDeleteCustomers = hasPermission(ctx.permissions, { customers: ['delete'] });
	const shouldScopeToAssigned =
		!canReadAllCustomers(ctx.permissions) && canReadAssignedCustomers(ctx.permissions);

	const rows = !shouldScopeToAssigned
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
				.where(eq(orders.assignedToUserId, ctx.user.id));

	return rows.map((customer) => ({
		...customer,
		actions: buildEntityActions({
			canUpdate: canUpdateCustomers,
			canDelete: canDeleteCustomers,
		}),
	}));
});
