import * as z from 'zod';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import {
	ROLE_VALUES,
	type Role,
} from '@/features/.server/auth/better-auth-roles.constant';
import { auth } from '@/features/.server/auth/better-auth-server.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { assertAuthApiSuccess } from '@/features/.server/users/assert-auth-api-success.lib';
import { m } from '@/features/i18n/paraglide/messages';

const setUserRoleInput = z.object({
	userId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	role: z.enum(ROLE_VALUES, {
		error: () => m.invalidRoleType({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const setUserRole = procedures.auth
	.input(setUserRoleInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'set-role', 'User');

		const result = await auth.api.setRole({
			headers: ctx.headers,
			body: {
				userId: input.userId,
				role: input.role as Role,
			},
		});
		assertAuthApiSuccess({
			result,
			fallbackMessage: m.setUserRoleFailed(
				{},
				{ locale: getLocaleFromAsyncStorage() },
			),
		});

		return {
			userId: input.userId,
			role: input.role,
		};
	});
