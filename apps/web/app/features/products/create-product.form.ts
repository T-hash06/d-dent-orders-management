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
	categoryId: z.string(),
	variant: z.string(),
	price: z.string(),
});

const createProductFormSchema = z.object({
	name: z.string().min(1, {
		error: m.createProductNameRequired(),
	}),
	categoryId: z.string().min(1, {
		error: m.createProductCategoryRequired(),
	}),
	variant: z.string().min(1, {
		error: m.createProductVariantRequired(),
	}),
	price: z.coerce.number<string>().nonnegative({
		error: m.createProductPriceInvalid(),
	}),
}) satisfies z.ZodType<{
	name: string;
	categoryId: string;
	variant: string;
	price: number;
}>;

export const createProductFormCodec = z.codec(
	createProductFormState,
	createProductFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
			categoryId: value.categoryId.trim(),
			variant: value.variant.trim(),
			price: value.price,
		}),
		encode: (value) => ({
			name: value.name,
			categoryId: value.categoryId,
			variant: value.variant,
			price: String(value.price),
		}),
	},
);

const DEFAULT_CREATE_PRODUCT_FORM_VALUES: z.infer<
	typeof createProductFormState
> = {
	name: '',
	categoryId: '',
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
