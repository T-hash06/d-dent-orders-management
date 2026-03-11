import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Spinner,
	toast,
} from '@full-stack-template/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useEffect, useMemo } from 'react';
import type {
	ProductCategory,
	ProductPreview,
} from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { CategoryComboboxField } from '@/features/products/components/fields/category-combobox-field';
import {
	getNewCategoryName,
	getProductCategoryId,
	getProductCategoryLabel,
	isNewCategory,
} from '@/features/products/domain/product-category';
import {
	editProductFormOptions,
	useAppForm,
} from '@/features/products/forms/edit-product.form';
import { useTRPC } from '@/features/trpc/trpc.context';

type EditProductDialogProps = {
	product: ProductPreview | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const emptyProductCategoriesFallback: ProductCategory[] = [];

export function EditProductDialog({
	product,
	open,
	onOpenChange,
}: EditProductDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: productCategories = emptyProductCategoriesFallback } = useQuery(
		trpc.products.getProductCategories.queryOptions(),
	);
	const selectedCategoryId = useMemo(
		() => (product ? getProductCategoryId(product, productCategories) : ''),
		[product, productCategories],
	);

	const updateMutation = useMutation(
		trpc.products.updateProduct.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.products.getProducts.queryKey(),
				);

				queryClient.setQueryData(
					trpc.products.getProducts.queryKey(),
					(old: ProductPreview[] | undefined) =>
						(old ?? []).map((p) => {
							if (p.id !== variables.id) {
								return p;
							}

							const categoryName = isNewCategory(variables.categoryId)
								? getNewCategoryName(variables.categoryId)
								: (productCategories.find(
										(category) => category.id === variables.categoryId,
									)?.name ?? getProductCategoryLabel(p));

							return {
								...p,
								name: variables.name,
								categoryId: variables.categoryId,
								category: {
									id: variables.categoryId,
									name: categoryName,
								},
								variant: variables.variant,
								price: variables.price,
								updatedAt: new Date(),
							};
						}),
				);

				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.products.getProducts.queryKey(),
						context.previous,
					);
				}
				toast.error(m.editProductFailed());
			},
			onSuccess: () => {
				toast.success(m.editProductSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.products.getProductCategories.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const form = useAppForm({
		...editProductFormOptions({
			name: product?.name ?? '',
			categoryId: selectedCategoryId,
			variant: product?.variant ?? '',
			price: product?.price ?? 0,
		}),
		onSubmit: async ({ value }) => {
			if (!product) return;
			const categoryId = value.categoryId.trim();
			if (!categoryId) {
				toast.error(m.createProductCategoryRequired());
				return;
			}

			updateMutation.mutate({
				id: product.id,
				name: value.name,
				categoryId,
				variant: value.variant,
				price: Number(value.price),
			});
		},
	});

	// Reset form when product changes
	useEffect(() => {
		if (product) {
			form.reset({
				name: product.name,
				categoryId: selectedCategoryId,
				variant: product.variant,
				price: String(product.price),
			});
		}
	}, [product, selectedCategoryId, form]);

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await form.handleSubmit();
		},
		[form],
	);

	const isLoading = updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.editProductTitle()}</DialogTitle>
					<DialogDescription>{m.editProductDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<form.Field name="categoryId">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{m.productCategory()}
									</FieldLabel>
									<CategoryComboboxField
										id={field.name}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={() => field.handleBlur()}
										categories={productCategories}
										disabled={isLoading}
										isInvalid={isInvalid}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>

					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.productName()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.productNamePlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
											autoFocus
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="variant">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.productVariant()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.productVariantPlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="price">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.productPrice()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											min="0"
											step="50"
											placeholder={m.productPricePlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<DialogFooter className="gap-4">
						<DialogClose
							render={
								<Button type="button" variant="outline" disabled={isLoading}>
									{m.cancelButton()}
								</Button>
							}
						/>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									{m.updatingButton()}
								</>
							) : (
								m.updateButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
