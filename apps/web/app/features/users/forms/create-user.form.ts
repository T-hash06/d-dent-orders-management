import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';
import {
	USER_ROLE_VALUES,
	type UserRole,
} from '@/features/users/domain/user-role';

export const { fieldContext, formContext } = createFormHookContexts();

const createUserFormState = z.object({
	name: z.string(),
	email: z.string(),
	password: z.string(),
	role: z.enum(USER_ROLE_VALUES),
});

const createUserFormSchema = z.object({
	name: z.string().min(1, {
		error: m.userNameRequired(),
	}),
	email: z.email({
		error: m.invalidEmail(),
	}),
	password: z
		.string()
		.nonempty({ error: m.passwordRequired() })
		.min(8, { error: m.passwordMinLength() }),
	role: z.enum(USER_ROLE_VALUES, {
		error: m.invalidRoleType(),
	}),
}) satisfies z.ZodType<{
	name: string;
	email: string;
	password: string;
	role: UserRole;
}>;

export const createUserFormCodec = z.codec(
	createUserFormState,
	createUserFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
			email: value.email.trim(),
			password: value.password,
			role: value.role,
		}),
		encode: (value) => ({
			name: value.name,
			email: value.email,
			password: value.password,
			role: value.role,
		}),
	},
);

const DEFAULT_CREATE_USER_FORM_VALUES: z.infer<typeof createUserFormState> = {
	name: '',
	email: '',
	password: '',
	role: 'operator',
};

export const CREATE_USER_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_CREATE_USER_FORM_VALUES,
	validators: {
		onSubmit: createUserFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});

export { useAppForm, withForm };
