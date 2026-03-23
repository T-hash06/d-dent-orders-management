import * as z from 'zod';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import { auth } from '@/features/.server/auth/better-auth-server.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { assertAuthApiSuccess } from '@/features/.server/users/assert-auth-api-success.lib';
import { m } from '@/features/i18n/paraglide/messages';

const updateUserInput = z.object({
	userId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	name: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const updateUser = procedures.auth
	.input(updateUserInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'update', 'User');

		const result = await auth.api.adminUpdateUser({
			headers: ctx.headers,
			body: {
				userId: input.userId,
				data: {
					name: input.name,
				},
			},
		});

		assertAuthApiSuccess({
			result,
			fallbackMessage: m.editUserFailed(
				{},
				{ locale: getLocaleFromAsyncStorage() },
			),
		});

		return {
			userId: input.userId,
			name: input.name,
		};
	});
