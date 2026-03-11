import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_PAYMENT_STATUS_VALUES } from '@/features/orders/domain/order-payment-status';
import { ORDER_SHIPPING_STATUS_VALUES } from '@/features/orders/domain/order-shipping-status';
import { ORDER_STATUS_VALUES } from '@/features/orders/domain/order-status';

export const { fieldContext, formContext } = createFormHookContexts();

const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
	details: z.string(),
});

const editOrderFormState = z.object({
	customerId: z.string(),
	assignedToUserId: z.string().nullable(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.date(),
	status: z.string().nullable(),
	shippingStatus: z.string().nullable(),
	paymentStatus: z.string().nullable(),
	items: z.array(orderItemFormState),
});

export const editOrderFormSchema = z.object({
	customerId: z.string().min(1, {
		error: m.editOrderCustomerRequired(),
	}),
	assignedToUserId: z.string().nullable(),
	deliveryAddress: z.string().min(1, {
		error: m.editOrderAddressRequired(),
	}),
	expectedDeliveryAt: z.coerce.string<Date>().min(1, {
		error: m.editOrderDateRequired(),
	}),
	status: z.enum(ORDER_STATUS_VALUES, {
		error: m.editOrderStatusRequired(),
	}),
	shippingStatus: z.enum(ORDER_SHIPPING_STATUS_VALUES, {
		error: m.editOrderShippingStatusRequired(),
	}),
	paymentStatus: z.enum(ORDER_PAYMENT_STATUS_VALUES, {
		error: m.editOrderPaymentStatusRequired(),
	}),
	items: z
		.array(
			z.object({
				productId: z.string().min(1, {
					error: m.editOrderItemProductRequired(),
				}),
				quantity: z.coerce.number<string>().min(1, {
					error: m.editOrderItemQuantityInvalid(),
				}),
				price: z.coerce.number<string>().min(1, {
					error: m.editOrderItemPriceInvalid(),
				}),
				details: z.string(),
			}),
		)
		.min(1, { error: m.editOrderItemsRequired() }),
});

export function editOrderFormOptions(defaultValues: {
	customerId: string;
	assignedToUserId: string | null;
	deliveryAddress: string;
	expectedDeliveryAt: Date;
	status: string | null;
	shippingStatus: string | null;
	paymentStatus: string | null;
	items: {
		productId: string;
		quantity: number;
		price: number;
		details: string;
	}[];
}) {
	return formOptions({
		defaultValues: {
			customerId: defaultValues.customerId,
			assignedToUserId: defaultValues.assignedToUserId,
			deliveryAddress: defaultValues.deliveryAddress,
			expectedDeliveryAt: new Date(defaultValues.expectedDeliveryAt),
			status: defaultValues.status,
			shippingStatus: defaultValues.shippingStatus,
			paymentStatus: defaultValues.paymentStatus,
			items: defaultValues.items.map((item) => ({
				productId: item.productId,
				quantity: String(item.quantity),
				price: String(item.price),
				details: item.details,
			})),
		} satisfies z.infer<typeof editOrderFormState>,
		validators: {
			onSubmit: editOrderFormSchema,
		},
	});
}

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});

export { useAppForm, withForm };
