import {
	assertHasPermission,
	buildAnalyticsCapabilities,
} from '@/features/.server/auth/authorization.lib';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getAnalyticsCapabilities = procedures.auth.query(({ ctx }) => {
	assertHasPermission(ctx.permissions, { analytics: ['list'] });

	return buildAnalyticsCapabilities(ctx.permissions);
});
