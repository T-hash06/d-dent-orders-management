import {
	assertCan,
	buildAnalyticsCapabilities,
} from '@/features/.server/auth/authorization.lib';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAnalyticsCapabilities = procedures.auth.query(({ ctx }) => {
	assertCan(ctx.ability, 'list', 'Analytics');

	return buildAnalyticsCapabilities(ctx.ability);
});
