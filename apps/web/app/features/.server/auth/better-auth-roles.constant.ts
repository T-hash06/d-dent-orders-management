import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

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
		'assign-all',
		'assign-assigned',
		'update-status-all',
		'update-status-assigned',
	],
} as const;

export type Statement = typeof statement;
export type PermissionResource = keyof Statement;
export type PermissionAction<Resource extends PermissionResource> =
	Statement[Resource][number];
export type PermissionRequirement = Partial<{
	[Resource in PermissionResource]: readonly PermissionAction<Resource>[];
}>;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
	...ac.statements,
	...adminAc.statements,
});

export const operator = ac.newRole({
	user: [],
	session: [],
	products: ['list', 'list-assigned'],
	customers: ['list', 'list-assigned'],
	orders: ['list', 'list-assigned', 'update-status-assigned'],
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
	],
});

export const accounting = ac.newRole({
	user: [],
	session: [],
	products: ['list', 'list-all', 'create', 'update'],
	customers: ['list', 'list-all'],
	orders: ['list', 'list-all', 'update-status-all'],
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
	};
};

function isValidRole(role: string | null | undefined): role is Role {
	if (!role) {
		return false;
	}

	return ROLE_VALUES.includes(role as Role);
}
