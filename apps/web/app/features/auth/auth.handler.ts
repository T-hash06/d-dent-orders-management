import { auth } from '@/features/.server/auth/better-auth.lib';
import type { Route } from './+types/auth.handler';

const handleRequest = (args: Route.LoaderArgs | Route.ActionArgs) => {
	return auth.handler(args.request);
};

export const loader = (args: Route.LoaderArgs) => handleRequest(args);

export const action = (args: Route.ActionArgs) => handleRequest(args);
