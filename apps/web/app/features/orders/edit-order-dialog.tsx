import {
	Button,
	Calendar,
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
	toast,
} from '@full-stack-template/ui';
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enUS, es } from 'date-fns/locale';
import { type SubmitEvent, useCallback, useEffect, useState } from 'react';
import type { Order } from '@/features/.server/orders/order.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import {
	editOrderFormOptions,
	editOrderFormSchema,
	useAppForm,
} from '@/features/orders/edit-order.form';
import { useTRPC } from '@/features/trpc/trpc.context';

type EditOrderDialogProps = {
	order: Order | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditOrderDialog({
	order,
	open,
	onOpenChange,
}: EditOrderDialogProps) {
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: customers = [] } = useQuery(
		trpc.customers.getCustomers.queryOptions(),
	);
	const { data: products = [] } = useQuery(
		trpc.products.getProducts.queryOptions(),
	);
	const { data: assignableUsers = [] } = useQuery(
		trpc.users.getAssignableUsers.queryOptions(),
	);

	const updateMutation = useMutation(
		trpc.orders.updateOrder.mutationOptions({
			onError: () => {
				toast.error(m.editOrderFailed());
			},
			onSuccess: () => {
				toast.success(m.editOrderSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const form = useAppForm({
		...editOrderFormOptions({
			customerId: order?.customerId ?? '',
			assignedToUserId: order?.assignedToUserId ?? null,
			deliveryAddress: order?.deliveryAddress ?? '',
			expectedDeliveryAt: order?.expectedDeliveryAt ?? new Date(),
			status: order?.status ?? 'pending',
			items: order?.items ?? [{ productId: '', quantity: 1, price: 0 }],
		}),
		onSubmit: async ({ value }) => {
			if (!order) return;

			const parsedValue = editOrderFormSchema.parse(value); // This should never fail since the form values are validated.
			updateMutation.mutate({
				id: order.id,
				customerId: parsedValue.customerId,
				assignedToUserId: parsedValue.assignedToUserId,
				deliveryAddress: parsedValue.deliveryAddress,
				expectedDeliveryAt: parsedValue.expectedDeliveryAt,
				status: parsedValue.status,
				items: parsedValue.items,
			});
		},
	});

	useEffect(() => {
		if (!order) return;

		form.reset({
			customerId: order.customerId,
			assignedToUserId: order.assignedToUserId,
			deliveryAddress: order.deliveryAddress,
			expectedDeliveryAt: order.expectedDeliveryAt,
			status: order.status,
			items: order.items.map((item) => ({
				productId: item.productId,
				quantity: String(item.quantity),
				price: String(item.price),
			})),
		});
	}, [order, form]);

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
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.editOrderTitle()}</DialogTitle>
					<DialogDescription>{m.editOrderDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FieldGroup>
						<form.Field name="customerId">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const selectedCustomer =
									customers.find(
										(customer) => customer.id === field.state.value,
									) ?? null;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderCustomer()}
										</FieldLabel>
										<div>
											<Combobox
												value={selectedCustomer}
												onValueChange={(value) =>
													field.handleChange(value?.id ?? '')
												}
												disabled={isLoading}
												items={customers}
												itemToStringLabel={(item) => item.name}
											>
												<ComboboxInput
													id={field.name}
													name={field.name}
													placeholder={m.orderCustomerPlaceholder()}
													aria-invalid={isInvalid}
													onBlur={() => field.handleBlur()}
												/>
												<ComboboxContent>
													<ComboboxEmpty>{m.noResults()}</ComboboxEmpty>
													<ComboboxList>
														{(item) => (
															<ComboboxItem key={item.id} value={item}>
																{item.name}
															</ComboboxItem>
														)}
													</ComboboxList>
												</ComboboxContent>
											</Combobox>
										</div>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="assignedToUserId">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const selectedUser =
									assignableUsers.find((u) => u.id === field.state.value) ||
									null;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderAssignedTo()}
										</FieldLabel>
										<div>
											<Combobox
												value={selectedUser}
												onValueChange={(val) =>
													field.handleChange(val?.id ?? null)
												}
												disabled={isLoading}
												items={assignableUsers}
												itemToStringLabel={(item) => item.name}
											>
												<ComboboxInput
													id={field.name}
													name={field.name}
													placeholder={m.orderAssignedToPlaceholder()}
													aria-invalid={isInvalid}
													onBlur={() => field.handleBlur()}
												/>
												<ComboboxContent>
													<ComboboxEmpty>{m.noResults()}</ComboboxEmpty>
													<ComboboxList>
														{(item) => (
															<ComboboxItem key={item.id} value={item}>
																{item.name}
															</ComboboxItem>
														)}
													</ComboboxList>
												</ComboboxContent>
											</Combobox>
										</div>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="deliveryAddress">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderDeliveryAddress()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.orderDeliveryAddressPlaceholder()}
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

						<form.Field name="expectedDeliveryAt">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderExpectedDelivery()}
										</FieldLabel>
										<Popover
											open={datePickerOpen}
											onOpenChange={setDatePickerOpen}
										>
											<PopoverTrigger
												render={
													<Button
														type="button"
														variant="outline"
														aria-invalid={isInvalid}
														disabled={isLoading}
														className="w-full justify-start font-normal"
													/>
												}
											>
												{field.state.value ? (
													new Intl.DateTimeFormat(getLocale(), {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													}).format(field.state.value)
												) : (
													<span className="text-muted-foreground">
														{m.orderExpectedDeliveryPlaceholder()}
													</span>
												)}
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													required={true}
													selected={field.state.value}
													defaultMonth={field.state.value}
													locale={getLocale() === 'es' ? es : enUS}
													onSelect={field.handleChange}
												/>
											</PopoverContent>
										</Popover>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="status">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderStatus()}
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={isLoading}
											itemToStringLabel={(item) => {
												switch (item) {
													case 'pending':
														return m.orderStatusPending();
													case 'in_progress':
														return m.orderStatusInProgress();
													case 'completed':
														return m.orderStatusCompleted();
													default:
														return item;
												}
											}}
										>
											<SelectTrigger aria-invalid={isInvalid}>
												<SelectValue placeholder={m.orderStatusPlaceholder()} />
											</SelectTrigger>
											<SelectContent alignItemWithTrigger={false}>
												<SelectGroup>
													<SelectItem value="pending">
														{m.orderStatusPending()}
													</SelectItem>
													<SelectItem value="in_progress">
														{m.orderStatusInProgress()}
													</SelectItem>
													<SelectItem value="completed">
														{m.orderStatusCompleted()}
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{m.orderItems()}</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-7 gap-1.5 text-xs px-2"
								onClick={() =>
									form.pushFieldValue('items', {
										productId: '',
										quantity: '1',
										price: '',
									})
								}
								disabled={isLoading}
							>
								<HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
								{m.orderAddItem()}
							</Button>
						</div>

						<Separator />

						<form.Field name="items" mode="array">
							{(itemsField) => (
								<div className="space-y-4">
									{itemsField.state.value.map((_, index) => (
										<div
											key={`item-${
												// biome-ignore lint/suspicious/noArrayIndexKey: order items are positional
												index
											}`}
											className="rounded-lg border border-border p-4 space-y-3"
										>
											<div className="flex items-center justify-between">
												<p className="text-xs font-medium text-muted-foreground">
													#{index + 1}
												</p>
												{itemsField.state.value.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={() =>
															form.removeFieldValue('items', index)
														}
														disabled={isLoading}
													>
														<HugeiconsIcon
															icon={Delete02Icon}
															className="h-3.5 w-3.5"
														/>
													</Button>
												)}
											</div>

											<form.Field name={`items[${index}].productId`}>
												{(field) => {
													const isInvalid =
														field.state.meta.isTouched &&
														!field.state.meta.isValid;

													const selectedProduct =
														products.find(
															(product) => product.id === field.state.value,
														) ?? null;

													return (
														<Field data-invalid={isInvalid}>
															<FieldLabel>{m.orderItemProduct()}</FieldLabel>
															<div>
																<Combobox
																	value={selectedProduct}
																	onValueChange={(value) =>
																		field.handleChange(value?.id ?? '')
																	}
																	disabled={isLoading}
																	items={products}
																	itemToStringLabel={(item) => item.name}
																>
																	<ComboboxInput
																		id={field.name}
																		name={field.name}
																		placeholder={m.orderItemProductPlaceholder()}
																		aria-invalid={isInvalid}
																		onBlur={() => field.handleBlur()}
																	/>
																	<ComboboxContent>
																		<ComboboxEmpty>
																			{m.noResults()}
																		</ComboboxEmpty>
																		<ComboboxList>
																			{(item) => (
																				<ComboboxItem
																					key={item.id}
																					value={item}
																				>
																					{item.name}
																				</ComboboxItem>
																			)}
																		</ComboboxList>
																	</ComboboxContent>
																</Combobox>
															</div>
															<FieldError errors={field.state.meta.errors} />
														</Field>
													);
												}}
											</form.Field>

											<div className="grid grid-cols-2 gap-3">
												<form.Field name={`items[${index}].quantity`}>
													{(field) => {
														const isInvalid =
															field.state.meta.isTouched &&
															!field.state.meta.isValid;

														return (
															<Field data-invalid={isInvalid}>
																<FieldLabel htmlFor={field.name}>
																	{m.orderItemQuantity()}
																</FieldLabel>
																<Input
																	id={field.name}
																	name={field.name}
																	type="number"
																	min="1"
																	step="1"
																	placeholder={m.orderItemQuantityPlaceholder()}
																	aria-invalid={isInvalid}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																	onBlur={() => field.handleBlur()}
																	disabled={isLoading}
																/>
																<FieldError errors={field.state.meta.errors} />
															</Field>
														);
													}}
												</form.Field>

												<form.Field name={`items[${index}].price`}>
													{(field) => {
														const isInvalid =
															field.state.meta.isTouched &&
															!field.state.meta.isValid;

														return (
															<Field data-invalid={isInvalid}>
																<FieldLabel htmlFor={field.name}>
																	{m.orderItemPrice()}
																</FieldLabel>
																<Input
																	id={field.name}
																	name={field.name}
																	type="number"
																	min="0"
																	step="50"
																	placeholder={m.orderItemPricePlaceholder()}
																	aria-invalid={isInvalid}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																	onBlur={() => field.handleBlur()}
																	disabled={isLoading}
																/>
																<FieldError errors={field.state.meta.errors} />
															</Field>
														);
													}}
												</form.Field>
											</div>
										</div>
									))}
								</div>
							)}
						</form.Field>
					</div>

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
