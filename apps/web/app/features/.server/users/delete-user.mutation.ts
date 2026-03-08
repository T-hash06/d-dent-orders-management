import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { assertHasPermission } from '@/features/.server/auth/authorization.lib';
import { auth } from '@/features/.server/auth/better-auth-server.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { assertAuthApiSuccess } from '@/features/.server/users/assert-auth-api-success.lib';
import { m } from '@/features/i18n/paraglide/messages';

const deleteUserInput = z.object({
	userId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
});

export const deleteUser = procedures.auth
	.input(deleteUserInput)
	.mutation(async ({ input, ctx }) => {
		assertHasPermission(ctx.permissions, { user: ['delete'] });

		if (input.userId === ctx.user.id) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: m.youCannotRemoveYourself(
					{},
					{ locale: getLocaleFromAsyncStorage() },
				),
			});
		}

		const result = await auth.api.removeUser({
			headers: ctx.headers,
			body: {
				userId: input.userId,
			},
		});

		assertAuthApiSuccess({
			result,
			fallbackMessage: m.deleteUserFailed(
				{},
				{ locale: getLocaleFromAsyncStorage() },
			),
		});

		return {
			userId: input.userId,
		};
	});
