import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const editUserFormState = z.object({
	name: z.string(),
});

const editUserFormSchema = z.object({
	name: z.string().min(1, {
		error: m.userNameRequired(),
	}),
}) satisfies z.ZodType<{
	name: string;
}>;

export const editUserFormCodec = z.codec(
	editUserFormState,
	editUserFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
		}),
		encode: (value) => ({
			name: value.name,
		}),
	},
);

export function editUserFormOptions(defaultValues: { name: string }) {
	return formOptions({
		defaultValues: {
			name: defaultValues.name,
		} satisfies z.infer<typeof editUserFormState>,
		validators: {
			onSubmit: editUserFormCodec,
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
