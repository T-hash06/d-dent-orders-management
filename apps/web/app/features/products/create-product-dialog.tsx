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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useState } from 'react';
import { m } from '@/features/i18n/paraglide/messages';
import {
	CREATE_PRODUCT_FORM_OPTIONS,
	useAppForm,
} from '@/features/products/create-product.form';
import type { Product } from '@/features/products/products.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

export function CreateProductDialog() {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

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
					(old: Product[] | undefined) => [
						...(old ?? []),
						{
							id: `temp-${Date.now()}`,
							name: variables.name,
							type: variables.type,
							variant: variables.variant,
							price: variables.price,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdById: 'temp',
							updatedById: 'temp',
						} satisfies Product,
					],
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
				form.reset();
				setOpen(false);
			},
		}),
	);

	const form = useAppForm({
		...CREATE_PRODUCT_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				name: value.name,
				type: value.type,
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

				<form onSubmit={handleSubmit} className="space-y-6">
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
