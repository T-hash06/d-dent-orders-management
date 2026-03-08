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
} from '@/features/orders/forms/edit-order.form';
import {
	getOrderProductDisplayLabel,
	getOrderProductSearchLabel,
} from '@/features/orders/utils/order-product-label';
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
			paymentStatus: order?.paymentStatus ?? 'pending',
			items: order?.items ?? [
				{ productId: '', quantity: 1, price: 0, details: '' },
			],
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
				paymentStatus: parsedValue.paymentStatus,
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
			paymentStatus: order.paymentStatus,
			items: order.items.map((item) => ({
				productId: item.productId,
				quantity: String(item.quantity),
				price: String(item.price),
				details: item.details,
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
	const editableFields = order?.actions.editableFields;
	const canEditCustomerId = editableFields?.canEditCustomerId ?? false;
	const canEditAssignedToUserId =
		editableFields?.canEditAssignedToUserId ?? false;
	const canEditDeliveryAddress =
		editableFields?.canEditDeliveryAddress ?? false;
	const canEditExpectedDeliveryAt =
		editableFields?.canEditExpectedDeliveryAt ?? false;
	const canEditStatus = editableFields?.canEditStatus ?? false;
	const canCancelOrder = editableFields?.canCancelOrder ?? false;
	const canEditPaymentStatus = editableFields?.canEditPaymentStatus ?? false;
	const canEditItemProductId = editableFields?.canEditItemProductId ?? false;
	const canEditItemQuantity = editableFields?.canEditItemQuantity ?? false;
	const canEditItemPrice = editableFields?.canEditItemPrice ?? false;
	const canEditItemDetails = editableFields?.canEditItemDetails ?? false;
	const canAddItems = editableFields?.canAddItems ?? false;
	const canRemoveItems = editableFields?.canRemoveItems ?? false;
	const canSubmitChanges = [
		canEditCustomerId,
		canEditAssignedToUserId,
		canEditDeliveryAddress,
		canEditExpectedDeliveryAt,
		canEditStatus,
		canCancelOrder,
		canEditPaymentStatus,
		canEditItemProductId,
		canEditItemQuantity,
		canEditItemPrice,
		canEditItemDetails,
		canAddItems,
		canRemoveItems,
	].some(Boolean);

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
												onValueChange={(value) => {
													field.handleChange(value?.id ?? '');
													if (value?.address) {
														form.setFieldValue(
															'deliveryAddress',
															value.address,
															{
																dontUpdateMeta: true,
															},
														);
													}
												}}
												disabled={isLoading || !canEditCustomerId}
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
												disabled={isLoading || !canEditAssignedToUserId}
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
											disabled={isLoading || !canEditDeliveryAddress}
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
														disabled={isLoading || !canEditExpectedDeliveryAt}
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
											disabled={
												isLoading || (!canEditStatus && !canCancelOrder)
											}
											itemToStringLabel={(item) => {
												switch (item) {
													case 'pending':
														return m.orderStatusPending();
													case 'in_progress':
														return m.orderStatusInProgress();
													case 'completed':
														return m.orderStatusCompleted();
													case 'cancelled':
														return m.orderStatusCancelled();
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
													{(canCancelOrder ||
														order?.status === 'cancelled') && (
														<SelectItem value="cancelled">
															{m.orderStatusCancelled()}
														</SelectItem>
													)}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="paymentStatus">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.orderPaymentStatus()}
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={isLoading || !canEditPaymentStatus}
											itemToStringLabel={(item) => {
												switch (item) {
													case 'pending':
														return m.orderPaymentStatusPending();
													case 'paid':
														return m.orderPaymentStatusPaid();
													default:
														return item;
												}
											}}
										>
											<SelectTrigger aria-invalid={isInvalid}>
												<SelectValue
													placeholder={m.orderPaymentStatusPlaceholder()}
												/>
											</SelectTrigger>
											<SelectContent alignItemWithTrigger={false}>
												<SelectGroup>
													<SelectItem value="pending">
														{m.orderPaymentStatusPending()}
													</SelectItem>
													<SelectItem value="paid">
														{m.orderPaymentStatusPaid()}
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
								className="h-10 sm:h-7 gap-1.5 text-xs px-2"
								onClick={() =>
									form.pushFieldValue('items', {
										productId: '',
										quantity: '1',
										price: '',
										details: '',
									})
								}
								disabled={isLoading || !canAddItems}
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
											className="rounded-lg border border-border p-4"
										>
											<div className="mb-3 flex items-center justify-between">
												<p className="text-xs font-medium text-muted-foreground">
													#{index + 1}
												</p>
												{itemsField.state.value.length > 1 &&
													canRemoveItems && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-11 w-11 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={() =>
																form.removeFieldValue('items', index)
															}
															disabled={isLoading || !canRemoveItems}
														>
															<HugeiconsIcon
																icon={Delete02Icon}
																className="h-3.5 w-3.5"
															/>
														</Button>
													)}
											</div>

											<div className="grid gap-3 md:grid-cols-12 md:items-start">
												<div className="md:col-span-7">
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
																	<FieldLabel>
																		{m.orderItemProduct()}
																	</FieldLabel>
																	<div>
																		<Combobox
																			value={selectedProduct}
																			onValueChange={(value) => {
																				field.handleChange(value?.id ?? '');
																				if (canEditItemPrice) {
																					form.setFieldValue(
																						`items[${index}].price` as const,
																						value ? String(value.price) : '',
																						{ dontUpdateMeta: true },
																					);
																				}
																			}}
																			disabled={
																				isLoading || !canEditItemProductId
																			}
																			items={products}
																			filter={(item, query) =>
																				getOrderProductSearchLabel(item)
																					.toLowerCase()
																					.includes(query.trim().toLowerCase())
																			}
																			itemToStringLabel={(item) =>
																				getOrderProductDisplayLabel(item)
																			}
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
																							{getOrderProductDisplayLabel(
																								item,
																							)}
																						</ComboboxItem>
																					)}
																				</ComboboxList>
																			</ComboboxContent>
																		</Combobox>
																	</div>
																	<FieldError
																		errors={field.state.meta.errors}
																	/>
																</Field>
															);
														}}
													</form.Field>
												</div>

												<div className="grid gap-3 sm:grid-cols-2 md:col-span-5">
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
																		disabled={isLoading || !canEditItemQuantity}
																	/>
																	<FieldError
																		errors={field.state.meta.errors}
																	/>
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
																		disabled={isLoading || !canEditItemPrice}
																	/>
																	<FieldError
																		errors={field.state.meta.errors}
																	/>
																</Field>
															);
														}}
													</form.Field>
												</div>

												<div className="md:col-span-12">
													<form.Field name={`items[${index}].details`}>
														{(field) => {
															const isInvalid =
																field.state.meta.isTouched &&
																!field.state.meta.isValid;

															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={field.name}>
																		{m.orderItemDetails()}
																	</FieldLabel>
																	<Input
																		id={field.name}
																		name={field.name}
																		placeholder={m.orderItemDetailsPlaceholder()}
																		aria-invalid={isInvalid}
																		value={field.state.value}
																		onChange={(e) =>
																			field.handleChange(e.target.value)
																		}
																		onBlur={() => field.handleBlur()}
																		disabled={isLoading || !canEditItemDetails}
																	/>
																	<FieldError
																		errors={field.state.meta.errors}
																	/>
																</Field>
															);
														}}
													</form.Field>
												</div>
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
						<Button type="submit" disabled={isLoading || !canSubmitChanges}>
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
