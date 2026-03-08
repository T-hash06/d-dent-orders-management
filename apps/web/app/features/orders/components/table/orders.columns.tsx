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
	ArrowUpIcon,
	Delete02Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/features/.server/orders/order.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import { getOrderStatusIcon } from '@/features/orders/utils/order-status-icon';

type OrderColumnsProps = {
	onEdit: (order: Order) => void;
	onDelete: (order: Order) => void;
	onStatusChange: (order: Order, status: OrderStatus) => void;
};

export function getOrderColumns({
	onEdit,
	onDelete,
	onStatusChange,
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
			accessorKey: 'customer',
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
			cell: ({ row }) => {
				const status = row.original.status;
				const label =
					status === 'pending'
						? m.orderStatusPending()
						: status === 'in_progress'
							? m.orderStatusInProgress()
							: m.orderStatusCompleted();

				const variant =
					status === 'completed'
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
			id: 'items',
			header: () => m.orderItems(),
			meta: {
				name: m.orderItems(),
			},
			cell: ({ row }) => {
				const items = row.original.items;
				return (
					<Badge variant="secondary" className="font-normal text-xs">
						{m.orderItemsCount({ count: String(items.length) })}
					</Badge>
				);
			},
		},
		{
			id: 'total',
			header: () => <div className="text-right">{m.orderTotal()}</div>,
			meta: {
				name: m.orderTotal(),
			},
			cell: ({ row }) => {
				const total = row.original.items.reduce(
					(sum, item) => sum + item.price * item.quantity,
					0,
				);
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
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				const order = row.original;
				const { user } = useSession();
				const userId = user?.id;
				const canChangeStatus = Boolean(
					userId && order.assignedToUserId === userId,
				);
				const currentStatus =
					order.status === 'completed'
						? m.orderStatusCompleted()
						: order.status === 'in_progress'
							? m.orderStatusInProgress()
							: m.orderStatusPending();

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
										onClick={() => onEdit(order)}
										className="cursor-pointer"
									>
										<HugeiconsIcon
											icon={PencilEdit01Icon}
											className="mr-2 h-4 w-4"
										/>
										{m.editOrder()}
									</DropdownMenuItem>
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
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
									)}
								</DropdownMenuGroup>
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
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
