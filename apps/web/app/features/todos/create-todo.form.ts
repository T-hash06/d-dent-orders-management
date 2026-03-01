import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const createTodoFormState = z.object({
	title: z.string(),
	description: z.string(),
});

const createTodoFormSchema = z.object({
	title: z.string(),
	description: z.string().optional().default(''),
}) satisfies z.ZodType<{
	title: string;
	description?: string;
}>;

const createTodoFormCodec = z.codec(createTodoFormState, createTodoFormSchema, {
	decode: (value) => {
		return {
			title: value.title.trim(),
			description: value.description.trim(),
		};
	},
	encode: (value) => {
		return {
			title: value.title,
			description: value.description ?? '',
		};
	},
});

const DEFAULT_CREATE_TODO_FORM_VALUES: z.infer<typeof createTodoFormState> = {
	title: '',
	description: '',
};

const CREATE_TODO_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_CREATE_TODO_FORM_VALUES,
	validators: {
		onSubmit: createTodoFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext: fieldContext,
	formContext: formContext,
});

export { useAppForm, withForm, createTodoFormCodec, CREATE_TODO_FORM_OPTIONS };
