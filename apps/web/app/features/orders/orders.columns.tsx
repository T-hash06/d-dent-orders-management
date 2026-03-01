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
	DropdownMenuSeparator,
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
import { m } from '@/features/i18n/paraglide/messages';

export type OrderItem = {
	id: string;
	orderId: string;
	productId: string;
	quantity: number;
	price: number;
};

export type OrderCustomer = {
	id: string;
	name: string;
	identifier: string;
	phone: string;
	address: string;
};

export type Order = {
	id: string;
	customerId: string;
	assignedToUserId: string | null;
	expectedDeliveryAt: Date;
	deliveryAddress: string;
	createdAt: Date;
	updatedAt: Date;
	createdById: string;
	updatedById: string;
	customer: OrderCustomer;
	items: OrderItem[];
};

type OrderColumnsProps = {
	onEdit: (order: Order) => void;
	onDelete: (order: Order) => void;
};

export function getOrderColumns({
	onEdit,
	onDelete,
}: OrderColumnsProps): ColumnDef<Order>[] {
	return [
		{
			id: 'select',
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
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground max-w-50 truncate block">
					{row.getValue('deliveryAddress')}
				</span>
			),
		},
		{
			accessorKey: 'expectedDeliveryAt',
			header: () => m.orderExpectedDelivery(),
			cell: ({ row }) => {
				const date = row.getValue('expectedDeliveryAt') as Date;
				const formatted = new Intl.DateTimeFormat('es-CO', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}).format(new Date(date));
				return <span className="text-sm tabular-nums">{formatted}</span>;
			},
		},
		{
			id: 'items',
			header: () => m.orderItems(),
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
							<DropdownMenuContent align="end" className="w-40">
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
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem
										onClick={() => onDelete(order)}
										className="cursor-pointer text-destructive focus:text-background focus:bg-destructive"
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
