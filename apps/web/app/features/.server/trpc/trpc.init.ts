import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import SuperJSON from 'superjson';
import { ZodError } from 'zod';
import { auth } from '@/features/.server/auth/better-auth.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { m } from '@/features/i18n/paraglide/messages';

export const createTRPCContext = async (ctx: FetchCreateContextFnOptions) => {
	const session = await auth.api.getSession({
		headers: ctx.req.headers,
	});

	return {
		session: session?.session,
		user: session?.user,
	};
};

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const formatZodToTanStack = (
	error: ZodError,
): Record<
	string,
	{
		message: string;
	}
> => {
	return error.issues.reduce(
		(acc, issue) => {
			// Convert path: ['foo', 0, 'bar'] -> 'foo[0].bar'
			const key = issue.path
				.map((segment, idx) =>
					typeof segment === 'number'
						? `[${segment}]`
						: idx > 0 && typeof issue.path[idx - 1] === 'number'
							? `.${String(segment)}`
							: idx > 0
								? `.${String(segment)}`
								: String(segment),
				)
				.join('')
				.replace(/\.(\[\d+\])/g, '$1');
			acc[key] = { message: issue.message };
			return acc;
		},
		{} as Record<
			string,
			{
				message: string;
			}
		>,
	);
}; // TODO: Move this to a shared utils file

export const t = initTRPC.context<TRPCContext>().create({
	transformer: SuperJSON,
	errorFormatter: (opts) => {
		const { shape, error } = opts;

		const isZodError = error.cause instanceof ZodError;

		return {
			...shape,
			data: {
				...shape.data,
				message: isZodError ? error.cause.message : null,
				zodError:
					error.cause instanceof ZodError
						? formatZodToTanStack(error.cause)
						: null,
			},
		};
	},
});

const publicProcedure = t.procedure;

const authProcedure = publicProcedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: m.unauthorizedAccess(
				{},
				{
					locale: getLocaleFromAsyncStorage(),
				},
			),
		});
	}

	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: m.unauthorizedAccess(
				{},
				{
					locale: getLocaleFromAsyncStorage(),
				},
			),
		});
	}

	return next({
		ctx: {
			session: ctx.session,
			user: ctx.user,
		},
	});
});

export const procedures = {
	public: publicProcedure,
	auth: authProcedure,
};
