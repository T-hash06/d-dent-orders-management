import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import { auth } from '@/features/.server/auth/better-auth-server.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { assertAuthApiSuccess } from '@/features/.server/users/assert-auth-api-success.lib';
import { m } from '@/features/i18n/paraglide/messages';

const setUserBanStatusInput = z.object({
	userId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	banned: z.boolean(),
});

export const setUserBanStatus = procedures.auth
	.input(setUserBanStatusInput)
	.mutation(async ({ input, ctx }) => {
		assertCan(ctx.ability, 'ban', 'User');

		if (input.userId === ctx.user.id) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: m.youCannotBanYourself(
					{},
					{ locale: getLocaleFromAsyncStorage() },
				),
			});
		}

		if (input.banned) {
			const result = await auth.api.banUser({
				headers: ctx.headers,
				body: {
					userId: input.userId,
				},
			});
			assertAuthApiSuccess({
				result,
				fallbackMessage: m.setUserBanStatusFailed(
					{},
					{ locale: getLocaleFromAsyncStorage() },
				),
			});
		} else {
			const result = await auth.api.unbanUser({
				headers: ctx.headers,
				body: {
					userId: input.userId,
				},
			});
			assertAuthApiSuccess({
				result,
				fallbackMessage: m.setUserBanStatusFailed(
					{},
					{ locale: getLocaleFromAsyncStorage() },
				),
			});
		}

		return {
			userId: input.userId,
			banned: input.banned,
		};
	});
