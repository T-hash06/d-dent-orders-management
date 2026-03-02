import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';
import { ORDER_STATUS_VALUES } from '@/features/orders/order-status';

export const { fieldContext, formContext } = createFormHookContexts();

const orderItemFormState = z.object({
	productId: z.string(),
	quantity: z.string(),
	price: z.string(),
});

const editOrderFormState = z.object({
	customerId: z.string(),
	deliveryAddress: z.string(),
	expectedDeliveryAt: z.date(),
	status: z.string().nullable(),
	items: z.array(orderItemFormState),
});

export const editOrderFormSchema = z.object({
	customerId: z.string().min(1, {
		error: m.editOrderCustomerRequired(),
	}),
	deliveryAddress: z.string().min(1, {
		error: m.editOrderAddressRequired(),
	}),
	expectedDeliveryAt: z.coerce.string<Date>().min(1, {
		error: m.editOrderDateRequired(),
	}),
	status: z.enum(ORDER_STATUS_VALUES, {
		error: m.editOrderStatusRequired(),
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
			}),
		)
		.min(1, { error: m.editOrderItemsRequired() }),
});

export function editOrderFormOptions(defaultValues: {
	customerId: string;
	deliveryAddress: string;
	expectedDeliveryAt: Date;
	status: string | null;
	items: { productId: string; quantity: number; price: number }[];
}) {
	return formOptions({
		defaultValues: {
			customerId: defaultValues.customerId,
			deliveryAddress: defaultValues.deliveryAddress,
			expectedDeliveryAt: new Date(defaultValues.expectedDeliveryAt),
			status: defaultValues.status,
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
