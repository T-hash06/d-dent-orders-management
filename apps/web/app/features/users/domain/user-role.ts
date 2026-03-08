export const USER_ROLE_VALUES = [
	'admin',
	'operator',
	'supervisor',
	'accounting',
] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export function isUserRole(
	value: string | null | undefined,
): value is UserRole {
	if (!value) {
		return false;
	}

	return USER_ROLE_VALUES.includes(value as UserRole);
}
