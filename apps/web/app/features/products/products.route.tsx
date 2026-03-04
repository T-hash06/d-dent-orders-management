import {
	Button,
	Card,
	CardContent,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Empty,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@full-stack-template/ui';
import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	FilterHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import {
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { Product } from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { CreateProductDialog } from '@/features/products/create-product-dialog';
import { DeleteProductDialog } from '@/features/products/delete-product-dialog';
import { EditProductDialog } from '@/features/products/edit-product-dialog';
import { getProductColumns } from '@/features/products/products.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

export default function ProductsRoute() {
	const trpc = useTRPC();
	const { data: products = [], isLoading } = useQuery(
		trpc.products.getProducts.queryOptions(),
	);

	const productsCount = products.length;
	const productsWithPrice = products.filter(
		(product) => Number(product.price) > 0,
	).length;
	const averagePrice =
		productsCount > 0
			? products.reduce((sum, product) => sum + Number(product.price), 0) /
				productsCount
			: 0;
	const formattedAveragePrice = new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
	}).format(averagePrice);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const [editProduct, setEditProduct] = useState<Product | null>(null);
	const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

	const columns = getProductColumns({
		onEdit: (product) => setEditProduct(product),
		onDelete: (product) => setDeleteProduct(product),
	});

	const table = useReactTable({
		data: products,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-0.5">
						<h1 className="text-2xl font-bold tracking-tight">
							{m.productsTitle()}
						</h1>
						<p className="text-sm text-muted-foreground">
							{m.productsDescription()}
						</p>
					</div>
					<CreateProductDialog />
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardContent className="p-4 space-y-1">
							<p className="text-xs text-muted-foreground">
								{m.productsTotalStat()}
							</p>
							<p className="text-2xl font-semibold">{productsCount}</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 space-y-1">
							<p className="text-xs text-muted-foreground">
								{m.productsAvgPriceStat()}
							</p>
							<p className="text-2xl font-semibold tabular-nums">
								{formattedAveragePrice}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 space-y-1">
							<p className="text-xs text-muted-foreground">
								{m.productsWithPriceStat()}
							</p>
							<p className="text-2xl font-semibold">{productsWithPrice}</p>
						</CardContent>
					</Card>
				</div>

				<div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Input
						placeholder={m.productsSearchPlaceholder()}
						value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
						onChange={(event) =>
							table.getColumn('name')?.setFilterValue(event.target.value)
						}
						className="w-full sm:max-w-xs h-8 text-sm"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-2 sm:ml-auto"
								/>
							}
						>
							<HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4" />
							{m.productsColumns()}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								{table
									.getAllColumns()
									.filter((col) => col.getCanHide())
									.map((col) => (
										<DropdownMenuCheckboxItem
											key={col.id}
											className="capitalize"
											checked={col.getIsVisible()}
											onCheckedChange={(value) => col.toggleVisibility(!!value)}
										>
											{col.columnDef.meta?.name ?? col.id}
										</DropdownMenuCheckboxItem>
									))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="overflow-hidden rounded-lg border border-border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									{columns.map((col, colIdx) => (
										<TableCell key={`${col.id ?? colIdx}`}>
											<Skeleton className="h-5 w-full rounded" />
										</TableCell>
									))}
								</TableRow>
							) : table.getRowModel().rows.length > 0 ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && 'selected'}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-32 text-center"
									>
										<Empty className="py-6">
											<p className="text-sm font-medium text-foreground">
												{m.noProductsTitle()}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{m.noProductsDescription()}
											</p>
										</Empty>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground flex-1">
						{table.getFilteredSelectedRowModel().rows.length > 0
							? m.productRowsSelected({
									selected: String(
										table.getFilteredSelectedRowModel().rows.length,
									),
									total: String(table.getFilteredRowModel().rows.length),
								})
							: null}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								className="h-3.5 w-3.5 mr-1"
							/>
							{m.productPrevious()}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							{m.productNext()}
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								className="h-3.5 w-3.5 ml-1"
							/>
						</Button>
					</div>
				</div>
			</div>

			<EditProductDialog
				product={editProduct}
				open={editProduct !== null}
				onOpenChange={(open) => {
					if (!open) setEditProduct(null);
				}}
			/>
			<DeleteProductDialog
				product={deleteProduct}
				open={deleteProduct !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteProduct(null);
				}}
			/>
		</div>
	);
}
