import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const editCustomerFormState = z.object({
	name: z.string(),
	identifier: z.string(),
	phone: z.string(),
	address: z.string(),
});

const editCustomerFormSchema = z.object({
	name: z.string().min(1, {
		error: m.createCustomerNameRequired(),
	}),
	identifier: z.string().min(1, {
		error: m.createCustomerIdentifierRequired(),
	}),
	phone: z.string().min(1, {
		error: m.createCustomerPhoneRequired(),
	}),
	address: z.string().min(1, {
		error: m.createCustomerAddressRequired(),
	}),
}) satisfies z.ZodType<{
	name: string;
	identifier: string;
	phone: string;
	address: string;
}>;

export const editCustomerFormCodec = z.codec(
	editCustomerFormState,
	editCustomerFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
			identifier: value.identifier.trim(),
			phone: value.phone.trim(),
			address: value.address.trim(),
		}),
		encode: (value) => ({
			name: value.name,
			identifier: value.identifier,
			phone: value.phone,
			address: value.address,
		}),
	},
);

export function editCustomerFormOptions(defaultValues: {
	name: string;
	identifier: string;
	phone: string;
	address: string;
}) {
	return formOptions({
		defaultValues: {
			name: defaultValues.name,
			identifier: defaultValues.identifier,
			phone: defaultValues.phone,
			address: defaultValues.address,
		} satisfies z.infer<typeof editCustomerFormState>,
		validators: {
			onSubmit: editCustomerFormCodec,
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
