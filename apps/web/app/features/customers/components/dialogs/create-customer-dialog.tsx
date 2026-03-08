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
import type { Customer } from '@/features/.server/customers/customer.types';
import {
	CREATE_CUSTOMER_FORM_OPTIONS,
	useAppForm,
} from '@/features/customers/forms/create-customer.form';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

export function CreateCustomerDialog() {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createMutation = useMutation(
		trpc.customers.createCustomer.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.customers.getCustomers.queryKey(),
				);

				queryClient.setQueryData(
					trpc.customers.getCustomers.queryKey(),
					(old: Customer[] | undefined) => [
						...(old ?? []),
						{
							id: `temp-${Date.now()}`,
							name: variables.name,
							identifier: variables.identifier,
							phone: variables.phone,
							address: variables.address,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdById: 'temp',
							updatedById: 'temp',
							actions: {
								canEdit: old?.[0]?.actions.canEdit ?? true,
								canDelete: old?.[0]?.actions.canDelete ?? true,
							},
						} satisfies Customer,
					],
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
				toast.error(m.createCustomerFailed());
			},
			onSuccess: () => {
				toast.success(m.createCustomerSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});
				form.reset();
				setOpen(false);
			},
		}),
	);

	const form = useAppForm({
		...CREATE_CUSTOMER_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				name: value.name,
				identifier: value.identifier,
				phone: value.phone,
				address: value.address,
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
						<span className="hidden sm:inline">{m.createCustomerButton()}</span>
						<span className="sm:hidden">{m.createCustomerButtonShort()}</span>
					</Button>
				}
			/>

			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.createCustomerTitle()}</DialogTitle>
					<DialogDescription>{m.createCustomerDescription()}</DialogDescription>
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
