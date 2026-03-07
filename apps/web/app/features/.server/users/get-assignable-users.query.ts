import { users } from '@/features/.server/auth/better-auth.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAssignableUsers = procedures.auth.query(async () => {
	const assignableUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
		})
		.from(users);

	return assignableUsers;
});
