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
import type { Customer } from '@/features/.server/customers/customer.types';
import {
	editCustomerFormOptions,
	useAppForm,
} from '@/features/customers/forms/edit-customer.form';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

type EditCustomerDialogProps = {
	customer: Customer | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditCustomerDialog({
	customer,
	open,
	onOpenChange,
}: EditCustomerDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const updateMutation = useMutation(
		trpc.customers.updateCustomer.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.customers.getCustomers.queryKey(),
				);

				queryClient.setQueryData(
					trpc.customers.getCustomers.queryKey(),
					(old: Customer[] | undefined) =>
						(old ?? []).map((c) =>
							c.id === variables.id
								? { ...c, ...variables, updatedAt: new Date() }
								: c,
						),
				);

				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.customers.getCustomers.queryKey(),
						context.previous,
					);
				}
				toast.error(m.editCustomerFailed());
			},
			onSuccess: () => {
				toast.success(m.editCustomerSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const form = useAppForm({
		...editCustomerFormOptions({
			name: customer?.name ?? '',
			identifier: customer?.identifier ?? '',
			phone: customer?.phone ?? '',
			address: customer?.address ?? '',
		}),
		onSubmit: async ({ value }) => {
			if (!customer) return;
			updateMutation.mutate({
				id: customer.id,
				name: value.name,
				identifier: value.identifier,
				phone: value.phone,
				address: value.address,
			});
		},
	});

	// Reset form when customer changes
	useEffect(() => {
		if (customer) {
			form.reset({
				name: customer.name,
				identifier: customer.identifier,
				phone: customer.phone,
				address: customer.address,
			});
		}
	}, [customer, form]);

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
					<DialogTitle>{m.editCustomerTitle()}</DialogTitle>
					<DialogDescription>{m.editCustomerDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.customerName()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.customerNamePlaceholder()}
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

						<form.Field name="identifier">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.customerIdentifier()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.customerIdentifierPlaceholder()}
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

						<form.Field name="phone">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.customerPhone()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.customerPhonePlaceholder()}
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

						<form.Field name="address">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.customerAddress()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.customerAddressPlaceholder()}
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
