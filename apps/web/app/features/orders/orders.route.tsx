import {
	Button,
	Calendar,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Empty,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Switch,
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
	Trash,
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
import { enUS, es } from 'date-fns/locale';
import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/layout/page-header';
import { StatBar } from '@/components/ui/stat-bar';
import type { Order } from '@/features/.server/orders/order.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import { CreateOrderDialog } from '@/features/orders/components/dialogs/create-order-dialog';
import { DeleteOrderDialog } from '@/features/orders/components/dialogs/delete-order-dialog';
import { EditOrderDialog } from '@/features/orders/components/dialogs/edit-order-dialog';
import { getOrderColumns } from '@/features/orders/components/table/orders.columns';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import { useTRPC } from '@/features/trpc/trpc.context';

interface OrderStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: Record<string, boolean>;
	lateOnly: boolean;
	statusFilter: OrderStatus | null;
	expectedDeliveryFrom: Date | null;
	expectedDeliveryTo: Date | null;
	editOrder: Order | null;
	deleteOrder: Order | null;
}

interface OrderStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setLateOnly: (lateOnly: boolean) => void;
	setStatusFilter: (status: OrderStatus | null) => void;
	setExpectedDeliveryRange: (from: Date | null, to: Date | null) => void;
	setEditOrder: (order: Order | null) => void;
	setDeleteOrder: (order: Order | null) => void;
}

const useOrderStore = create<OrderStoreState & OrderStoreActions>((set) => ({
	sorting: [],
	columnFilters: [],
	columnVisibility: {},
	rowSelection: {},
	lateOnly: false,
	statusFilter: null,
	expectedDeliveryFrom: null,
	expectedDeliveryTo: null,
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
	setLateOnly: (lateOnly) => set({ lateOnly }),
	setStatusFilter: (statusFilter) => set({ statusFilter }),
	setExpectedDeliveryRange: (expectedDeliveryFrom, expectedDeliveryTo) =>
		set({ expectedDeliveryFrom, expectedDeliveryTo }),
	setEditOrder: (editOrder) => set({ editOrder }),
	setDeleteOrder: (deleteOrder) => set({ deleteOrder }),
}));

const emptyOrdersFallback: Order[] = [];

const OrdersRouteHeader = () => {
	const { permissions } = useSession();

	return (
		<PageHeader
			title={m.ordersTitle()}
			description={m.ordersDescription()}
			action={
				permissions.orders.includes('create') ? (
					<CreateOrderDialog />
				) : undefined
			}
		/>
	);
};

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
	const [
		sorting,
		columnFilters,
		columnVisibility,
		rowSelection,
		lateOnly,
		statusFilter,
		expectedDeliveryFrom,
		expectedDeliveryTo,
		setSorting,
		setColumnFilters,
		setColumnVisibility,
		setRowSelection,
		setLateOnly,
		setStatusFilter,
		setExpectedDeliveryRange,
		setEditOrder,
		setDeleteOrder,
	] = useOrderStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.rowSelection,
			store.lateOnly,
			store.statusFilter,
			store.expectedDeliveryFrom,
			store.expectedDeliveryTo,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setRowSelection,
			store.setLateOnly,
			store.setStatusFilter,
			store.setExpectedDeliveryRange,
			store.setEditOrder,
			store.setDeleteOrder,
		]),
	);

	const getOrdersQueryInput = useMemo(() => {
		if (
			!lateOnly &&
			statusFilter === null &&
			expectedDeliveryFrom === null &&
			expectedDeliveryTo === null
		) {
			return undefined;
		}

		const expectedDeliveryFromFilter = expectedDeliveryFrom
			? new Date(expectedDeliveryFrom)
			: null;
		expectedDeliveryFromFilter?.setHours(0, 0, 0, 0);

		const expectedDeliveryToFilter = expectedDeliveryTo
			? new Date(expectedDeliveryTo)
			: null;
		expectedDeliveryToFilter?.setHours(23, 59, 59, 999);

		return {
			lateOnly: lateOnly ? true : undefined,
			status: statusFilter ?? undefined,
			expectedDeliveryFrom: expectedDeliveryFromFilter?.toISOString(),
			expectedDeliveryTo: expectedDeliveryToFilter?.toISOString(),
		};
	}, [lateOnly, statusFilter, expectedDeliveryFrom, expectedDeliveryTo]);

	const getOrdersQueryKey = trpc.orders.getOrders.queryKey(getOrdersQueryInput);
	const { data: orders = emptyOrdersFallback, isLoading } = useQuery(
		trpc.orders.getOrders.queryOptions(getOrdersQueryInput),
	);

	const updateStatusMutation = useMutation(
		trpc.orders.updateOrderStatus.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: getOrdersQueryKey,
				});

				const previous = queryClient.getQueryData<Order[]>(getOrdersQueryKey);

				queryClient.setQueryData(
					getOrdersQueryKey,
					(old: Order[] | undefined) =>
						(old ?? []).map((o) =>
							o.id === variables.orderId
								? { ...o, status: variables.status }
								: o,
						),
				);

				return { previous };
			},
			onError: (error, _vars, context) => {
				if (context?.previous) {
					queryClient.setQueryData(getOrdersQueryKey, context.previous);
				}

				toast.error(
					error.data?.zodError?.orderId?.message ?? m.editOrderFailed(),
				);
			},
			onSuccess: () => {
				toast.success(m.editOrderSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});
			},
		}),
	);
	const locale = getLocale();
	const selectedExpectedDeliveryRange =
		expectedDeliveryFrom || expectedDeliveryTo
			? {
					from: expectedDeliveryFrom ?? undefined,
					to: expectedDeliveryTo ?? undefined,
				}
			: undefined;
	const formatDate = (date: Date) =>
		new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}).format(date);

	const columns = useMemo(
		() =>
			getOrderColumns({
				onEdit: (order: Order) => setEditOrder(order),
				onDelete: (order: Order) => setDeleteOrder(order),
				onStatusChange: (order: Order, status: OrderStatus) => {
					updateStatusMutation.mutate({ orderId: order.id, status });
				},
			}),
		[setEditOrder, setDeleteOrder, updateStatusMutation.mutate],
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
			<div className="rounded-lg border border-border bg-card p-3">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<Input
						placeholder={m.ordersSearchPlaceholder()}
						value={
							(table.getColumn('customer')?.getFilterValue() as string) ?? ''
						}
						onChange={(event) =>
							table.getColumn('customer')?.setFilterValue(event.target.value)
						}
						className="w-full text-sm lg:max-w-xs"
					/>
					<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:ml-auto">
						<Label className="cursor-pointer flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2 has-checked:border-primary has-checked:bg-primary/5 transition-colors">
							<Switch
								checked={lateOnly}
								onCheckedChange={setLateOnly}
								aria-label={m.orderLate()}
							/>
							<span className="text-sm text-foreground">{m.orderLate()}</span>
						</Label>
						<Select
							value={statusFilter ?? 'all'}
							onValueChange={(value) =>
								setStatusFilter(value === 'all' ? null : (value as OrderStatus))
							}
							itemToStringLabel={(item) => {
								switch (item) {
									case 'all':
										return m.orderStatus();
									case 'pending':
										return m.orderStatusPending();
									case 'in_progress':
										return m.orderStatusInProgress();
									case 'completed':
										return m.orderStatusCompleted();
									default:
										return item;
								}
							}}
						>
							<SelectTrigger className="w-full sm:w-45">
								<SelectValue placeholder={m.orderStatus()} />
							</SelectTrigger>
							<SelectContent alignItemWithTrigger={false}>
								<SelectGroup>
									<SelectItem value="all">{m.orderStatus()}</SelectItem>
									<SelectItem value="pending">
										{m.orderStatusPending()}
									</SelectItem>
									<SelectItem value="in_progress">
										{m.orderStatusInProgress()}
									</SelectItem>
									<SelectItem value="completed">
										{m.orderStatusCompleted()}
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<div className="flex items-center gap-1">
							<Popover>
								<PopoverTrigger
									className="relative"
									render={<div tabIndex={-1} className="w-full" />}
									nativeButton={false}
								>
									<Button
										type="button"
										variant="outline"
										className="w-full justify-start text-left font-normal sm:w-55"
									>
										{expectedDeliveryFrom ? (
											expectedDeliveryTo ? (
												`${formatDate(expectedDeliveryFrom)} - ${formatDate(expectedDeliveryTo)}`
											) : (
												`${formatDate(expectedDeliveryFrom)} -`
											)
										) : (
											<span className="text-muted-foreground">
												{m.orderExpectedDeliveryPlaceholder()}
											</span>
										)}
									</Button>
									<Button
										size="icon"
										className="absolute right-0 top-0"
										variant="ghost"
										onClick={(event) => {
											event.stopPropagation();
											setExpectedDeliveryRange(null, null);
										}}
										disabled={selectedExpectedDeliveryRange === undefined}
									>
										<HugeiconsIcon
											icon={Trash}
											className="size-4 text-destructive"
										/>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="range"
										selected={selectedExpectedDeliveryRange}
										defaultMonth={expectedDeliveryFrom ?? undefined}
										locale={locale === 'es' ? es : enUS}
										onSelect={(range) =>
											setExpectedDeliveryRange(
												range?.from ?? null,
												range?.to ?? null,
											)
										}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Button variant="outline" className="gap-2" />}
							>
								<HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" />
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
												onCheckedChange={(value) =>
													col.toggleVisibility(!!value)
												}
											>
												{col.columnDef.meta?.name ?? col.id}
											</DropdownMenuCheckboxItem>
										))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
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
