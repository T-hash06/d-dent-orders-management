import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import type { User } from '@/features/.server/auth/better-auth.schema';

export const ROLE_VALUES = [
	'admin',
	'operator',
	'supervisor',
	'accounting',
] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const ANALYTICS_GROUP_VALUES = [
	'overview',
	'orders-performance',
	'customers-insights',
	'products-insights',
	'revenue',
	'operations',
	'team-performance',
] as const;
export type AnalyticsGroup = (typeof ANALYTICS_GROUP_VALUES)[number];
export type AnalyticsScope = 'all' | 'assigned';

const ROLE_SET: ReadonlySet<Role> = new Set(ROLE_VALUES);

const ANALYTICS_PERMISSIONS = [
	'list',
	'overview-all',
	'overview-assigned',
	'orders-performance-all',
	'orders-performance-assigned',
	'customers-insights-all',
	'customers-insights-assigned',
	'products-insights-all',
	'products-insights-assigned',
	'revenue-all',
	'revenue-assigned',
	'operations-all',
	'operations-assigned',
	'team-performance-all',
	'team-performance-assigned',
] as const;

export const statement = {
	...defaultStatements,
	products: ['list', 'list-all', 'list-assigned', 'create', 'update', 'delete'],
	customers: [
		'list',
		'list-all',
		'list-assigned',
		'create',
		'update',
		'delete',
	],
	orders: [
		'list',
		'list-all',
		'list-assigned',
		'create',
		'update-all',
		'update-assigned',
		'delete',
		'cancel',
		'assign-all',
		'assign-assigned',
		'update-status-all',
		'update-status-assigned',
		'update-item-details-all',
		'update-item-details-assigned',
		'update-payment-status',
	],
	analytics: ANALYTICS_PERMISSIONS,
} as const;

export const ac = createAccessControl(statement);

const ADMIN_ORDERS_PERMISSIONS = [
	'list',
	'list-all',
	'list-assigned',
	'create',
	'update-all',
	'update-assigned',
	'delete',
	'cancel',
	'assign-all',
	'assign-assigned',
	'update-status-all',
	'update-status-assigned',
	'update-item-details-all',
	'update-item-details-assigned',
] as const;

const ADMIN_ANALYTICS_PERMISSIONS = ANALYTICS_PERMISSIONS;

const OPERATOR_ANALYTICS_PERMISSIONS = [
	'list',
	'overview-assigned',
	'orders-performance-assigned',
	'customers-insights-assigned',
	'products-insights-assigned',
	'operations-assigned',
] as const;

const SUPERVISOR_ANALYTICS_PERMISSIONS = [
	'list',
	'overview-all',
	'overview-assigned',
	'orders-performance-all',
	'orders-performance-assigned',
	'customers-insights-all',
	'customers-insights-assigned',
	'products-insights-all',
	'products-insights-assigned',
	'operations-all',
	'operations-assigned',
	'team-performance-all',
	'team-performance-assigned',
] as const;

const ACCOUNTING_ANALYTICS_PERMISSIONS = [
	'list',
	'overview-all',
	'orders-performance-all',
	'customers-insights-all',
	'products-insights-all',
	'revenue-all',
	'operations-all',
] as const;

export const admin = ac.newRole({
	...ac.statements,
	...adminAc.statements,
	orders: ADMIN_ORDERS_PERMISSIONS,
	analytics: ADMIN_ANALYTICS_PERMISSIONS,
});

export const operator = ac.newRole({
	user: [],
	session: [],
	products: ['list', 'list-assigned'],
	customers: ['list', 'list-assigned'],
	orders: ['list', 'list-assigned', 'update-status-assigned'],
	analytics: OPERATOR_ANALYTICS_PERMISSIONS,
});

export const supervisor = ac.newRole({
	user: [],
	session: [],
	products: ['list', 'list-all'],
	customers: ['list', 'list-all'],
	orders: [
		'list',
		'list-all',
		'update-assigned',
		'assign-assigned',
		'update-status-assigned',
		'update-item-details-all',
	],
	analytics: SUPERVISOR_ANALYTICS_PERMISSIONS,
});

export const accounting = ac.newRole({
	user: [],
	session: [],
	products: ['list', 'list-all', 'create', 'update'],
	customers: ['list', 'list-all'],
	orders: [
		'list',
		'list-all',
		'update-status-all',
		'cancel',
		'update-payment-status',
	],
	analytics: ACCOUNTING_ANALYTICS_PERMISSIONS,
});

const ROLES_BY_NAME = {
	admin,
	operator,
	supervisor,
	accounting,
} as const satisfies Record<Role, typeof admin>;

export type AnalyticsCapabilities = {
	canList: boolean;
	groups: {
		[Group in AnalyticsGroup]: {
			all: boolean;
			assigned: boolean;
		};
	};
};

export type RoleCapabilities = {
	products: {
		canList: boolean;
		canListAll: boolean;
		canListAssigned: boolean;
		canCreate: boolean;
		canUpdate: boolean;
		canDelete: boolean;
	};
	customers: {
		canList: boolean;
		canListAll: boolean;
		canListAssigned: boolean;
		canCreate: boolean;
		canUpdate: boolean;
		canDelete: boolean;
	};
	orders: {
		canList: boolean;
		canListAll: boolean;
		canListAssigned: boolean;
		canCreate: boolean;
		canDelete: boolean;
		canCancel: boolean;
		canAssignAll: boolean;
		canAssignAssigned: boolean;
		canUpdateAll: boolean;
		canUpdateAssigned: boolean;
		canUpdateStatusAll: boolean;
		canUpdateStatusAssigned: boolean;
		canUpdateItemDetailsAll: boolean;
		canUpdateItemDetailsAssigned: boolean;
		canUpdatePaymentStatus: boolean;
	};
	users: {
		canList: boolean;
		canCreate: boolean;
		canUpdate: boolean;
		canDelete: boolean;
		canSetRole: boolean;
		canBan: boolean;
	};
	analytics: AnalyticsCapabilities;
};

export type SessionRoleCapabilities = RoleCapabilities;

const EMPTY_ANALYTICS_CAPABILITIES: AnalyticsCapabilities = {
	canList: false,
	groups: {
		overview: {
			all: false,
			assigned: false,
		},
		'orders-performance': {
			all: false,
			assigned: false,
		},
		'customers-insights': {
			all: false,
			assigned: false,
		},
		'products-insights': {
			all: false,
			assigned: false,
		},
		revenue: {
			all: false,
			assigned: false,
		},
		operations: {
			all: false,
			assigned: false,
		},
		'team-performance': {
			all: false,
			assigned: false,
		},
	},
};

export const EMPTY_ROLE_CAPABILITIES: RoleCapabilities = {
	products: {
		canList: false,
		canListAll: false,
		canListAssigned: false,
		canCreate: false,
		canUpdate: false,
		canDelete: false,
	},
	customers: {
		canList: false,
		canListAll: false,
		canListAssigned: false,
		canCreate: false,
		canUpdate: false,
		canDelete: false,
	},
	orders: {
		canList: false,
		canListAll: false,
		canListAssigned: false,
		canCreate: false,
		canDelete: false,
		canCancel: false,
		canAssignAll: false,
		canAssignAssigned: false,
		canUpdateAll: false,
		canUpdateAssigned: false,
		canUpdateStatusAll: false,
		canUpdateStatusAssigned: false,
		canUpdateItemDetailsAll: false,
		canUpdateItemDetailsAssigned: false,
		canUpdatePaymentStatus: false,
	},
	users: {
		canList: false,
		canCreate: false,
		canUpdate: false,
		canDelete: false,
		canSetRole: false,
		canBan: false,
	},
	analytics: EMPTY_ANALYTICS_CAPABILITIES,
};

function hasRoleStatementPermission<
	Resource extends keyof typeof statement,
	Action extends (typeof statement)[Resource][number],
>(roleName: Role, resource: Resource, action: Action) {
	return ROLES_BY_NAME[roleName].statements[resource].includes(action);
}

function buildRoleCapabilities(roleName: Role): RoleCapabilities {
	return {
		products: {
			canList: hasRoleStatementPermission(roleName, 'products', 'list'),
			canListAll: hasRoleStatementPermission(roleName, 'products', 'list-all'),
			canListAssigned: hasRoleStatementPermission(
				roleName,
				'products',
				'list-assigned',
			),
			canCreate: hasRoleStatementPermission(roleName, 'products', 'create'),
			canUpdate: hasRoleStatementPermission(roleName, 'products', 'update'),
			canDelete: hasRoleStatementPermission(roleName, 'products', 'delete'),
		},
		customers: {
			canList: hasRoleStatementPermission(roleName, 'customers', 'list'),
			canListAll: hasRoleStatementPermission(roleName, 'customers', 'list-all'),
			canListAssigned: hasRoleStatementPermission(
				roleName,
				'customers',
				'list-assigned',
			),
			canCreate: hasRoleStatementPermission(roleName, 'customers', 'create'),
			canUpdate: hasRoleStatementPermission(roleName, 'customers', 'update'),
			canDelete: hasRoleStatementPermission(roleName, 'customers', 'delete'),
		},
		orders: {
			canList: hasRoleStatementPermission(roleName, 'orders', 'list'),
			canListAll: hasRoleStatementPermission(roleName, 'orders', 'list-all'),
			canListAssigned: hasRoleStatementPermission(
				roleName,
				'orders',
				'list-assigned',
			),
			canCreate: hasRoleStatementPermission(roleName, 'orders', 'create'),
			canDelete: hasRoleStatementPermission(roleName, 'orders', 'delete'),
			canCancel: hasRoleStatementPermission(roleName, 'orders', 'cancel'),
			canAssignAll: hasRoleStatementPermission(
				roleName,
				'orders',
				'assign-all',
			),
			canAssignAssigned: hasRoleStatementPermission(
				roleName,
				'orders',
				'assign-assigned',
			),
			canUpdateAll: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-all',
			),
			canUpdateAssigned: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-assigned',
			),
			canUpdateStatusAll: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-status-all',
			),
			canUpdateStatusAssigned: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-status-assigned',
			),
			canUpdateItemDetailsAll: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-item-details-all',
			),
			canUpdateItemDetailsAssigned: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-item-details-assigned',
			),
			canUpdatePaymentStatus: hasRoleStatementPermission(
				roleName,
				'orders',
				'update-payment-status',
			),
		},
		users: {
			canList: hasRoleStatementPermission(roleName, 'user', 'list'),
			canCreate: hasRoleStatementPermission(roleName, 'user', 'create'),
			canUpdate: hasRoleStatementPermission(roleName, 'user', 'update'),
			canDelete: hasRoleStatementPermission(roleName, 'user', 'delete'),
			canSetRole: hasRoleStatementPermission(roleName, 'user', 'set-role'),
			canBan: hasRoleStatementPermission(roleName, 'user', 'ban'),
		},
		analytics: {
			canList: hasRoleStatementPermission(roleName, 'analytics', 'list'),
			groups: {
				overview: {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'overview-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'overview-assigned',
					),
				},
				'orders-performance': {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'orders-performance-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'orders-performance-assigned',
					),
				},
				'customers-insights': {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'customers-insights-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'customers-insights-assigned',
					),
				},
				'products-insights': {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'products-insights-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'products-insights-assigned',
					),
				},
				revenue: {
					all: hasRoleStatementPermission(roleName, 'analytics', 'revenue-all'),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'revenue-assigned',
					),
				},
				operations: {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'operations-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'operations-assigned',
					),
				},
				'team-performance': {
					all: hasRoleStatementPermission(
						roleName,
						'analytics',
						'team-performance-all',
					),
					assigned: hasRoleStatementPermission(
						roleName,
						'analytics',
						'team-performance-assigned',
					),
				},
			},
		},
	};
}

const ROLE_CAPABILITIES_BY_ROLE = {
	admin: buildRoleCapabilities('admin'),
	operator: buildRoleCapabilities('operator'),
	supervisor: buildRoleCapabilities('supervisor'),
	accounting: buildRoleCapabilities('accounting'),
} as const satisfies Record<Role, RoleCapabilities>;

export function isRole(value: string | null | undefined): value is Role {
	return value ? ROLE_SET.has(value as Role) : false;
}

export function getRoleCapabilitiesByRole(
	role: string | null | undefined,
): SessionRoleCapabilities {
	if (!isRole(role)) {
		return EMPTY_ROLE_CAPABILITIES;
	}

	return ROLE_CAPABILITIES_BY_ROLE[role];
}

export function getRoleCapabilitiesFromUser(
	user: Pick<User, 'role'> | null | undefined,
): SessionRoleCapabilities {
	return getRoleCapabilitiesByRole(user?.role);
}
