import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Empty,
	Input,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@d-dentaditamentos/ui';
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
	type OnChangeFn,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/layout/page-header';
import { StatBar } from '@/components/ui/stat-bar';
import type {
	ProductCategory,
	ProductPreview,
} from '@/features/.server/products/product.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { CreateProductDialog } from '@/features/products/components/dialogs/create-product-dialog';
import { DeleteProductDialog } from '@/features/products/components/dialogs/delete-product-dialog';
import { EditProductDialog } from '@/features/products/components/dialogs/edit-product-dialog';
import { ViewProductDialog } from '@/features/products/components/dialogs/view-product-dialog';
import { getProductColumns } from '@/features/products/components/table/products.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

interface ProductStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: Record<string, boolean>;
	searchTerm: string;
	categoryIdFilter: string | null;
	viewProduct: ProductPreview | null;
	editProduct: ProductPreview | null;
	deleteProduct: ProductPreview | null;
}

interface ProductStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setSearchTerm: (searchTerm: string) => void;
	setCategoryIdFilter: (categoryIdFilter: string | null) => void;
	setViewProduct: (product: ProductPreview | null) => void;
	setEditProduct: (product: ProductPreview | null) => void;
	setDeleteProduct: (product: ProductPreview | null) => void;
}

const useProductStore = create<ProductStoreState & ProductStoreActions>(
	(set) => ({
		sorting: [],
		columnFilters: [],
		columnVisibility: {},
		rowSelection: {},
		searchTerm: '',
		categoryIdFilter: null,
		viewProduct: null,
		editProduct: null,
		deleteProduct: null,
		setSorting: (updater) => {
			set((state) => {
				const newSorting =
					typeof updater === 'function' ? updater(state.sorting) : updater;
				return { sorting: newSorting };
			});
		},
		setColumnFilters: (updater) => {
			set((state) => {
				const newColumnFilters =
					typeof updater === 'function'
						? updater(state.columnFilters)
						: updater;
				return { columnFilters: newColumnFilters };
			});
		},
		setColumnVisibility: (updater) => {
			set((state) => {
				const newColumnVisibility =
					typeof updater === 'function'
						? updater(state.columnVisibility)
						: updater;
				return { columnVisibility: newColumnVisibility };
			});
		},
		setRowSelection: (updater) => {
			set((state) => {
				const newRowSelection =
					typeof updater === 'function' ? updater(state.rowSelection) : updater;
				return { rowSelection: newRowSelection };
			});
		},
		setSearchTerm: (searchTerm) => set({ searchTerm }),
		setCategoryIdFilter: (categoryIdFilter) => set({ categoryIdFilter }),
		setViewProduct: (viewProduct) => set({ viewProduct }),
		setEditProduct: (editProduct) => set({ editProduct }),
		setDeleteProduct: (deleteProduct) => set({ deleteProduct }),
	}),
);

const emptyProductsFallback: ProductPreview[] = [];
const emptyProductCategoriesFallback: ProductCategory[] = [];

const ProductsRouteHeader = () => {
	const { roleCapabilities } = useSession();

	return (
		<PageHeader
			title={m.productsTitle()}
			description={m.productsDescription()}
			action={
				roleCapabilities.products.canCreate ? (
					<CreateProductDialog />
				) : undefined
			}
		/>
	);
};

const ProductsRouteStats = () => {
	const trpc = useTRPC();
	const { data: products = emptyProductsFallback } = useQuery(
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

	return (
		<StatBar
			stats={[
				{ label: m.productsTotalStat(), value: productsCount },
				{ label: m.productsAvgPriceStat(), value: formattedAveragePrice },
				{ label: m.productsWithPriceStat(), value: productsWithPrice },
			]}
		/>
	);
};

const ProductsRouteTable = () => {
	const trpc = useTRPC();
	const { data: productCategories = emptyProductCategoriesFallback } = useQuery(
		trpc.products.getProductCategories.queryOptions(),
	);

	const [
		sorting,
		columnFilters,
		columnVisibility,
		rowSelection,
		searchTerm,
		categoryIdFilter,
		setSorting,
		setColumnFilters,
		setColumnVisibility,
		setRowSelection,
		setSearchTerm,
		setCategoryIdFilter,
		setViewProduct,
		setEditProduct,
		setDeleteProduct,
	] = useProductStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.rowSelection,
			store.searchTerm,
			store.categoryIdFilter,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setRowSelection,
			store.setSearchTerm,
			store.setCategoryIdFilter,
			store.setViewProduct,
			store.setEditProduct,
			store.setDeleteProduct,
		]),
	);

	const getProductsQueryInput = useMemo(() => {
		const normalizedSearchTerm = searchTerm.trim();
		if (!normalizedSearchTerm && categoryIdFilter === null) {
			return undefined;
		}

		return {
			search: normalizedSearchTerm || undefined,
			categoryId: categoryIdFilter ?? undefined,
		};
	}, [searchTerm, categoryIdFilter]);
	const { data: products = emptyProductsFallback, isLoading } = useQuery(
		trpc.products.getProducts.queryOptions(getProductsQueryInput),
	);

	const columns = useMemo(
		() =>
			getProductColumns({
				onView: (product) => setViewProduct(product),
				onEdit: (product) => setEditProduct(product),
				onDelete: (product) => setDeleteProduct(product),
			}),
		[setViewProduct, setEditProduct, setDeleteProduct],
	);

	const table = useReactTable({
		data: products,
		columns,
		getRowId: (row) => row.id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<>
			<div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					placeholder={m.productsSearchPlaceholder()}
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					className="w-full sm:max-w-xs h-8 text-sm"
				/>
				<Select
					value={categoryIdFilter ?? 'all'}
					onValueChange={(value) =>
						setCategoryIdFilter(value === 'all' ? null : value)
					}
					itemToStringLabel={(item) =>
						item === 'all'
							? m.productCategory()
							: (productCategories.find((category) => category.id === item)
									?.name ?? item)
					}
				>
					<SelectTrigger className="w-full h-8 text-sm sm:w-48">
						<SelectValue placeholder={m.productCategory()} />
					</SelectTrigger>
					<SelectContent alignItemWithTrigger={false}>
						<SelectGroup>
							<SelectItem value="all">{m.productCategory()}</SelectItem>
							{productCategories.map((category) => (
								<SelectItem key={category.id} value={category.id}>
									{category.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
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

			<div className="overflow-x-auto rounded-lg border border-border">
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
				<p className="hidden sm:block text-sm text-muted-foreground flex-1">
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
		</>
	);
};

const ProductDialogs = () => {
	const [
		viewProduct,
		editProduct,
		deleteProduct,
		setViewProduct,
		setEditProduct,
		setDeleteProduct,
	] = useProductStore(
		useShallow((store) => [
			store.viewProduct,
			store.editProduct,
			store.deleteProduct,
			store.setViewProduct,
			store.setEditProduct,
			store.setDeleteProduct,
		]),
	);

	return (
		<>
			<ViewProductDialog
				product={viewProduct}
				open={viewProduct !== null}
				onOpenChange={(open) => {
					if (!open) setViewProduct(null);
				}}
			/>
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
		</>
	);
};

export default function ProductsRoute() {
	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 md:py-7 space-y-5">
				<ProductsRouteHeader />

				<ProductsRouteStats />

				<ProductsRouteTable />
			</div>

			<ProductDialogs />
		</div>
	);
}
