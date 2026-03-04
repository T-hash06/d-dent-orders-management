import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_STATUS_VALUES } from '@/features/orders/order-status';

export const { fieldContext, formContext } = createFormHookContexts();

export const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
});

export const createOrderFormState = z.object({
	customerId: z.string(),
	assignedToUserId: z.string().nullable(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.date(),
	status: z.string().nullable(),
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
	items: [{ productId: '', quantity: '1', price: '' }],
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
