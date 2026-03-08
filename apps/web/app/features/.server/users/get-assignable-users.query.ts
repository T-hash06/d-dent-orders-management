import { inArray } from 'drizzle-orm';
import { assertHasAnyPermission } from '@/features/.server/auth/authorization.lib';
import { users } from '@/features/.server/auth/better-auth.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignableUsers = procedures.auth.query(async ({ ctx }) => {
	assertHasAnyPermission(ctx.permissions, [
		{ orders: ['assign-all'] },
		{ orders: ['assign-assigned'] },
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
