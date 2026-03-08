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
	canCancelOrder: boolean;
	canUpdatePaymentStatus: boolean;
	canAssign: boolean;
	editableFields: {
		canEditCustomerId: boolean;
		canEditAssignedToUserId: boolean;
		canEditDeliveryAddress: boolean;
		canEditExpectedDeliveryAt: boolean;
		canEditStatus: boolean;
		canCancelOrder: boolean;
		canEditPaymentStatus: boolean;
		canEditItemProductId: boolean;
		canEditItemQuantity: boolean;
		canEditItemPrice: boolean;
		canEditItemDetails: boolean;
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
export type AnalyticsCapabilities = {
	canList: boolean;
	groups: {
		[Group in AnalyticsGroup]: {
			all: boolean;
			assigned: boolean;
		};
	};
};

const ANALYTICS_ACTION_BY_GROUP: {
	[Group in AnalyticsGroup]: {
		[Scope in AnalyticsScope]: PermissionAction<'analytics'>;
	};
} = {
	overview: {
		all: 'overview-all',
		assigned: 'overview-assigned',
	},
	'orders-performance': {
		all: 'orders-performance-all',
		assigned: 'orders-performance-assigned',
	},
	'customers-insights': {
		all: 'customers-insights-all',
		assigned: 'customers-insights-assigned',
	},
	'products-insights': {
		all: 'products-insights-all',
		assigned: 'products-insights-assigned',
	},
	revenue: {
		all: 'revenue-all',
		assigned: 'revenue-assigned',
	},
	operations: {
		all: 'operations-all',
		assigned: 'operations-assigned',
	},
	'team-performance': {
		all: 'team-performance-all',
		assigned: 'team-performance-assigned',
	},
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

export const canListAnalytics = (source: Permissions) =>
	hasPermission(source, { analytics: ['list'] });

export const canAccessAnalyticsGroup = (
	source: Permissions,
	group: AnalyticsGroup,
	scope: AnalyticsScope,
) =>
	hasPermission(source, {
		analytics: [ANALYTICS_ACTION_BY_GROUP[group][scope]],
	});

export const buildAnalyticsCapabilities = (
	source: Permissions,
): AnalyticsCapabilities => ({
	canList: canListAnalytics(source),
	groups: ANALYTICS_GROUP_VALUES.reduce(
		(acc, group) => {
			acc[group] = {
				all: canAccessAnalyticsGroup(source, group, 'all'),
				assigned: canAccessAnalyticsGroup(source, group, 'assigned'),
			};
			return acc;
		},
		{} as AnalyticsCapabilities['groups'],
	),
});

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
	const canUpdateItemDetails =
		hasPermission(permissions, { orders: ['update-item-details-all'] }) ||
		(assignedToCurrentUser &&
			hasPermission(permissions, { orders: ['update-item-details-assigned'] }));
	const canUpdateStatus =
		hasPermission(permissions, { orders: ['update-status-all'] }) ||
		(assignedToCurrentUser &&
			hasPermission(permissions, { orders: ['update-status-assigned'] }));
	const canCancelOrder = hasPermission(permissions, { orders: ['cancel'] });
	const canUpdatePaymentStatus = hasPermission(permissions, {
		orders: ['update-payment-status'],
	});
	const canAssign =
		hasPermission(permissions, { orders: ['assign-all'] }) ||
		(assignedToCurrentUser &&
			hasPermission(permissions, { orders: ['assign-assigned'] }));
	const canEdit =
		canUpdateAllOrderFields ||
		canUpdateAssignedOrderFields ||
		canUpdateItemDetails;
	const editableFields = canUpdateAllOrderFields
		? {
				canEditCustomerId: true,
				canEditAssignedToUserId: true,
				canEditDeliveryAddress: true,
				canEditExpectedDeliveryAt: true,
				canEditStatus: true,
				canCancelOrder,
				canEditPaymentStatus: canUpdatePaymentStatus,
				canEditItemProductId: true,
				canEditItemQuantity: true,
				canEditItemPrice: true,
				canEditItemDetails: true,
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
					canCancelOrder,
					canEditPaymentStatus: canUpdatePaymentStatus,
					canEditItemProductId: false,
					canEditItemQuantity: true,
					canEditItemPrice: false,
					canEditItemDetails: canUpdateItemDetails,
					canAddItems: false,
					canRemoveItems: false,
				}
			: {
					canEditCustomerId: false,
					canEditAssignedToUserId: false,
					canEditDeliveryAddress: false,
					canEditExpectedDeliveryAt: false,
					canEditStatus: false,
					canCancelOrder,
					canEditPaymentStatus: canUpdatePaymentStatus,
					canEditItemProductId: false,
					canEditItemQuantity: false,
					canEditItemPrice: false,
					canEditItemDetails: canUpdateItemDetails,
					canAddItems: false,
					canRemoveItems: false,
				};

	return {
		canEdit,
		canDelete: hasPermission(permissions, { orders: ['delete'] }),
		canUpdateStatus,
		canCancelOrder,
		canUpdatePaymentStatus,
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
