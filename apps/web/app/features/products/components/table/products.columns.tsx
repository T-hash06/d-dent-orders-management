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
} from '@d-dentaditamentos/ui';
import {
	ArrowRight01Icon,
	ArrowUpIcon,
	Delete02Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProductPreview } from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getProductCategoryLabel } from '@/features/products/domain/product-category';

type ProductColumnsProps = {
	onView: (product: ProductPreview) => void;
	onEdit: (product: ProductPreview) => void;
	onDelete: (product: ProductPreview) => void;
};

export function getProductColumns({
	onView,
	onEdit,
	onDelete,
}: ProductColumnsProps): ColumnDef<ProductPreview>[] {
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
					{m.productName()}
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
				name: m.productName(),
			},
		},
		{
			id: 'productCategory',
			accessorFn: (product) => getProductCategoryLabel(product),
			header: () => m.productCategory(),
			cell: ({ row }) => (
				<Badge variant="secondary" className="font-normal text-xs">
					{row.getValue('productCategory')}
				</Badge>
			),
			meta: {
				name: m.productCategory(),
			},
		},
		{
			accessorKey: 'variant',
			header: () => m.productVariant(),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.getValue('variant')}
				</span>
			),
			meta: {
				name: m.productVariant(),
			},
		},
		{
			accessorKey: 'price',
			header: () => <div className="text-right">{m.productPrice()}</div>,
			cell: ({ row }) => {
				const price = row.getValue<number>('price');
				const formatted = new Intl.NumberFormat('es-CO', {
					style: 'currency',
					currency: 'COP',
					minimumFractionDigits: 0,
				}).format(price);
				return (
					<div className="text-right font-medium tabular-nums text-sm">
						{formatted}
					</div>
				);
			},
			meta: {
				name: m.productPrice(),
			},
		},
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				const product = row.original;
				const canEdit = product.actions.canEdit;
				const canDelete = product.actions.canDelete;

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
									<DropdownMenuLabel>{m.productActions()}</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => onView(product)}
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
											onClick={() => onEdit(product)}
											className="cursor-pointer"
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="mr-2 h-4 w-4"
											/>
											{m.editProduct()}
										</DropdownMenuItem>
									)}
								</DropdownMenuGroup>
								{canDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => onDelete(product)}
												className="cursor-pointer text-destructive"
												variant="destructive"
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="mr-2 h-4 w-4 text-destructive"
												/>
												{m.deleteProduct()}
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
				name: m.productActions(),
			},
		},
	];
}
