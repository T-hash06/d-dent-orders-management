import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const createCustomerFormState = z.object({
	name: z.string(),
	identifier: z.string(),
	phone: z.string(),
	address: z.string(),
});

const createCustomerFormSchema = z.object({
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

export const createCustomerFormCodec = z.codec(
	createCustomerFormState,
	createCustomerFormSchema,
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

const DEFAULT_CREATE_CUSTOMER_FORM_VALUES: z.infer<
	typeof createCustomerFormState
> = {
	name: '',
	identifier: '',
	phone: '',
	address: '',
};

export const CREATE_CUSTOMER_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_CREATE_CUSTOMER_FORM_VALUES,
	validators: {
		onSubmit: createCustomerFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});

export { useAppForm, withForm };
