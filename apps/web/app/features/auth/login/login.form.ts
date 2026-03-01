import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

// The form controls is used to store any additional state related to
// the form, such as dialog open state, remember me checkbox state, etc.
// The form state does not have any validation or transformation logic,
// it's just a place to store the form raw values and any additional state
const loginFormState = z.object({
	email: z.string(),
	password: z.string(),
	formControls: z.object({
		rememberMe: z.boolean(), // TODO: This is just an example of additional form control state. Remove it if not needed.
	}),
});

// The form schema is used to define the validation and transformation
// logic for the form values. Usually, this is the schema that is sent
// to the server, so it should be in the shape that the server expects.
// We use the `satisfies` operator to ensure the schema is of the expected type.
const loginFormSchema = z.object({
	email: z.email({
		error: m.invalidEmail,
	}),
	password: z.string().nonempty({
		error: m.passwordRequired,
	}),
}) satisfies z.ZodType<{
	email: string;
	password: string;
}>;

const loginFormCodec = z.codec(loginFormState, loginFormSchema, {
	decode: (value) => {
		return {
			email: value.email,
			password: value.password,
		};
	},
	encode: (value) => {
		return {
			email: value.email,
			password: value.password,
			formControls: {
				rememberMe: false,
			},
		};
	},
});

const DEFAULT_LOGIN_FORM_VALUES: z.infer<typeof loginFormState> = {
	email: '',
	password: '',
	formControls: {
		rememberMe: false,
	},
};

const LOGIN_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_LOGIN_FORM_VALUES,
	validators: {
		onSubmit: loginFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext: fieldContext,
	formContext: formContext,
});

export { useAppForm, withForm, loginFormCodec, LOGIN_FORM_OPTIONS };
