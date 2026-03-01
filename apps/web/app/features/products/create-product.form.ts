import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const createProductFormState = z.object({
	name: z.string(),
	type: z.string(),
	variant: z.string(),
	price: z.string(),
});

const createProductFormSchema = z.object({
	name: z.string().min(1, {
		error: m.createProductNameRequired(),
	}),
	type: z.string().min(1, {
		error: m.createProductTypeRequired(),
	}),
	variant: z.string().min(1, {
		error: m.createProductVariantRequired(),
	}),
	price: z.coerce.number<string>().nonnegative({
		error: m.createProductPriceInvalid(),
	}),
}) satisfies z.ZodType<{
	name: string;
	type: string;
	variant: string;
	price: number;
}>;

export const createProductFormCodec = z.codec(
	createProductFormState,
	createProductFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
			type: value.type.trim(),
			variant: value.variant.trim(),
			price: value.price,
		}),
		encode: (value) => ({
			name: value.name,
			type: value.type,
			variant: value.variant,
			price: String(value.price),
		}),
	},
);

const DEFAULT_CREATE_PRODUCT_FORM_VALUES: z.infer<
	typeof createProductFormState
> = {
	name: '',
	type: '',
	variant: '',
	price: '',
};

export const CREATE_PRODUCT_FORM_OPTIONS = formOptions({
	defaultValues: DEFAULT_CREATE_PRODUCT_FORM_VALUES,
	validators: {
		onSubmit: createProductFormCodec,
	},
});

const { useAppForm, withForm } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});

export { useAppForm, withForm };
