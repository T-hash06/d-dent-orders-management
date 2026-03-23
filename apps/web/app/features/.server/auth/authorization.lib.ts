import {
	AbilityBuilder,
	createMongoAbility,
	type MongoAbility,
	subject,
} from '@casl/ability';
import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import type { User } from '@/features/.server/auth/better-auth.schema';
import {
	ANALYTICS_GROUP_VALUES,
	type AnalyticsGroup,
	type AnalyticsScope,
	isRole,
} from '@/features/.server/auth/better-auth-roles.constant';
import { orders } from '@/features/.server/orders/order.schema';
import { products } from '@/features/.server/products/product.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { m } from '@/features/i18n/paraglide/messages';

export type UserAbilityAction =
	| 'list'
	| 'create'
	| 'update'
	| 'delete'
	| 'set-role'
	| 'ban';
export type ProductAbilityAction =
	| 'list'
	| 'list-all'
	| 'list-assigned'
	| 'create'
	| 'update'
	| 'delete';
export type CustomerAbilityAction =
	| 'list'
	| 'list-all'
	| 'list-assigned'
	| 'create'
	| 'update'
	| 'delete';
export type OrderAbilityAction =
	| 'list'
	| 'list-all'
	| 'list-assigned'
	| 'create'
	| 'update-all'
	| 'update-assigned'
	| 'delete'
	| 'cancel'
	| 'assign-all'
	| 'assign-assigned'
	| 'update-status-all'
	| 'update-status-assigned'
	| 'update-item-details-all'
	| 'update-item-details-assigned'
	| 'update-payment-status';
export type AnalyticsAbilityAction =
	| 'list'
	| 'overview-all'
	| 'overview-assigned'
	| 'orders-performance-all'
	| 'orders-performance-assigned'
	| 'customers-insights-all'
	| 'customers-insights-assigned'
	| 'products-insights-all'
	| 'products-insights-assigned'
	| 'revenue-all'
	| 'revenue-assigned'
	| 'operations-all'
	| 'operations-assigned'
	| 'team-performance-all'
	| 'team-performance-assigned';

type ProductScopedSubject = {
	assignedToUserId: string;
};

type CustomerScopedSubject = {
	assignedToUserId: string;
};

type OrderScopedSubject = {
	assignedToUserId: string;
};

type AppAbilities =
	| [UserAbilityAction, 'User']
	| [ProductAbilityAction, 'Product' | ProductScopedSubject]
	| [CustomerAbilityAction, 'Customer' | CustomerScopedSubject]
	| [OrderAbilityAction, 'Order' | OrderScopedSubject]
	| [AnalyticsAbilityAction, 'Analytics'];

export type AppAbility = MongoAbility<AppAbilities>;

type AbilityCheckTuple =
	| [UserAbilityAction, 'User']
	| [ProductAbilityAction, 'Product']
	| [CustomerAbilityAction, 'Customer']
	| [OrderAbilityAction, 'Order']
	| [AnalyticsAbilityAction, 'Analytics'];

type AbilityCheck =
	| {
			action: UserAbilityAction;
			subjectType: 'User';
	  }
	| {
			action: ProductAbilityAction;
			subjectType: 'Product';
			subjectValue?: ProductScopedSubject;
	  }
	| {
			action: CustomerAbilityAction;
			subjectType: 'Customer';
			subjectValue?: CustomerScopedSubject;
	  }
	| {
			action: OrderAbilityAction;
			subjectType: 'Order';
			subjectValue?: OrderScopedSubject;
	  }
	| {
			action: AnalyticsAbilityAction;
			subjectType: 'Analytics';
	  };

type AbilityUser = Pick<User, 'id'> & {
	role?: string | null | undefined;
};

export type OrderActions = {
	canEdit: boolean;
	canDelete: boolean;
	canUpdateStatus: boolean;
	canUpdateShippingStatus: boolean;
	canCancelOrder: boolean;
	canUpdatePaymentStatus: boolean;
	canAssign: boolean;
	editableFields: {
		canEditCustomerId: boolean;
		canEditAssignedToUserId: boolean;
		canEditDeliveryAddress: boolean;
		canEditExpectedDeliveryAt: boolean;
		canEditStatus: boolean;
		canEditShippingStatus: boolean;
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

export type AnalyticsCapabilities = {
	canList: boolean;
	groups: {
		[Group in AnalyticsGroup]: {
			all: boolean;
			assigned: boolean;
		};
	};
};

const ANALYTICS_ACTION_BY_GROUP: Record<
	AnalyticsGroup,
	Record<AnalyticsScope, AnalyticsAbilityAction>
> = {
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

function assignedProductSubject(userId: string) {
	return subject('Product', {
		assignedToUserId: userId,
	});
}

function assignedCustomerSubject(userId: string) {
	return subject('Customer', {
		assignedToUserId: userId,
	});
}

function assignedOrderSubject(userId: string) {
	return subject('Order', {
		assignedToUserId: userId,
	});
}

export function defineAbilitiesForUser(
	user: AbilityUser | null | undefined,
): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

	if (!isRole(user?.role) || !user?.id) {
		return build();
	}

	if (user.role === 'admin') {
		can('list', 'User');
		can('create', 'User');
		can('update', 'User');
		can('delete', 'User');
		can('set-role', 'User');
		can('ban', 'User');

		can('list', 'Product');
		can('list-all', 'Product');
		can('list-assigned', 'Product');
		can('create', 'Product');
		can('update', 'Product');
		can('delete', 'Product');

		can('list', 'Customer');
		can('list-all', 'Customer');
		can('list-assigned', 'Customer');
		can('create', 'Customer');
		can('update', 'Customer');
		can('delete', 'Customer');

		can('list', 'Order');
		can('list-all', 'Order');
		can('list-assigned', 'Order');
		can('create', 'Order');
		can('update-all', 'Order');
		can('update-assigned', 'Order');
		can('delete', 'Order');
		can('cancel', 'Order');
		can('assign-all', 'Order');
		can('assign-assigned', 'Order');
		can('update-status-all', 'Order');
		can('update-status-assigned', 'Order');
		can('update-item-details-all', 'Order');
		can('update-item-details-assigned', 'Order');

		can('list', 'Analytics');
		can('overview-all', 'Analytics');
		can('overview-assigned', 'Analytics');
		can('orders-performance-all', 'Analytics');
		can('orders-performance-assigned', 'Analytics');
		can('customers-insights-all', 'Analytics');
		can('customers-insights-assigned', 'Analytics');
		can('products-insights-all', 'Analytics');
		can('products-insights-assigned', 'Analytics');
		can('revenue-all', 'Analytics');
		can('revenue-assigned', 'Analytics');
		can('operations-all', 'Analytics');
		can('operations-assigned', 'Analytics');
		can('team-performance-all', 'Analytics');
		can('team-performance-assigned', 'Analytics');

		return build();
	}

	if (user.role === 'operator') {
		can('list', 'Product');
		can('list-assigned', 'Product', { assignedToUserId: user.id });

		can('list', 'Customer');
		can('list-assigned', 'Customer', { assignedToUserId: user.id });

		can('list', 'Order');
		can('list-assigned', 'Order', { assignedToUserId: user.id });
		can('update-status-assigned', 'Order', { assignedToUserId: user.id });

		can('list', 'Analytics');
		can('overview-assigned', 'Analytics');
		can('orders-performance-assigned', 'Analytics');
		can('customers-insights-assigned', 'Analytics');
		can('products-insights-assigned', 'Analytics');
		can('operations-assigned', 'Analytics');

		return build();
	}

	if (user.role === 'supervisor') {
		can('list', 'Product');
		can('list-all', 'Product');

		can('list', 'Customer');
		can('list-all', 'Customer');

		can('list', 'Order');
		can('list-all', 'Order');
		can('update-assigned', 'Order', { assignedToUserId: user.id });
		can('assign-assigned', 'Order', { assignedToUserId: user.id });
		can('update-status-assigned', 'Order', { assignedToUserId: user.id });
		can('update-item-details-all', 'Order');

		can('list', 'Analytics');
		can('overview-all', 'Analytics');
		can('overview-assigned', 'Analytics');
		can('orders-performance-all', 'Analytics');
		can('orders-performance-assigned', 'Analytics');
		can('customers-insights-all', 'Analytics');
		can('customers-insights-assigned', 'Analytics');
		can('products-insights-all', 'Analytics');
		can('products-insights-assigned', 'Analytics');
		can('operations-all', 'Analytics');
		can('operations-assigned', 'Analytics');
		can('team-performance-all', 'Analytics');
		can('team-performance-assigned', 'Analytics');

		return build();
	}

	can('list', 'Product');
	can('list-all', 'Product');
	can('create', 'Product');
	can('update', 'Product');

	can('list', 'Customer');
	can('list-all', 'Customer');

	can('list', 'Order');
	can('list-all', 'Order');
	can('update-status-all', 'Order');
	can('cancel', 'Order');
	can('update-payment-status', 'Order');

	can('list', 'Analytics');
	can('overview-all', 'Analytics');
	can('orders-performance-all', 'Analytics');
	can('customers-insights-all', 'Analytics');
	can('products-insights-all', 'Analytics');
	can('revenue-all', 'Analytics');
	can('operations-all', 'Analytics');

	return build();
}

export function forbiddenError() {
	return new TRPCError({
		code: 'FORBIDDEN',
		message: m.unauthorizedAccess({}, { locale: getLocaleFromAsyncStorage() }),
	});
}

export function assertCan(
	ability: AppAbility,
	...[action, subjectType]: AbilityCheckTuple
) {
	const check = [action, subjectType] as AbilityCheckTuple;

	if (!ability.can(...check)) {
		throw forbiddenError();
	}
}

export function assertCanAny(
	ability: AppAbility,
	checks: ReadonlyArray<AbilityCheck>,
) {
	const hasAccess = checks.some((check) => {
		if (check.subjectType === 'User') {
			return ability.can(check.action, 'User');
		}

		if (check.subjectType === 'Analytics') {
			return ability.can(check.action, 'Analytics');
		}

		if (check.subjectType === 'Product') {
			return check.subjectValue
				? ability.can(check.action, subject('Product', check.subjectValue))
				: ability.can(check.action, 'Product');
		}

		if (check.subjectType === 'Customer') {
			return check.subjectValue
				? ability.can(check.action, subject('Customer', check.subjectValue))
				: ability.can(check.action, 'Customer');
		}

		return check.subjectValue
			? ability.can(check.action, subject('Order', check.subjectValue))
			: ability.can(check.action, 'Order');
	});

	if (!hasAccess) {
		throw forbiddenError();
	}
}

export function canReadAllOrders(ability: AppAbility): boolean {
	return ability.can('list-all', 'Order');
}

export function canReadAssignedOrders(
	ability: AppAbility,
	userId: string,
): boolean {
	return ability.can('list-assigned', assignedOrderSubject(userId));
}

export function canReadAllCustomers(ability: AppAbility): boolean {
	return ability.can('list-all', 'Customer');
}

export function canReadAssignedCustomers(
	ability: AppAbility,
	userId: string,
): boolean {
	return ability.can('list-assigned', assignedCustomerSubject(userId));
}

export function canReadAllProducts(ability: AppAbility): boolean {
	return ability.can('list-all', 'Product');
}

export function canReadAssignedProducts(
	ability: AppAbility,
	userId: string,
): boolean {
	return ability.can('list-assigned', assignedProductSubject(userId));
}

export function canListUsers(ability: AppAbility): boolean {
	return ability.can('list', 'User');
}

export function canListAnalytics(ability: AppAbility): boolean {
	return ability.can('list', 'Analytics');
}

export function canAccessAnalyticsGroup(
	ability: AppAbility,
	group: AnalyticsGroup,
	scope: AnalyticsScope,
): boolean {
	return ability.can(ANALYTICS_ACTION_BY_GROUP[group][scope], 'Analytics');
}

export function buildAnalyticsCapabilities(
	ability: AppAbility,
): AnalyticsCapabilities {
	return {
		canList: canListAnalytics(ability),
		groups: ANALYTICS_GROUP_VALUES.reduce(
			(acc, group) => {
				acc[group] = {
					all: canAccessAnalyticsGroup(ability, group, 'all'),
					assigned: canAccessAnalyticsGroup(ability, group, 'assigned'),
				};
				return acc;
			},
			{} as AnalyticsCapabilities['groups'],
		),
	};
}

export function canBeAssignedOrder(
	ability: AppAbility,
	userId: string,
): boolean {
	return (
		ability.can('list-assigned', assignedOrderSubject(userId)) ||
		ability.can('update-assigned', assignedOrderSubject(userId)) ||
		ability.can('assign-assigned', assignedOrderSubject(userId)) ||
		ability.can('update-all', 'Order') ||
		ability.can('assign-all', 'Order')
	);
}

export const isAssignedToUser = (
	assignedToUserId: string | null,
	userId: string,
): boolean => assignedToUserId === userId;

export function buildOrderActions({
	ability,
	userId,
	assignedToUserId,
}: {
	ability: AppAbility;
	userId: string;
	assignedToUserId: string | null;
}): OrderActions {
	const assignedToCurrentUser = isAssignedToUser(assignedToUserId, userId);
	const canUpdateAllOrderFields = ability.can('update-all', 'Order');
	const canUpdateAssignedOrderFields =
		assignedToCurrentUser &&
		ability.can('update-assigned', assignedOrderSubject(userId));
	const canUpdateItemDetails =
		ability.can('update-item-details-all', 'Order') ||
		(assignedToCurrentUser &&
			ability.can(
				'update-item-details-assigned',
				assignedOrderSubject(userId),
			));
	const canUpdateStatus =
		ability.can('update-status-all', 'Order') ||
		(assignedToCurrentUser &&
			ability.can('update-status-assigned', assignedOrderSubject(userId)));
	const canUpdateShippingStatus = canUpdateStatus;
	const canCancelOrder = ability.can('cancel', 'Order');
	const canUpdatePaymentStatus = ability.can('update-payment-status', 'Order');
	const canAssign =
		ability.can('assign-all', 'Order') ||
		(assignedToCurrentUser &&
			ability.can('assign-assigned', assignedOrderSubject(userId)));
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
				canEditShippingStatus: true,
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
					canEditShippingStatus: canUpdateShippingStatus,
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
					canEditShippingStatus: false,
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
		canDelete: ability.can('delete', 'Order'),
		canUpdateStatus,
		canUpdateShippingStatus,
		canCancelOrder,
		canUpdatePaymentStatus,
		canAssign,
		editableFields,
	};
}

export function buildUserActions({
	ability,
	currentUserId,
	targetUserId,
}: {
	ability: AppAbility;
	currentUserId: string;
	targetUserId: string;
}): UserActions {
	const isCurrentUser = currentUserId === targetUserId;
	const canUpdateUsers = ability.can('update', 'User');
	const canDeleteUsers = ability.can('delete', 'User');

	return {
		canEdit: canUpdateUsers,
		canDelete: !isCurrentUser && canDeleteUsers,
		canSetRole: !isCurrentUser && ability.can('set-role', 'User'),
		canBan: !isCurrentUser && ability.can('ban', 'User'),
	};
}

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

export function buildOrderScopeWhere({
	ability,
	userId,
}: {
	ability: AppAbility;
	userId: string;
}) {
	const canAll = canReadAllOrders(ability);
	const canAssigned = canReadAssignedOrders(ability, userId);

	if (canAll) {
		return undefined;
	}

	if (canAssigned) {
		return eq(orders.assignedToUserId, userId);
	}

	return sql`1 = 0`;
}

export function buildProductAssignedWhere({
	ability,
	userId,
}: {
	ability: AppAbility;
	userId: string;
}) {
	if (canReadAllProducts(ability)) {
		return undefined;
	}

	if (canReadAssignedProducts(ability, userId)) {
		return sql`EXISTS (
			SELECT 1
			FROM order_items oi
			JOIN orders o ON oi.order_id = o.id
			WHERE oi.product_id = ${products.id}
			  AND o.assigned_to_user_id = ${userId}
		)`;
	}

	return sql`1 = 0`;
}
