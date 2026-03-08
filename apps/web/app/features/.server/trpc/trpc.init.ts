import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import SuperJSON from 'superjson';
import * as z from 'zod';
import { ZodError } from 'zod';
import { getPermissionsByRole } from '@/features/.server/auth/better-auth-roles.constant';
import { auth } from '@/features/.server/auth/better-auth-server.lib';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { m } from '@/features/i18n/paraglide/messages';

export const createTRPCContext = async (ctx: FetchCreateContextFnOptions) => {
	const session = await auth.api.getSession({
		headers: ctx.req.headers,
	});
	const permissions = getPermissionsByRole(session?.user.role);

	return {
		session: session?.session,
		user: session?.user,
		permissions,
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

const issuesSchema = z.array(
	z.object({
		code: z.enum(['custom']),
		message: z.string(),
		path: z.array(z.string().or(z.number())),
	}),
);

function buildZodErrorFromTRPCError(error: TRPCError): ZodError | null {
	if (error.cause?.message) {
		try {
			const parsed = JSON.parse(error.cause.message);
			const issues = issuesSchema.parse(parsed);
			return new ZodError(issues);
		} catch {
			return null;
		}
	}
	return null;
}

export const t = initTRPC.context<TRPCContext>().create({
	transformer: SuperJSON,
	errorFormatter: (opts) => {
		const { shape, error } = opts;

		const zodError = buildZodErrorFromTRPCError(error);

		return {
			...shape,
			data: {
				...shape.data,
				message: zodError ? zodError.message : null,
				zodError: zodError ? formatZodToTanStack(zodError) : null,
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
			permissions: ctx.permissions,
		},
	});
});

export const procedures = {
	public: publicProcedure,
	auth: authProcedure,
};
