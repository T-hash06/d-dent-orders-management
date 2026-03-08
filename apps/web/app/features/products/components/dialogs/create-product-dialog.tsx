import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Spinner,
	toast,
} from '@full-stack-template/ui';
import { Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useState } from 'react';
import type {
	ProductCategory,
	ProductPreview,
} from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { CategoryComboboxField } from '@/features/products/components/fields/category-combobox-field';
import {
	CREATE_PRODUCT_FORM_OPTIONS,
	useAppForm,
} from '@/features/products/forms/create-product.form';
import {
	getNewCategoryName,
	isNewCategory,
} from '@/features/products/domain/product-category';
import { useTRPC } from '@/features/trpc/trpc.context';

const emptyProductCategoriesFallback: ProductCategory[] = [];

export function CreateProductDialog() {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: productCategories = emptyProductCategoriesFallback } = useQuery(
		trpc.products.getProductCategories.queryOptions(),
	);

	const createMutation = useMutation(
		trpc.products.createProduct.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.products.getProducts.queryKey(),
				);

				queryClient.setQueryData(
					trpc.products.getProducts.queryKey(),
					(old: ProductPreview[] | undefined) => {
						const categoryName = isNewCategory(variables.categoryId)
							? getNewCategoryName(variables.categoryId)
							: (productCategories.find(
									(category) => category.id === variables.categoryId,
								)?.name ?? '');

						return [
							...(old ?? []),
							{
								id: `temp-${Date.now()}`,
								hasPendingOrders: true,
								name: variables.name,
								categoryId: variables.categoryId,
								category: {
									id: variables.categoryId,
									name: categoryName,
								},
								variant: variables.variant,
								price: variables.price,
								createdAt: new Date(),
								updatedAt: new Date(),
								createdById: 'temp',
								updatedById: 'temp',
								actions: {
									canEdit: old?.[0]?.actions.canEdit ?? true,
									canDelete: old?.[0]?.actions.canDelete ?? false,
								},
							} satisfies ProductPreview,
						];
					},
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
				toast.error(m.createProductFailed());
			},
			onSuccess: () => {
				toast.success(m.createProductSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.products.getProductCategories.queryKey(),
				});
				form.reset();
				setOpen(false);
			},
		}),
	);

	const form = useAppForm({
		...CREATE_PRODUCT_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			const categoryId = value.categoryId.trim();
			if (!categoryId) {
				toast.error(m.createProductCategoryRequired());
				return;
			}

			createMutation.mutate({
				name: value.name,
				categoryId,
				variant: value.variant,
				price: Number(value.price),
			});
		},
	});

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await form.handleSubmit();
		},
		[form],
	);

	const isLoading = createMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm" className="gap-2 h-8 px-3">
						<HugeiconsIcon icon={Plus} className="h-4 w-4" />
						<span className="hidden sm:inline">{m.createProductButton()}</span>
						<span className="sm:hidden">{m.createProductButtonShort()}</span>
					</Button>
				}
			/>

			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.createProductTitle()}</DialogTitle>
					<DialogDescription>{m.createProductDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FieldGroup>
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
									{m.creatingButton()}
								</>
							) : (
								m.createButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
