import {
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
	ArrowRight01Icon,
	ArrowUpIcon,
	Delete02Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Customer } from '@/features/.server/customers/customer.types';
import { m } from '@/features/i18n/paraglide/messages';

type CustomerColumnsProps = {
	onView: (customer: Customer) => void;
	onEdit: (customer: Customer) => void;
	onDelete: (customer: Customer) => void;
};

export function getCustomerColumns({
	onView,
	onEdit,
	onDelete,
}: CustomerColumnsProps): ColumnDef<Customer>[] {
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
			meta: {
				name: m.selectAll(),
			},
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8 gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					{m.customerName()}
					<HugeiconsIcon
						icon={ArrowUpIcon}
						data-asc-sorted={column.getIsSorted() === 'asc' ? true : undefined}
						className={cn(
							'h-3.5 w-3.5 transition-all data-asc-sorted:rotate-180',
						)}
					/>
				</Button>
			),
			cell: ({ row }) => (
				<span className="font-medium text-sm">{row.getValue('name')}</span>
			),
			meta: {
				name: m.customerName(),
			},
		},
		{
			accessorKey: 'identifier',
			header: () => m.customerIdentifier(),
			cell: ({ row }) => (
				<span className="text-sm tabular-nums">
					{row.getValue('identifier')}
				</span>
			),
			meta: {
				name: m.customerIdentifier(),
			},
		},
		{
			accessorKey: 'phone',
			header: () => m.customerPhone(),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.getValue('phone')}
				</span>
			),
			meta: {
				name: m.customerPhone(),
			},
		},
		{
			accessorKey: 'address',
			header: () => m.customerAddress(),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground truncate max-w-50 block">
					{row.getValue('address')}
				</span>
			),
			meta: {
				name: m.customerAddress(),
			},
		},
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				const customer = row.original;
				const canEdit = customer.actions.canEdit;
				const canDelete = customer.actions.canDelete;

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
									<DropdownMenuLabel>{m.customerActions()}</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => onView(customer)}
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
											onClick={() => onEdit(customer)}
											className="cursor-pointer"
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="mr-2 h-4 w-4"
											/>
											{m.editCustomer()}
										</DropdownMenuItem>
									)}
								</DropdownMenuGroup>
								{canDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => onDelete(customer)}
												className="cursor-pointer"
												variant="destructive"
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="mr-2 h-4 w-4"
												/>
												{m.deleteCustomer()}
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
			meta: {
				name: m.customerActions(),
			},
		},
	];
}
