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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useEffect } from 'react';
import { m } from '@/features/i18n/paraglide/messages';
import {
	editProductFormOptions,
	useAppForm,
} from '@/features/products/edit-product.form';
import type { Product } from '@/features/products/products.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

type EditProductDialogProps = {
	product: Product | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditProductDialog({
	product,
	open,
	onOpenChange,
}: EditProductDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

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
					(old: Product[] | undefined) =>
						(old ?? []).map((p) =>
							p.id === variables.id
								? { ...p, ...variables, updatedAt: new Date() }
								: p,
						),
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
				onOpenChange(false);
			},
		}),
	);

	const form = useAppForm({
		...editProductFormOptions({
			name: product?.name ?? '',
			type: product?.type ?? '',
			variant: product?.variant ?? '',
			price: product?.price ?? 0,
		}),
		onSubmit: async ({ value }) => {
			if (!product) return;
			updateMutation.mutate({
				id: product.id,
				name: value.name,
				type: value.type,
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
				type: product.type,
				variant: product.variant,
				price: String(product.price),
			});
		}
	}, [product, form]);

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
					<FieldGroup className="space-y-3">
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

						<form.Field name="type">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.productType()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.productTypePlaceholder()}
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
											step="0.01"
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

					<DialogFooter className="gap-2 pt-2">
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
									{m.savingButton()}
								</>
							) : (
								m.saveButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
