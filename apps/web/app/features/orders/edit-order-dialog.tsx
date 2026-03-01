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
	Separator,
	Spinner,
	toast,
} from '@full-stack-template/ui';
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useEffect, useState } from 'react';
import { m } from '@/features/i18n/paraglide/messages';
import {
	editOrderFormOptions,
	useAppForm,
} from '@/features/orders/edit-order.form';
import type { Order } from '@/features/orders/orders.columns';
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
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: customers = [] } = useQuery(
		trpc.customers.getCustomers.queryOptions(),
	);
	const { data: products = [] } = useQuery(
		trpc.products.getProducts.queryOptions(),
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
			deliveryAddress: order?.deliveryAddress ?? '',
			expectedDeliveryAt: order?.expectedDeliveryAt ?? new Date(),
			items: order?.items ?? [{ productId: '', quantity: 1, price: 0 }],
		}),
		onSubmit: async ({ value }) => {
			if (!order) return;
			updateMutation.mutate({
				id: order.id,
				customerId: value.customerId,
				deliveryAddress: value.deliveryAddress,
				expectedDeliveryAt: new Date(value.expectedDeliveryAt),
				items: value.items.map((item) => ({
					productId: item.productId,
					quantity: Number(item.quantity),
					price: Number(item.price),
				})),
			});
		},
	});

	useEffect(() => {
		if (order) {
			form.reset({
				customerId: order.customerId,
				deliveryAddress: order.deliveryAddress,
				expectedDeliveryAt: new Date(order.expectedDeliveryAt)
					.toISOString()
					.substring(0, 10),
				items: order.items.map((item) => ({
					productId: item.productId,
					quantity: String(item.quantity),
					price: String(item.price),
				})),
			});
		}
	}, [order, form]);

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await form.handleSubmit();
		},
		[form],
	);

	const isLoading = updateMutation.isPending;
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.editOrderTitle()}</DialogTitle>
					<DialogDescription>{m.editOrderDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<FieldGroup className="space-y-4">
						{/* Customer */}
						<form.Field name="customerId">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>{m.orderCustomer()}</FieldLabel>
										<Combobox
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val ?? '')}
											disabled={isLoading}
										>
											<ComboboxInput
												placeholder={m.orderCustomerPlaceholder()}
												aria-invalid={isInvalid}
												onBlur={() => field.handleBlur()}
												className="w-full"
											/>
											<ComboboxContent>
												<ComboboxList>
													<ComboboxEmpty>{m.noResults()}</ComboboxEmpty>
													{customers.map((c) => (
														<ComboboxItem key={c.id} value={c.id}>
															{c.name}
														</ComboboxItem>
													))}
												</ComboboxList>
											</ComboboxContent>
										</Combobox>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						{/* Delivery Address */}
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

						{/* Expected Delivery Date */}
						<form.Field name="expectedDeliveryAt">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const parseLocalDate = (str: string) => {
									const [y, mo, d] = str.split('-').map(Number);
									return new Date(y, mo - 1, d);
								};
								const selectedDate = field.state.value
									? parseLocalDate(field.state.value)
									: undefined;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>{m.orderExpectedDelivery()}</FieldLabel>
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
												{selectedDate ? (
													new Intl.DateTimeFormat(undefined, {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													}).format(selectedDate)
												) : (
													<span className="text-muted-foreground">
														{m.orderExpectedDeliveryPlaceholder()}
													</span>
												)}
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={selectedDate}
													defaultMonth={selectedDate}
													onSelect={(date) => {
														if (date) {
															const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
															field.handleChange(iso);
														} else {
															field.handleChange('');
														}
														field.handleBlur();
														setDatePickerOpen(false);
													}}
												/>
											</PopoverContent>
										</Popover>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					{/* Order Items */}
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
													return (
														<Field data-invalid={isInvalid}>
															<FieldLabel>{m.orderItemProduct()}</FieldLabel>
															<Combobox
																value={field.state.value}
																onValueChange={(val) =>
																	field.handleChange(val ?? '')
																}
																disabled={isLoading}
															>
																<ComboboxInput
																	placeholder={m.orderItemProductPlaceholder()}
																	aria-invalid={isInvalid}
																	onBlur={() => field.handleBlur()}
																	className="w-full"
																/>
																<ComboboxContent>
																	<ComboboxList>
																		<ComboboxEmpty>
																			{m.noResults()}
																		</ComboboxEmpty>
																		{products.map((p) => (
																			<ComboboxItem key={p.id} value={p.id}>
																				{p.name} — {p.variant}
																			</ComboboxItem>
																		))}
																	</ComboboxList>
																</ComboboxContent>
															</Combobox>
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
																	step="0.01"
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
