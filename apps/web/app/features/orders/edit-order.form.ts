import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
});

const editOrderFormState = z.object({
	customerId: z.string(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.string(),
	items: z.array(orderItemFormState),
});

export const editOrderFormSchema = z.object({
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

export function editOrderFormOptions(defaultValues: {
	customerId: string;
	deliveryAddress: string;
	expectedDeliveryAt: Date;
	items: { productId: string; quantity: number; price: number }[];
}) {
	return formOptions({
		defaultValues: {
			customerId: defaultValues.customerId,
			deliveryAddress: defaultValues.deliveryAddress,
			expectedDeliveryAt: defaultValues.expectedDeliveryAt
				.toISOString()
				.substring(0, 10),
			items: defaultValues.items.map((item) => ({
				productId: item.productId,
				quantity: String(item.quantity),
				price: String(item.price),
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
