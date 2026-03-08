import { asc, like, or } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasPermission,
	buildUserActions,
} from '@/features/.server/auth/authorization.lib';
import { users } from '@/features/.server/auth/better-auth.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { procedures } from '@/features/.server/trpc/trpc.init';

const getUsersInput = z
	.object({
		search: z.string().trim().optional(),
	})
	.optional();

export const getUsers = procedures.auth
	.input(getUsersInput)
	.query(async ({ input, ctx }) => {
		assertHasPermission(ctx.permissions, { user: ['list'] });

		const normalizedSearch = input?.search?.trim();
		const rows = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				banned: users.banned,
				banReason: users.banReason,
				banExpires: users.banExpires,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(
				normalizedSearch
					? or(
							like(users.name, `%${normalizedSearch}%`),
							like(users.email, `%${normalizedSearch}%`),
						)
					: undefined,
			)
			.orderBy(asc(users.name));

		return rows.map((user) => ({
			...user,
			actions: buildUserActions({
				permissions: ctx.permissions,
				currentUserId: ctx.user.id,
				targetUserId: user.id,
			}),
		}));
	});
