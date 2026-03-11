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

export const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
	details: z.string(),
});

export const createOrderFormState = z.object({
	customerId: z.string(),
	assignedToUserId: z.string().nullable(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.date(),
	status: z.string().nullable(),
	shippingStatus: z.string().nullable(),
	paymentStatus: z.string().nullable(),
	items: z.array(orderItemFormState),
});

export const createOrderFormSchema = z.object({
	customerId: z.string().min(1, {
		error: m.createOrderCustomerRequired(),
	}),
	assignedToUserId: z.string().nullable(),
	deliveryAddress: z.string().min(1, {
		error: m.createOrderAddressRequired(),
	}),
	expectedDeliveryAt: z.coerce.string<Date>({
		error: m.createOrderDateRequired(),
	}),
	status: z.enum(ORDER_STATUS_VALUES, {
		error: m.createOrderStatusRequired(),
	}),
	shippingStatus: z.enum(ORDER_SHIPPING_STATUS_VALUES, {
		error: m.createOrderShippingStatusRequired(),
	}),
	paymentStatus: z.enum(ORDER_PAYMENT_STATUS_VALUES, {
		error: m.createOrderPaymentStatusRequired(),
	}),
	items: z
		.array(
			z.object({
				productId: z.string().min(1, {
					error: m.createOrderItemProductRequired(),
				}),
				quantity: z.coerce.number<string>().min(1, {
					error: m.createOrderItemQuantityInvalid(),
				}),
				price: z.coerce.number<string>().min(1, {
					error: m.createOrderItemPriceInvalid(),
				}),
				details: z.string(),
			}),
		)
		.min(1, { error: m.createOrderItemsRequired() }),
});

const DEFAULT_CREATE_ORDER_FORM_VALUES: z.infer<typeof createOrderFormState> = {
	customerId: '',
	assignedToUserId: null,
	deliveryAddress: '',
	expectedDeliveryAt: new Date(),
	status: 'pending',
	shippingStatus: 'to_ship',
	paymentStatus: 'pending',
	items: [{ productId: '', quantity: '1', price: '', details: '' }],
};

export const CREATE_ORDER_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_CREATE_ORDER_FORM_VALUES,
	validators: {
		onSubmit: createOrderFormSchema,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});

export { useAppForm, withForm };
