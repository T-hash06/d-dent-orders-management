import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

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

export type Statement = typeof statement;
export type PermissionResource = keyof Statement;
export type PermissionAction<Resource extends PermissionResource> =
	Statement[Resource][number];
export type PermissionRequirement = Partial<{
	[Resource in PermissionResource]: readonly PermissionAction<Resource>[];
}>;

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

export const ROLE_VALUES = [
	'admin',
	'operator',
	'supervisor',
	'accounting',
] as const;
export type Role = (typeof ROLE_VALUES)[number];

export type Permissions = {
	[Resource in PermissionResource]: readonly PermissionAction<Resource>[];
};

export const EMPTY_PERMISSIONS: Permissions = {
	user: [],
	session: [],
	products: [],
	customers: [],
	orders: [],
	analytics: [],
};

export const getPermissionsByRole = (role: string | null | undefined) => {
	if (!isValidRole(role)) {
		return EMPTY_PERMISSIONS;
	}

	const roleStatements =
		role === 'admin'
			? admin.statements
			: role === 'operator'
				? operator.statements
				: role === 'supervisor'
					? supervisor.statements
					: accounting.statements;

	return {
		user: roleStatements.user ?? [],
		session: roleStatements.session ?? [],
		products: roleStatements.products,
		customers: roleStatements.customers,
		orders: roleStatements.orders,
		analytics: roleStatements.analytics,
	};
};

function isValidRole(role: string | null | undefined): role is Role {
	if (!role) {
		return false;
	}

	return ROLE_VALUES.includes(role as Role);
}
