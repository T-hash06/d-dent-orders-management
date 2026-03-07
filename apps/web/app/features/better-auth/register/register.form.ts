import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

// The form controls store additional UI state not sent to the server
const registerFormState = z.object({
	name: z.string(),
	email: z.string(),
	password: z.string(),
	confirmPassword: z.string(),
	image: z.instanceof(File).nullable(),
	imagePreview: z.string(),
});

// The form schema defines validation and the shape sent to the server
const registerFormSchema = z
	.object({
		name: z.string().nonempty({ error: m.nameRequired }),
		email: z.email({ error: m.invalidEmail }),
		password: z
			.string()
			.min(8, { error: m.passwordMinLength })
			.nonempty({ error: m.passwordRequired }),
		confirmPassword: z.string().nonempty({ error: m.confirmPasswordRequired }),
		image: z.file().nullable(), // TODO: Add file size/type validation
	})
	.refine((data) => data.password === data.confirmPassword, {
		error: m.passwordsDoNotMatch,
		path: ['confirmPassword'],
	}) satisfies z.ZodType<{
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	image: File | null;
}>;

const registerFormCodec = z.codec(registerFormState, registerFormSchema, {
	decode: (value) => {
		return {
			name: value.name,
			email: value.email,
			password: value.password,
			confirmPassword: value.confirmPassword,
			image: value.image,
		};
	},
	encode: (value) => {
		return {
			name: value.name,
			email: value.email,
			password: value.password,
			confirmPassword: value.confirmPassword,
			image: value.image,
			imagePreview: '',
		};
	},
});

const DEFAULT_REGISTER_FORM_VALUES: z.infer<typeof registerFormState> = {
	name: '',
	email: '',
	password: '',
	confirmPassword: '',
	image: null,
	imagePreview: '',
};

const REGISTER_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_REGISTER_FORM_VALUES,
	validators: {
		onSubmit: registerFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext: fieldContext,
	formContext: formContext,
});

export { useAppForm, withForm, registerFormCodec, REGISTER_FORM_OPTIONS };
