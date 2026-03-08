import { and, eq } from 'drizzle-orm';
import * as z from 'zod';
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
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const getCustomerByIdInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const getCustomerById = procedures.auth
	.input(getCustomerByIdInput)
	.query(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ customers: ['list-all'] },
			{ customers: ['list-assigned'] },
		]);
		const canUpdateCustomers = hasPermission(ctx.permissions, {
			customers: ['update'],
		});
		const canDeleteCustomers = hasPermission(ctx.permissions, {
			customers: ['delete'],
		});
		const shouldScopeToAssigned =
			!canReadAllCustomers(ctx.permissions) &&
			canReadAssignedCustomers(ctx.permissions);

		const [customer] = !shouldScopeToAssigned
			? await db.select().from(customers).where(eq(customers.id, input.id))
			: await db
					.select({
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
						and(
							eq(customers.id, input.id),
							eq(orders.assignedToUserId, ctx.user.id),
						),
					);

		if (!customer) {
			return null;
		}

		return {
			...customer,
			actions: buildEntityActions({
				canUpdate: canUpdateCustomers,
				canDelete: canDeleteCustomers,
			}),
		};
	});
