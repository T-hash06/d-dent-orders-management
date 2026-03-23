import { and, eq, sql } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertCanAny,
	buildEntityActions,
	canReadAllCustomers,
	canReadAssignedCustomers,
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

		const [customer] = canReadAll
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
							canReadAssigned
								? eq(orders.assignedToUserId, ctx.user.id)
								: sql`1 = 0`,
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
