import {
	Button,
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
	toast,
} from '@full-stack-template/ui';
import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	FilterHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import type { Order } from '@/features/.server/orders/order.types';
import { m } from '@/features/i18n/paraglide/messages';
import { CreateOrderDialog } from '@/features/orders/create-order-dialog';
import { DeleteOrderDialog } from '@/features/orders/delete-order-dialog';
import { EditOrderDialog } from '@/features/orders/edit-order-dialog';
import { getOrderColumns } from '@/features/orders/orders.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

interface OrderStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: Record<string, boolean>;
	editOrder: Order | null;
	deleteOrder: Order | null;
}

interface OrderStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setEditOrder: (order: Order | null) => void;
	setDeleteOrder: (order: Order | null) => void;
}

const useOrderStore = create<OrderStoreState & OrderStoreActions>((set) => ({
	sorting: [],
	columnFilters: [],
	columnVisibility: {},
	rowSelection: {},
	editOrder: null,
	deleteOrder: null,
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
				typeof updater === 'function' ? updater(state.columnFilters) : updater;
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
	setEditOrder: (editOrder) => set({ editOrder }),
	setDeleteOrder: (deleteOrder) => set({ deleteOrder }),
}));

const emptyOrdersFallback: Order[] = [];

const OrdersRouteHeader = () => (
	<PageHeader
		title={m.ordersTitle()}
		description={m.ordersDescription()}
		action={<CreateOrderDialog />}
	/>
);

const OrdersRouteStats = () => {
	const trpc = useTRPC();
	const { data: orders = emptyOrdersFallback } = useQuery(
		trpc.orders.getOrders.queryOptions(),
	);

	const pendingOrders = orders.filter(
		(order) => order.status === 'pending',
	).length;
	const inProgressOrders = orders.filter(
		(order) => order.status === 'in_progress',
	).length;
	const lateOrders = orders.filter((order) => order.isLate).length;

	return (
		<StatBar
			stats={[
				{ label: m.ordersPendingStat(), value: pendingOrders },
				{ label: m.ordersInProgressStat(), value: inProgressOrders },
				{ label: m.ordersLateStat(), value: lateOrders },
			]}
		/>
	);
};

const OrdersRouteTable = () => {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: orders = emptyOrdersFallback, isLoading } = useQuery(
		trpc.orders.getOrders.queryOptions(),
	);

	const [
		sorting,
		columnFilters,
		columnVisibility,
		rowSelection,
		setSorting,
		setColumnFilters,
		setColumnVisibility,
		setRowSelection,
		setEditOrder,
		setDeleteOrder,
	] = useOrderStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.rowSelection,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setRowSelection,
			store.setEditOrder,
			store.setDeleteOrder,
		]),
	);

	const completeMutation = useMutation(
		trpc.orders.completeOrder.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.orders.getOrders.queryKey(),
				);

				queryClient.setQueryData(
					trpc.orders.getOrders.queryKey(),
					(old: Order[] | undefined) =>
						(old ?? []).map((o) =>
							o.id === variables.orderId ? { ...o, status: 'completed' } : o,
						),
				);

				return { previous };
			},
			onError: (error, _vars, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.orders.getOrders.queryKey(),
						context.previous,
					);
				}

				toast.error(
					error.data?.zodError?.orderId.message ?? m.completeOrderFailed(),
				);
			},
			onSuccess: () => {
				toast.success(m.completeOrderSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});
			},
		}),
	);

	const columns = useMemo(
		() =>
			getOrderColumns({
				onEdit: (order: Order) => setEditOrder(order),
				onDelete: (order: Order) => setDeleteOrder(order),
				onComplete: (order: Order) => {
					completeMutation.mutate({ orderId: order.id });
				},
			}),
		[setEditOrder, setDeleteOrder, completeMutation.mutate],
	);

	const table = useReactTable({
		data: orders,
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
					placeholder={m.ordersSearchPlaceholder()}
					value={
						(table.getColumn('customer')?.getFilterValue() as string) ?? ''
					}
					onChange={(event) =>
						table.getColumn('customer')?.setFilterValue(event.target.value)
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
						{m.ordersColumns()}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-max">
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
									<TableCell key={`${(col as { id?: string }).id ?? colIdx}`}>
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
											{m.noOrdersTitle()}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{m.noOrdersDescription()}
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
						? m.orderRowsSelected({
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
						{m.orderPrevious()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						{m.orderNext()}
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

const OrderDialogs = () => {
	const [editOrder, deleteOrder, setEditOrder, setDeleteOrder] = useOrderStore(
		useShallow((store) => [
			store.editOrder,
			store.deleteOrder,
			store.setEditOrder,
			store.setDeleteOrder,
		]),
	);

	return (
		<>
			<EditOrderDialog
				order={editOrder}
				open={editOrder !== null}
				onOpenChange={(open) => {
					if (!open) setEditOrder(null);
				}}
			/>
			<DeleteOrderDialog
				order={deleteOrder}
				open={deleteOrder !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteOrder(null);
				}}
			/>
		</>
	);
};

export default function OrdersRoute() {
	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 md:py-7 space-y-5">
				<OrdersRouteHeader />

				<OrdersRouteStats />

				<OrdersRouteTable />
			</div>

			<OrderDialogs />
		</div>
	);
}
