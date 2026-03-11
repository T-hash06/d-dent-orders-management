import { eq } from 'drizzle-orm';
import * as z from 'zod';
import {
	assertHasAnyPermission,
	buildOrderActions,
	forbiddenError,
} from '@/features/.server/auth/authorization.lib';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_PAYMENT_STATUS_VALUES } from '@/features/orders/domain/order-payment-status';
import { ORDER_SHIPPING_STATUS_VALUES } from '@/features/orders/domain/order-shipping-status';
import { ORDER_STATUS_VALUES } from '@/features/orders/domain/order-status';

const updateOrderItemInput = z.object({
	productId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	quantity: z
		.number({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.int({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.positive({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	price: z
		.number({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.nonnegative({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	details: z
		.string({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.optional()
		.default(''),
});

const updateOrderInput = z.object({
	id: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	customerId: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	assignedToUserId: z
		.string({
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () =>
				m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.nullable()
		.optional(),
	expectedDeliveryAt: z.coerce.date<string>({
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	status: z.enum(ORDER_STATUS_VALUES, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	shippingStatus: z.enum(ORDER_SHIPPING_STATUS_VALUES, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	paymentStatus: z.enum(ORDER_PAYMENT_STATUS_VALUES, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	deliveryAddress: z
		.string({
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		})
		.min(1, {
			error: () => m.missingField({}, { locale: getLocaleFromAsyncStorage() }),
		}),
	items: z.array(updateOrderItemInput).min(1, {
		error: () => m.validationError({}, { locale: getLocaleFromAsyncStorage() }),
	}),
});

export const updateOrder = procedures.auth
	.input(updateOrderInput)
	.mutation(async ({ input, ctx }) => {
		assertHasAnyPermission(ctx.permissions, [
			{ orders: ['update-all'] },
			{ orders: ['update-assigned'] },
			{ orders: ['update-item-details-all'] },
			{ orders: ['update-item-details-assigned'] },
		]);

		return db.transaction(async (tx) => {
			const [currentOrder] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, input.id));

			if (!currentOrder) {
				return null;
			}

			const orderActions = buildOrderActions({
				permissions: ctx.permissions,
				userId: ctx.user.id,
				assignedToUserId: currentOrder.assignedToUserId,
			});
			if (!orderActions.canEdit) {
				throw forbiddenError();
			}
			const { editableFields } = orderActions;

			const currentItems = await tx
				.select({
					productId: orderItems.productId,
					quantity: orderItems.quantity,
					price: orderItems.price,
					details: orderItems.details,
				})
				.from(orderItems)
				.where(eq(orderItems.orderId, input.id));

			const isChangingCustomerId = input.customerId !== currentOrder.customerId;
			if (isChangingCustomerId && !editableFields.canEditCustomerId) {
				throw forbiddenError();
			}
			const isChangingAssignedToUserId =
				input.assignedToUserId !== currentOrder.assignedToUserId;
			if (
				isChangingAssignedToUserId &&
				!editableFields.canEditAssignedToUserId
			) {
				throw forbiddenError();
			}
			const isChangingDeliveryAddress =
				input.deliveryAddress !== currentOrder.deliveryAddress;
			if (isChangingDeliveryAddress && !editableFields.canEditDeliveryAddress) {
				throw forbiddenError();
			}
			const isChangingExpectedDeliveryAt =
				input.expectedDeliveryAt.getTime() !==
				currentOrder.expectedDeliveryAt.getTime();
			if (
				isChangingExpectedDeliveryAt &&
				!editableFields.canEditExpectedDeliveryAt
			) {
				throw forbiddenError();
			}
			const isChangingStatus = input.status !== currentOrder.status;
			if (isChangingStatus) {
				if (input.status === 'cancelled') {
					if (!editableFields.canCancelOrder) {
						throw forbiddenError();
					}
				} else if (!editableFields.canEditStatus) {
					throw forbiddenError();
				}
			}
			const isChangingShippingStatus =
				input.shippingStatus !== currentOrder.shippingStatus;
			if (isChangingShippingStatus && !editableFields.canEditShippingStatus) {
				throw forbiddenError();
			}
			const isChangingPaymentStatus =
				input.paymentStatus !== currentOrder.paymentStatus;
			if (isChangingPaymentStatus && !editableFields.canEditPaymentStatus) {
				throw forbiddenError();
			}

			const itemChanges = getOrderItemsChangeSet({
				currentItems,
				nextItems: input.items,
			});

			if (itemChanges.hasAddedItems && !editableFields.canAddItems) {
				throw forbiddenError();
			}
			if (itemChanges.hasRemovedItems && !editableFields.canRemoveItems) {
				throw forbiddenError();
			}
			if (
				itemChanges.hasProductIdChanged &&
				!editableFields.canEditItemProductId
			) {
				throw forbiddenError();
			}
			if (itemChanges.hasPriceChanged && !editableFields.canEditItemPrice) {
				throw forbiddenError();
			}
			if (
				itemChanges.hasQuantityChanged &&
				!editableFields.canEditItemQuantity
			) {
				throw forbiddenError();
			}
			if (itemChanges.hasDetailsChanged && !editableFields.canEditItemDetails) {
				throw forbiddenError();
			}

			const [updatedOrder] = await tx
				.update(orders)
				.set({
					customerId: input.customerId,
					assignedToUserId: input.assignedToUserId ?? null,
					expectedDeliveryAt: input.expectedDeliveryAt,
					status: input.status,
					shippingStatus: input.shippingStatus,
					paymentStatus: input.paymentStatus,
					deliveryAddress: input.deliveryAddress,
					updatedById: ctx.user.id,
				})
				.where(eq(orders.id, input.id))
				.returning();

			await tx.delete(orderItems).where(eq(orderItems.orderId, input.id));

			await tx.insert(orderItems).values(
				input.items.map((item) => ({
					orderId: input.id,
					productId: item.productId,
					quantity: item.quantity,
					price: item.price,
					details: item.details,
					createdById: ctx.user.id,
					updatedById: ctx.user.id,
				})),
			);

			return updatedOrder;
		});
	});

function getOrderItemsChangeSet({
	currentItems,
	nextItems,
}: {
	currentItems: Array<{
		productId: string;
		quantity: number;
		price: number;
		details: string;
	}>;
	nextItems: Array<{
		productId: string;
		quantity: number;
		price: number;
		details: string;
	}>;
}) {
	const hasAddedItems = nextItems.length > currentItems.length;
	const hasRemovedItems = nextItems.length < currentItems.length;

	const currentProductIdSignature = createItemsSignature(
		currentItems,
		(item) => item.productId,
	);
	const nextProductIdSignature = createItemsSignature(
		nextItems,
		(item) => item.productId,
	);
	const hasProductIdChanged =
		currentProductIdSignature !== nextProductIdSignature;

	const currentProductPriceSignature = createItemsSignature(
		currentItems,
		(item) => `${item.productId}::${item.price}`,
	);
	const nextProductPriceSignature = createItemsSignature(
		nextItems,
		(item) => `${item.productId}::${item.price}`,
	);
	const hasProductPriceChanged =
		currentProductPriceSignature !== nextProductPriceSignature;
	const hasPriceChanged = !hasProductIdChanged && hasProductPriceChanged;

	const currentProductDetailsSignature = createItemsSignature(
		currentItems,
		(item) => `${item.productId}::${item.price}::${item.details}`,
	);
	const nextProductDetailsSignature = createItemsSignature(
		nextItems,
		(item) => `${item.productId}::${item.price}::${item.details}`,
	);
	const hasProductDetailsChanged =
		currentProductDetailsSignature !== nextProductDetailsSignature;
	const hasDetailsChanged = !hasProductPriceChanged && hasProductDetailsChanged;

	const currentFullSignature = createItemsSignature(
		currentItems,
		(item) =>
			`${item.productId}::${item.price}::${item.details}::${item.quantity}`,
	);
	const nextFullSignature = createItemsSignature(
		nextItems,
		(item) =>
			`${item.productId}::${item.price}::${item.details}::${item.quantity}`,
	);
	const hasQuantityChanged =
		!hasProductPriceChanged &&
		!hasProductDetailsChanged &&
		currentFullSignature !== nextFullSignature;

	return {
		hasAddedItems,
		hasRemovedItems,
		hasProductIdChanged,
		hasPriceChanged,
		hasDetailsChanged,
		hasQuantityChanged,
	};
}

function createItemsSignature<TItem>(
	items: readonly TItem[],
	getSignaturePart: (item: TItem) => string,
): string {
	return items
		.map((item) => getSignaturePart(item))
		.sort()
		.join('|');
}
