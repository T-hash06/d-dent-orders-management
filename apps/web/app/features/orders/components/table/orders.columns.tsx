import {
	Badge,
	Button,
	Checkbox,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@full-stack-template/ui';
import {
	ArrowRight01Icon,
	ArrowUpIcon,
	CheckCircle,
	Clock01Icon,
	Delete02Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/features/.server/orders/order.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import type { OrderPaymentStatus } from '@/features/orders/domain/order-payment-status';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import {
	getOrderItemsCount,
	getOrderTotal,
} from '@/features/orders/utils/order-metrics';
import { getOrderStatusIcon } from '@/features/orders/utils/order-status-icon';

type OrderColumnsProps = {
	onView: (order: Order) => void;
	onEdit: (order: Order) => void;
	onDelete: (order: Order) => void;
	onStatusChange: (order: Order, status: OrderStatus) => void;
	onPaymentStatusChange: (
		order: Order,
		paymentStatus: OrderPaymentStatus,
	) => void;
};

const ORDER_STATUS_SORT_ORDER: Record<OrderStatus, number> = {
	pending: 0,
	in_progress: 1,
	completed: 2,
	cancelled: 3,
};

const ORDER_PAYMENT_STATUS_SORT_ORDER: Record<OrderPaymentStatus, number> = {
	pending: 0,
	paid: 1,
};

export function getOrderColumns({
	onView,
	onEdit,
	onDelete,
	onStatusChange,
	onPaymentStatusChange,
}: OrderColumnsProps): ColumnDef<Order>[] {
	return [
		{
			id: 'select',
			meta: {
				name: m.selectAll(),
			},
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					indeterminate={
						table.getIsSomePageRowsSelected() &&
						!table.getIsAllPageRowsSelected()
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label={m.selectAll()}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label={m.selectRow()}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorFn: (row) =>
				[row.customer?.name, row.customer?.identifier]
					.filter(Boolean)
					.join(' '),
			id: 'customer',
			meta: {
				name: m.orderCustomer(),
			},
			enableHiding: false,
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8 gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					{m.orderCustomer()}
					<HugeiconsIcon
						icon={ArrowUpIcon}
						data-asc-sorted={column.getIsSorted() === 'asc' ? true : undefined}
						className={cn(
							'h-3.5 w-3.5 transition-all data-asc-sorted:rotate-180',
						)}
					/>
				</Button>
			),
			cell: ({ row }) => {
				const customer = row.original.customer;
				return (
					<div className="flex flex-col gap-0.5">
						<span className="font-medium text-sm">{customer?.name ?? '-'}</span>
						{customer?.identifier && (
							<span className="text-xs text-muted-foreground">
								{customer.identifier}
							</span>
						)}
					</div>
				);
			},
			sortingFn: (a, b) => {
				const nameA = a.original.customer?.name ?? '';
				const nameB = b.original.customer?.name ?? '';
				return nameA.localeCompare(nameB);
			},
		},
		{
			accessorKey: 'deliveryAddress',
			header: () => m.orderDeliveryAddress(),
			meta: {
				name: m.orderDeliveryAddress(),
			},
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground max-w-50 truncate block">
					{row.getValue('deliveryAddress')}
				</span>
			),
		},
		{
			accessorKey: 'status',
			header: () => m.orderStatus(),
			meta: {
				name: m.orderStatus(),
			},
			sortingFn: (a, b) =>
				ORDER_STATUS_SORT_ORDER[a.original.status] -
				ORDER_STATUS_SORT_ORDER[b.original.status],
			cell: ({ row }) => {
				const status = row.original.status;
				const label =
					status === 'pending'
						? m.orderStatusPending()
						: status === 'in_progress'
							? m.orderStatusInProgress()
							: status === 'completed'
								? m.orderStatusCompleted()
								: m.orderStatusCancelled();

				const variant =
					status === 'cancelled'
						? 'destructive'
						: status === 'completed'
							? 'default'
							: status === 'in_progress'
								? 'outline'
								: 'secondary';

				return (
					<Badge variant={variant} className="font-normal text-xs">
						{label}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'expectedDeliveryAt',
			header: () => m.orderExpectedDelivery(),
			meta: {
				name: m.orderExpectedDelivery(),
			},
			sortingFn: 'datetime',
			cell: ({ row }) => {
				const date = row.getValue<Date>('expectedDeliveryAt');
				const formatted = new Intl.DateTimeFormat(getLocale(), {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}).format(new Date(date));
				return (
					<div className="flex items-center gap-2">
						<span className="text-sm tabular-nums">{formatted}</span>
						{row.original.isLate && (
							<Badge variant="destructive" className="font-normal text-xs">
								{m.orderLate()}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorFn: (row) => getOrderItemsCount(row),
			id: 'items',
			header: () => m.orderItems(),
			meta: {
				name: m.orderItems(),
			},
			sortingFn: 'basic',
			cell: ({ row }) => {
				const itemsCount = row.getValue<number>('items');
				return (
					<Badge variant="secondary" className="font-normal text-xs">
						{m.orderItemsCount({ count: String(itemsCount) })}
					</Badge>
				);
			},
		},
		{
			accessorFn: (row) => getOrderTotal(row),
			id: 'total',
			header: () => <div className="text-right">{m.orderTotal()}</div>,
			meta: {
				name: m.orderTotal(),
			},
			sortingFn: 'basic',
			cell: ({ row }) => {
				const total = row.getValue<number>('total');
				const formatted = new Intl.NumberFormat('es-CO', {
					style: 'currency',
					currency: 'COP',
					minimumFractionDigits: 0,
				}).format(total);
				return (
					<div className="text-right font-medium tabular-nums text-sm">
						{formatted}
					</div>
				);
			},
		},
		{
			accessorKey: 'paymentStatus',
			header: () => m.orderPaymentStatus(),
			meta: {
				name: m.orderPaymentStatus(),
			},
			sortingFn: (a, b) =>
				ORDER_PAYMENT_STATUS_SORT_ORDER[a.original.paymentStatus] -
				ORDER_PAYMENT_STATUS_SORT_ORDER[b.original.paymentStatus],
			cell: ({ row }) => {
				const paymentStatus = row.original.paymentStatus;
				const label =
					paymentStatus === 'paid'
						? m.orderPaymentStatusPaid()
						: m.orderPaymentStatusPending();
				const variant = paymentStatus === 'paid' ? 'default' : 'secondary';

				return (
					<Badge variant={variant} className="font-normal text-xs">
						{label}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				const order = row.original;
				const canEdit = order.actions.canEdit;
				const canDelete = order.actions.canDelete;
				const canChangeStatus = order.actions.canUpdateStatus;
				const canCancelOrder = order.actions.canCancelOrder;
				const canChangePaymentStatus = order.actions.canUpdatePaymentStatus;
				const currentStatus =
					order.status === 'completed'
						? m.orderStatusCompleted()
						: order.status === 'in_progress'
							? m.orderStatusInProgress()
							: order.status === 'cancelled'
								? m.orderStatusCancelled()
								: m.orderStatusPending();
				const currentPaymentStatus =
					order.paymentStatus === 'paid'
						? m.orderPaymentStatusPaid()
						: m.orderPaymentStatusPending();

				return (
					<div className="flex justify-end">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="h-8 w-8" />
								}
							>
								<HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-max">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{m.orderActions()}</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => onView(order)}
										className="cursor-pointer"
									>
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											className="mr-2 h-4 w-4"
										/>
										{m.viewDetails()}
									</DropdownMenuItem>
									{canEdit && (
										<DropdownMenuItem
											onClick={() => onEdit(order)}
											className="cursor-pointer"
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="mr-2 h-4 w-4"
											/>
											{m.editOrder()}
										</DropdownMenuItem>
									)}
									{canChangeStatus && (
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												<HugeiconsIcon
													icon={getOrderStatusIcon(order.status)}
													className="mr-2 h-4 w-4"
												/>
												{currentStatus}
											</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent>
													<DropdownMenuRadioGroup
														value={order.status}
														onValueChange={(value) => {
															if (value !== order.status) {
																onStatusChange(order, value as OrderStatus);
															}
														}}
													>
														<DropdownMenuRadioItem value="pending">
															<HugeiconsIcon
																icon={getOrderStatusIcon('pending')}
																className="mr-2 h-4 w-4"
															/>
															{m.orderStatusPending()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="in_progress">
															<HugeiconsIcon
																icon={getOrderStatusIcon('in_progress')}
																className="mr-2 h-4 w-4"
															/>
															{m.orderStatusInProgress()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="completed">
															<HugeiconsIcon
																icon={getOrderStatusIcon('completed')}
																className="mr-2 h-4 w-4"
															/>
															{m.orderStatusCompleted()}
														</DropdownMenuRadioItem>
														{(canCancelOrder ||
															order.status === 'cancelled') && (
															<DropdownMenuRadioItem value="cancelled">
																<HugeiconsIcon
																	icon={getOrderStatusIcon('cancelled')}
																	className="mr-2 h-4 w-4"
																/>
																{m.orderStatusCancelled()}
															</DropdownMenuRadioItem>
														)}
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
									)}
									{canChangePaymentStatus && (
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												{/* TODO: replace with dedicated payment-status icon. */}
												<HugeiconsIcon
													icon={
														order.paymentStatus === 'paid'
															? CheckCircle
															: Clock01Icon
													}
													className="mr-2 h-4 w-4"
												/>
												{currentPaymentStatus}
											</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent>
													<DropdownMenuRadioGroup
														value={order.paymentStatus}
														onValueChange={(value) => {
															if (value !== order.paymentStatus) {
																onPaymentStatusChange(
																	order,
																	value as OrderPaymentStatus,
																);
															}
														}}
													>
														<DropdownMenuRadioItem value="pending">
															{/* TODO: replace with dedicated payment-status icon. */}
															<HugeiconsIcon
																icon={Clock01Icon}
																className="mr-2 h-4 w-4"
															/>
															{m.orderPaymentStatusPending()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="paid">
															{/* TODO: replace with dedicated payment-status icon. */}
															<HugeiconsIcon
																icon={CheckCircle}
																className="mr-2 h-4 w-4"
															/>
															{m.orderPaymentStatusPaid()}
														</DropdownMenuRadioItem>
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
									)}
								</DropdownMenuGroup>
								{canDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => onDelete(order)}
												className="cursor-pointer"
												variant="destructive"
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="mr-2 h-4 w-4"
												/>
												{m.deleteOrder()}
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
