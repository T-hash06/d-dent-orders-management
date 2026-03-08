import { TRPCError } from '@trpc/server';
import type {
	PermissionAction,
	PermissionRequirement,
	PermissionResource,
	Permissions,
} from '@/features/.server/auth/better-auth-roles.constant';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { m } from '@/features/i18n/paraglide/messages';

type PermissionEntry = {
	[Resource in PermissionResource]-?: [
		Resource,
		readonly PermissionAction<Resource>[],
	];
}[PermissionResource];

export type OrderActions = {
	canEdit: boolean;
	canDelete: boolean;
	canUpdateStatus: boolean;
	canAssign: boolean;
	editableFields: {
		canEditCustomerId: boolean;
		canEditAssignedToUserId: boolean;
		canEditDeliveryAddress: boolean;
		canEditExpectedDeliveryAt: boolean;
		canEditStatus: boolean;
		canEditItemProductId: boolean;
		canEditItemQuantity: boolean;
		canEditItemPrice: boolean;
		canAddItems: boolean;
		canRemoveItems: boolean;
	};
};

export type UserActions = {
	canEdit: boolean;
	canDelete: boolean;
	canSetRole: boolean;
	canBan: boolean;
};

export type EntityActions = {
	canEdit: boolean;
	canDelete: boolean;
};

export function forbiddenError() {
	return new TRPCError({
		code: 'FORBIDDEN',
		message: m.unauthorizedAccess({}, { locale: getLocaleFromAsyncStorage() }),
	});
}

export function hasPermission(
	source: Permissions,
	requirement: PermissionRequirement,
): boolean {
	return getPermissionEntries(requirement).every(([resource, actions]) =>
		hasResourceActions(source, resource, actions),
	);
}

export function hasAnyPermission(
	source: Permissions,
	requirements: readonly PermissionRequirement[],
): boolean {
	return requirements.some((requirement) => hasPermission(source, requirement));
}

export function assertHasPermission(
	source: Permissions,
	requirement: PermissionRequirement,
): void {
	if (!hasPermission(source, requirement)) {
		throw forbiddenError();
	}
}

export function assertHasAnyPermission(
	source: Permissions,
	requirements: readonly PermissionRequirement[],
): void {
	if (!hasAnyPermission(source, requirements)) {
		throw forbiddenError();
	}
}

export const canReadAllOrders = (source: Permissions) =>
	hasPermission(source, { orders: ['list-all'] });

export const canReadAssignedOrders = (source: Permissions) =>
	hasPermission(source, { orders: ['list-assigned'] });

export const canReadAllCustomers = (source: Permissions) =>
	hasPermission(source, { customers: ['list-all'] });

export const canReadAssignedCustomers = (source: Permissions) =>
	hasPermission(source, { customers: ['list-assigned'] });

export const canReadAllProducts = (source: Permissions) =>
	hasPermission(source, { products: ['list-all'] });

export const canReadAssignedProducts = (source: Permissions) =>
	hasPermission(source, { products: ['list-assigned'] });

export const canListUsers = (source: Permissions) =>
	hasPermission(source, { user: ['list'] });

export const canBeAssignedOrder = (source: Permissions) =>
	hasAnyPermission(source, [
		{ orders: ['list-assigned'] },
		{ orders: ['update-assigned'] },
		{ orders: ['assign-assigned'] },
		{ orders: ['update-all'] },
		{ orders: ['assign-all'] },
	]);

export const isAssignedToUser = (
	assignedToUserId: string | null,
	userId: string,
): boolean => assignedToUserId === userId;

export const buildOrderActions = ({
	permissions,
	userId,
	assignedToUserId,
}: {
	permissions: Permissions;
	userId: string;
	assignedToUserId: string | null;
}): OrderActions => {
	const assignedToCurrentUser = isAssignedToUser(assignedToUserId, userId);
	const canUpdateAllOrderFields = hasPermission(permissions, {
		orders: ['update-all'],
	});
	const canUpdateAssignedOrderFields =
		assignedToCurrentUser &&
		hasPermission(permissions, { orders: ['update-assigned'] });
	const canUpdateStatus =
		hasPermission(permissions, { orders: ['update-status-all'] }) ||
		(assignedToCurrentUser &&
			hasPermission(permissions, { orders: ['update-status-assigned'] }));
	const canAssign =
		hasPermission(permissions, { orders: ['assign-all'] }) ||
		(assignedToCurrentUser &&
			hasPermission(permissions, { orders: ['assign-assigned'] }));
	const canEdit = canUpdateAllOrderFields || canUpdateAssignedOrderFields;
	const editableFields = canUpdateAllOrderFields
		? {
				canEditCustomerId: true,
				canEditAssignedToUserId: true,
				canEditDeliveryAddress: true,
				canEditExpectedDeliveryAt: true,
				canEditStatus: true,
				canEditItemProductId: true,
				canEditItemQuantity: true,
				canEditItemPrice: true,
				canAddItems: true,
				canRemoveItems: true,
			}
		: canUpdateAssignedOrderFields
			? {
					canEditCustomerId: false,
					canEditAssignedToUserId: canAssign,
					canEditDeliveryAddress: false,
					canEditExpectedDeliveryAt: false,
					canEditStatus: canUpdateStatus,
					canEditItemProductId: false,
					canEditItemQuantity: true,
					canEditItemPrice: false,
					canAddItems: false,
					canRemoveItems: false,
				}
			: {
					canEditCustomerId: false,
					canEditAssignedToUserId: false,
					canEditDeliveryAddress: false,
					canEditExpectedDeliveryAt: false,
					canEditStatus: canUpdateStatus,
					canEditItemProductId: false,
					canEditItemQuantity: false,
					canEditItemPrice: false,
					canAddItems: false,
					canRemoveItems: false,
				};

	return {
		canEdit,
		canDelete: hasPermission(permissions, { orders: ['delete'] }),
		canUpdateStatus,
		canAssign,
		editableFields,
	};
};

export const buildUserActions = ({
	permissions,
	currentUserId,
	targetUserId,
}: {
	permissions: Permissions;
	currentUserId: string;
	targetUserId: string;
}): UserActions => {
	const isCurrentUser = currentUserId === targetUserId;
	const canUpdateUsers = hasPermission(permissions, { user: ['update'] });
	const canDeleteUsers = hasPermission(permissions, { user: ['delete'] });

	return {
		canEdit: canUpdateUsers,
		canDelete: !isCurrentUser && canDeleteUsers,
		canSetRole:
			!isCurrentUser && hasPermission(permissions, { user: ['set-role'] }),
		canBan: !isCurrentUser && hasPermission(permissions, { user: ['ban'] }),
	};
};

export const buildEntityActions = ({
	canUpdate,
	canDelete,
}: {
	canUpdate: boolean;
	canDelete: boolean;
}): EntityActions => ({
	canEdit: canUpdate,
	canDelete,
});

function getPermissionEntries(
	requirement: PermissionRequirement,
): PermissionEntry[] {
	return Object.entries(requirement).filter(([, actions]) =>
		Array.isArray(actions),
	) as PermissionEntry[];
}

function hasResourceActions<Resource extends PermissionResource>(
	permissions: Permissions,
	resource: Resource,
	actions: readonly PermissionAction<Resource>[],
): boolean {
	return actions.every((action) => permissions[resource].includes(action));
}
