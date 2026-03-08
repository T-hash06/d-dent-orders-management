import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from '@tanstack/react-form';
import * as z from 'zod';
import { m } from '@/features/i18n/paraglide/messages';

export const { fieldContext, formContext } = createFormHookContexts();

const editProductFormState = z.object({
	name: z.string(),
	categoryId: z.string(),
	variant: z.string(),
	price: z.string(),
});

const editProductFormSchema = z.object({
	name: z.string().min(1, {
		error: m.createProductNameRequired(),
	}),
	categoryId: z.string().min(1, {
		error: m.createProductCategoryRequired(),
	}),
	variant: z.string().min(1, {
		error: m.createProductVariantRequired(),
	}),
	price: z.number().nonnegative({
		error: m.createProductPriceInvalid(),
	}),
}) satisfies z.ZodType<{
	name: string;
	categoryId: string;
	variant: string;
	price: number;
}>;

export const editProductFormCodec = z.codec(
	editProductFormState,
	editProductFormSchema,
	{
		decode: (value) => ({
			name: value.name.trim(),
			categoryId: value.categoryId.trim(),
			variant: value.variant.trim(),
			price: Number(value.price),
		}),
		encode: (value) => ({
			name: value.name,
			categoryId: value.categoryId,
			variant: value.variant,
			price: String(value.price),
		}),
	},
);

export function editProductFormOptions(defaultValues: {
	name: string;
	categoryId: string;
	variant: string;
	price: number;
}) {
	return formOptions({
		defaultValues: {
			name: defaultValues.name,
			categoryId: defaultValues.categoryId,
			variant: defaultValues.variant,
			price: String(defaultValues.price),
		} satisfies z.infer<typeof editProductFormState>,
		validators: {
			onSubmit: editProductFormCodec,
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
