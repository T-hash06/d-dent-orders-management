import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { localeContextStorage } from '@/features/.server/trpc/locale.context';
import { createTRPCContext } from '@/features/.server/trpc/trpc.init';
import { appRouter } from '@/features/.server/trpc/trpc.router';
import { locales } from '@/features/i18n/paraglide/runtime';
import type { Route } from './+types/trpc.handler';

const handleRequest = (args: Route.LoaderArgs | Route.ActionArgs) => {
	const cookies = args.request.headers.get('cookie') || '';
	let locale = (cookies
		.split(';')
		.find((cookie) => cookie.trim().startsWith('PARAGLIDE_LOCALE='))
		?.split('=')[1] || 'en') as (typeof locales)[number];

	if (!locales.includes(locale)) {
		locale = 'en';
	}

	//TODO: Check this again if https://github.com/trpc/trpc/issues/1963 is implemented, as we might want to move this to the trpc context or something less hacky
	return localeContextStorage.run(locale, () =>
		fetchRequestHandler({
			createContext: createTRPCContext,
			endpoint: '/api/trpc',
			req: args.request,
			router: appRouter,
		}),
	);
};

export const loader = (args: Route.LoaderArgs) => handleRequest(args);

export const action = (args: Route.ActionArgs) => handleRequest(args);
