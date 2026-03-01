import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

export const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
});

export const createOrderFormState = z.object({
	customerId: z.string(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.string(),
	items: z.array(orderItemFormState),
});

export const createOrderFormSchema = z.object({
	customerId: z.string().min(1, {
		error: m.createOrderCustomerRequired(),
	}),
	deliveryAddress: z.string().min(1, {
		error: m.createOrderAddressRequired(),
	}),
	expectedDeliveryAt: z.string().min(1, {
		error: m.createOrderDateRequired(),
	}),
	items: z
		.array(
			z.object({
				productId: z.string().min(1, {
					error: m.createOrderItemProductRequired(),
				}),
				quantity: z.string().min(1, {
					error: m.createOrderItemQuantityInvalid(),
				}),
				price: z.string().min(1, {
					error: m.createOrderItemPriceInvalid(),
				}),
			}),
		)
		.min(1, { error: m.createOrderItemsRequired() }),
});

const DEFAULT_CREATE_ORDER_FORM_VALUES: z.infer<typeof createOrderFormState> = {
	customerId: '',
	deliveryAddress: '',
	expectedDeliveryAt: '',
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
