import type { SessionRoleCapabilities } from '@/features/.server/auth/better-auth-roles.constant';

export function canAccessAdminBusinessIntelligence(
	roleCapabilities: SessionRoleCapabilities,
) {
	return (
		roleCapabilities.analytics.canList &&
		roleCapabilities.analytics.groups.overview.all &&
		roleCapabilities.analytics.groups['orders-performance'].all &&
		roleCapabilities.analytics.groups['customers-insights'].all &&
		roleCapabilities.analytics.groups['products-insights'].all &&
		roleCapabilities.analytics.groups.revenue.all &&
		roleCapabilities.analytics.groups.operations.all &&
		roleCapabilities.analytics.groups['team-performance'].all &&
		roleCapabilities.users.canList
	);
}
