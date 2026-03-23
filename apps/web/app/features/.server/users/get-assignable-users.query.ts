import { inArray } from 'drizzle-orm';
import { assertCanAny } from '@/features/.server/auth/authorization.lib';
import { users } from '@/features/.server/auth/better-auth.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignableUsers = procedures.auth.query(async ({ ctx }) => {
	assertCanAny(ctx.ability, [
		{
			action: 'assign-all',
			subjectType: 'Order',
		},
		{
			action: 'assign-assigned',
			subjectType: 'Order',
			subjectValue: {
				assignedToUserId: ctx.user.id,
			},
		},
	]);

	const assignableUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
		})
		.from(users)
		.where(inArray(users.role, ['admin', 'operator', 'supervisor']));

	return assignableUsers;
});
