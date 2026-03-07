import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

const statement = {
	...defaultStatements,
	products: ['list', 'create', 'update', 'delete'],
	customers: ['list', 'create', 'update', 'delete'],
	orders: ['list', 'create', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
	...ac.statements,
	...adminAc.statements,
});

export const operator = ac.newRole({
	products: ['list'],
	customers: ['list'],
	orders: ['list'],
});

export const supervisor = ac.newRole({
	...operator.statements,
	products: ['create', 'update'],
	customers: ['create', 'update'],
	orders: ['create', 'update'],
});

export const EMPTY_PERMISSIONS = {
	products: [],
	customers: [],
	orders: [],
} as const;

function isValidRole(role: string | null | undefined): role is Role {
	if (!role) {
		return false;
	}

	return ['admin', 'operator', 'supervisor'].includes(role);
}

export const getPermissionsByRole = (role: string | null | undefined) => {
	if (!isValidRole(role)) {
		return EMPTY_PERMISSIONS;
	}

	switch (role) {
		case 'admin':
			return admin.statements;
		case 'operator':
			return operator.statements;
		case 'supervisor':
			return supervisor.statements;
		default:
			return EMPTY_PERMISSIONS;
	}
};

export type Role = 'admin' | 'operator' | 'supervisor';

export type Permissions = ReturnType<typeof getPermissionsByRole>;
