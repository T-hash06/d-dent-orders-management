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

const createUserInput = z.object({
	name: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	email: z.email({
		error: () => m.invalidEmail({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	password: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(8, {
			error: () =>
				m.passwordMinLength({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	role: z.enum(ROLE_VALUES, {
		error: () => m.invalidRoleType({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const createUser = procedures.auth
	.input(createUserInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'create', 'User');

		const result = await auth.api.createUser({
			headers: ctx.headers,
			body: {
				name: input.name,
				email: input.email,
				password: input.password,
				role: input.role as Role,
			},
		});

		assertAuthApiSuccess({
			result,
			fallbackMessage: m.createUserFailed(
				{},
				{ locale: getLocaleFromAsyncStorage() },
			),
		});

		return {
			email: input.email,
		};
	});
