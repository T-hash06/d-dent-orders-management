import {
	Button,
	Calendar,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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
} from '@d-dentaditamentos/ui';
import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	FilterHorizontalIcon,
	Trash,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { rankItem } from '@tanstack/match-sorter-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type ColumnFiltersState,
	type FilterFn,
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
import { ViewOrderDialog } from '@/features/orders/components/dialogs/view-order-dialog';
import { getOrderColumns } from '@/features/orders/components/table/orders.columns';
import type { OrderPaymentStatus } from '@/features/orders/domain/order-payment-status';
import type { OrderShippingStatus } from '@/features/orders/domain/order-shipping-status';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import { useTRPC } from '@/features/trpc/trpc.context';

type OrderSortOption =
	| 'expected_delivery_asc'
	| 'expected_delivery_desc'
	| 'total_desc'
	| 'customer_asc'
	| 'status_asc';

const ORDER_SORTING_OPTIONS: Record<OrderSortOption, SortingState> = {
	expected_delivery_asc: [{ id: 'expectedDeliveryAt', desc: false }],
	expected_delivery_desc: [{ id: 'expectedDeliveryAt', desc: true }],
	total_desc: [{ id: 'total', desc: true }],
	customer_asc: [{ id: 'customer', desc: false }],
	status_asc: [{ id: 'status', desc: false }],
};

const DEFAULT_ORDER_SORT_OPTION: OrderSortOption = 'expected_delivery_asc';

const getSortingForOption = (option: OrderSortOption): SortingState =>
	ORDER_SORTING_OPTIONS[option].map((sort) => ({ ...sort }));

const getSortOptionFromSorting = (sorting: SortingState): OrderSortOption => {
	const currentSorting = sorting[0];

	if (!currentSorting) {
		return DEFAULT_ORDER_SORT_OPTION;
	}

	const matchedOption = (
		Object.entries(ORDER_SORTING_OPTIONS) as [OrderSortOption, SortingState][]
	).find(([, optionSorting]) => {
		const [firstSorting] = optionSorting;
		return (
			firstSorting?.id === currentSorting.id &&
			firstSorting.desc === currentSorting.desc
		);
	});

	return matchedOption?.[0] ?? DEFAULT_ORDER_SORT_OPTION;
};

interface OrderStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	globalFilter: string;
	rowSelection: Record<string, boolean>;
	lateOnly: boolean;
	statusFilter: OrderStatus | null;
	shippingStatusFilter: OrderShippingStatus | null;
	expectedDeliveryFrom: Date | null;
	expectedDeliveryTo: Date | null;
	isAdvancedFiltersOpen: boolean;
	viewOrder: Order | null;
	editOrder: Order | null;
	deleteOrder: Order | null;
}

interface OrderStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setGlobalFilter: OnChangeFn<string>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setLateOnly: (lateOnly: boolean) => void;
	setStatusFilter: (status: OrderStatus | null) => void;
	setShippingStatusFilter: (shippingStatus: OrderShippingStatus | null) => void;
	setExpectedDeliveryRange: (from: Date | null, to: Date | null) => void;
	setIsAdvancedFiltersOpen: (isAdvancedFiltersOpen: boolean) => void;
	setViewOrder: (order: Order | null) => void;
	setEditOrder: (order: Order | null) => void;
	setDeleteOrder: (order: Order | null) => void;
}

const useOrderStore = create<OrderStoreState & OrderStoreActions>((set) => ({
	sorting: getSortingForOption(DEFAULT_ORDER_SORT_OPTION),
	columnFilters: [],
	columnVisibility: {},
	globalFilter: '',
	rowSelection: {},
	lateOnly: false,
	statusFilter: null,
	shippingStatusFilter: null,
	expectedDeliveryFrom: null,
	expectedDeliveryTo: null,
	isAdvancedFiltersOpen: false,
	viewOrder: null,
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
	setGlobalFilter: (updater) => {
		set((state) => {
			const newGlobalFilter =
				typeof updater === 'function' ? updater(state.globalFilter) : updater;
			return { globalFilter: newGlobalFilter };
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
	setShippingStatusFilter: (shippingStatusFilter) =>
		set({ shippingStatusFilter }),
	setExpectedDeliveryRange: (expectedDeliveryFrom, expectedDeliveryTo) =>
		set({ expectedDeliveryFrom, expectedDeliveryTo }),
	setIsAdvancedFiltersOpen: (isAdvancedFiltersOpen) =>
		set({ isAdvancedFiltersOpen }),
	setViewOrder: (viewOrder) => set({ viewOrder }),
	setEditOrder: (editOrder) => set({ editOrder }),
	setDeleteOrder: (deleteOrder) => set({ deleteOrder }),
}));

const emptyOrdersFallback: Order[] = [];

const fuzzyFilter: FilterFn<Order> = (row, columnId, filterValue, addMeta) => {
	const itemRank = rankItem(
		String(row.getValue(columnId) ?? ''),
		String(filterValue ?? ''),
	);
	addMeta({ itemRank });
	return itemRank.passed;
};

const OrdersRouteHeader = () => {
	const { roleCapabilities } = useSession();

	return (
		<PageHeader
			title={m.ordersTitle()}
			description={m.ordersDescription()}
			action={
				roleCapabilities.orders.canCreate ? <CreateOrderDialog /> : undefined
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
		globalFilter,
		rowSelection,
		lateOnly,
		statusFilter,
		shippingStatusFilter,
		expectedDeliveryFrom,
		expectedDeliveryTo,
		isAdvancedFiltersOpen,
		setSorting,
		setColumnFilters,
		setColumnVisibility,
		setGlobalFilter,
		setRowSelection,
		setLateOnly,
		setStatusFilter,
		setShippingStatusFilter,
		setExpectedDeliveryRange,
		setIsAdvancedFiltersOpen,
		setViewOrder,
		setEditOrder,
		setDeleteOrder,
	] = useOrderStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.globalFilter,
			store.rowSelection,
			store.lateOnly,
			store.statusFilter,
			store.shippingStatusFilter,
			store.expectedDeliveryFrom,
			store.expectedDeliveryTo,
			store.isAdvancedFiltersOpen,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setGlobalFilter,
			store.setRowSelection,
			store.setLateOnly,
			store.setStatusFilter,
			store.setShippingStatusFilter,
			store.setExpectedDeliveryRange,
			store.setIsAdvancedFiltersOpen,
			store.setViewOrder,
			store.setEditOrder,
			store.setDeleteOrder,
		]),
	);

	const getOrdersQueryInput = useMemo(() => {
		if (
			!lateOnly &&
			statusFilter === null &&
			shippingStatusFilter === null &&
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
			shippingStatus: shippingStatusFilter ?? undefined,
			expectedDeliveryFrom: expectedDeliveryFromFilter?.toISOString(),
			expectedDeliveryTo: expectedDeliveryToFilter?.toISOString(),
		};
	}, [
		lateOnly,
		statusFilter,
		shippingStatusFilter,
		expectedDeliveryFrom,
		expectedDeliveryTo,
	]);

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
	const updateShippingStatusMutation = useMutation(
		trpc.orders.updateOrderShippingStatus.mutationOptions({
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
								? { ...o, shippingStatus: variables.shippingStatus }
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
	const updatePaymentStatusMutation = useMutation(
		trpc.orders.updateOrderPaymentStatus.mutationOptions({
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
								? { ...o, paymentStatus: variables.paymentStatus }
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
				onView: (order: Order) => setViewOrder(order),
				onEdit: (order: Order) => setEditOrder(order),
				onDelete: (order: Order) => setDeleteOrder(order),
				onStatusChange: (order: Order, status: OrderStatus) => {
					updateStatusMutation.mutate({ orderId: order.id, status });
				},
				onShippingStatusChange: (
					order: Order,
					shippingStatus: OrderShippingStatus,
				) => {
					updateShippingStatusMutation.mutate({
						orderId: order.id,
						shippingStatus,
					});
				},
				onPaymentStatusChange: (
					order: Order,
					paymentStatus: OrderPaymentStatus,
				) => {
					updatePaymentStatusMutation.mutate({
						orderId: order.id,
						paymentStatus,
					});
				},
			}),
		[
			setViewOrder,
			setEditOrder,
			setDeleteOrder,
			updateStatusMutation.mutate,
			updateShippingStatusMutation.mutate,
			updatePaymentStatusMutation.mutate,
		],
	);

	const table = useReactTable({
		data: orders,
		columns,
		getRowId: (row) => row.id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		enableMultiSort: false,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		globalFilterFn: fuzzyFilter,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
			rowSelection,
		},
	});

	const currentSortOption = getSortOptionFromSorting(sorting);
	const getSortOptionLabel = (option: OrderSortOption) => {
		switch (option) {
			case 'expected_delivery_asc':
				return `${m.orderExpectedDelivery()} ↑`;
			case 'expected_delivery_desc':
				return `${m.orderExpectedDelivery()} ↓`;
			case 'total_desc':
				return `${m.orderTotal()} ↓`;
			case 'customer_asc':
				return `${m.orderCustomer()} A-Z`;
			case 'status_asc':
				return `${m.orderStatus()} A-Z`;
			default:
				return option;
		}
	};
	const paymentStatusFilter =
		(table.getColumn('paymentStatus')?.getFilterValue() as
			| OrderPaymentStatus
			| undefined) ?? null;

	const resetAdvancedFilters = () => {
		setGlobalFilter('');
		setLateOnly(false);
		setStatusFilter(null);
		setShippingStatusFilter(null);
		setExpectedDeliveryRange(null, null);
		setColumnFilters([]);
		setSorting(getSortingForOption(DEFAULT_ORDER_SORT_OPTION));
	};

	return (
		<>
			<Collapsible
				open={isAdvancedFiltersOpen}
				onOpenChange={setIsAdvancedFiltersOpen}
			>
				<div className="rounded-lg border border-border bg-card p-3">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
						<Input
							placeholder={m.ordersSearchPlaceholder()}
							value={globalFilter}
							onChange={(event) => setGlobalFilter(event.target.value)}
							className="w-full text-sm lg:max-w-sm"
						/>
						<div className="flex flex-wrap items-center gap-2 lg:ml-auto">
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button type="button" variant="outline" className="gap-2" />
									}
								>
									<HugeiconsIcon
										icon={FilterHorizontalIcon}
										className="size-4"
									/>
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
							<CollapsibleTrigger
								render={
									<Button type="button" variant="outline" className="gap-2" />
								}
							>
								<HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" />
								{m.ordersAdvancedFilters()}
							</CollapsibleTrigger>
						</div>
					</div>
					<CollapsibleContent>
						<div className="mt-3 border-t border-border pt-3">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
								<Select
									value={statusFilter ?? 'all'}
									onValueChange={(value) =>
										setStatusFilter(
											value === 'all' ? null : (value as OrderStatus),
										)
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
											case 'cancelled':
												return m.orderStatusCancelled();
											default:
												return item;
										}
									}}
								>
									<SelectTrigger className="w-full">
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
											<SelectItem value="cancelled">
												{m.orderStatusCancelled()}
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								<Select
									value={shippingStatusFilter ?? 'all'}
									onValueChange={(value) =>
										setShippingStatusFilter(
											value === 'all' ? null : (value as OrderShippingStatus),
										)
									}
									itemToStringLabel={(item) => {
										switch (item) {
											case 'all':
												return m.orderShippingStatus();
											case 'to_ship':
												return m.orderShippingStatusToShip();
											case 'shipped':
												return m.orderShippingStatusShipped();
											case 'delivered':
												return m.orderShippingStatusDelivered();
											default:
												return item;
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={m.orderShippingStatus()} />
									</SelectTrigger>
									<SelectContent alignItemWithTrigger={false}>
										<SelectGroup>
											<SelectItem value="all">
												{m.orderShippingStatus()}
											</SelectItem>
											<SelectItem value="to_ship">
												{m.orderShippingStatusToShip()}
											</SelectItem>
											<SelectItem value="shipped">
												{m.orderShippingStatusShipped()}
											</SelectItem>
											<SelectItem value="delivered">
												{m.orderShippingStatusDelivered()}
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								<Select
									value={paymentStatusFilter ?? 'all'}
									onValueChange={(value) =>
										table
											.getColumn('paymentStatus')
											?.setFilterValue(value === 'all' ? undefined : value)
									}
									itemToStringLabel={(item) => {
										switch (item) {
											case 'all':
												return m.orderPaymentStatus();
											case 'pending':
												return m.orderPaymentStatusPending();
											case 'paid':
												return m.orderPaymentStatusPaid();
											default:
												return item;
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={m.orderPaymentStatus()} />
									</SelectTrigger>
									<SelectContent alignItemWithTrigger={false}>
										<SelectGroup>
											<SelectItem value="all">
												{m.orderPaymentStatus()}
											</SelectItem>
											<SelectItem value="pending">
												{m.orderPaymentStatusPending()}
											</SelectItem>
											<SelectItem value="paid">
												{m.orderPaymentStatusPaid()}
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								<Select
									value={currentSortOption}
									onValueChange={(value) =>
										setSorting(getSortingForOption(value as OrderSortOption))
									}
									itemToStringLabel={(item) =>
										getSortOptionLabel(item as OrderSortOption)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={m.orderExpectedDelivery()} />
									</SelectTrigger>
									<SelectContent alignItemWithTrigger={false}>
										<SelectGroup>
											<SelectItem value="expected_delivery_asc">
												{getSortOptionLabel('expected_delivery_asc')}
											</SelectItem>
											<SelectItem value="expected_delivery_desc">
												{getSortOptionLabel('expected_delivery_desc')}
											</SelectItem>
											<SelectItem value="total_desc">
												{getSortOptionLabel('total_desc')}
											</SelectItem>
											<SelectItem value="customer_asc">
												{getSortOptionLabel('customer_asc')}
											</SelectItem>
											<SelectItem value="status_asc">
												{getSortOptionLabel('status_asc')}
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
												className="w-full justify-start text-left font-normal"
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
												type="button"
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
							</div>
							<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
								<Label className="cursor-pointer flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 has-checked:border-primary has-checked:bg-primary/5 transition-colors">
									<Switch
										checked={lateOnly}
										onCheckedChange={setLateOnly}
										aria-label={m.orderLate()}
										size="sm"
									/>
									<span className="text-sm text-foreground">
										{m.orderLate()}
									</span>
								</Label>
								<Button
									type="button"
									variant="destructive"
									className="w-full sm:ml-auto sm:w-auto"
									onClick={resetAdvancedFilters}
								>
									{m.ordersResetFilters()}
								</Button>
							</div>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

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
	const [
		viewOrder,
		editOrder,
		deleteOrder,
		setViewOrder,
		setEditOrder,
		setDeleteOrder,
	] = useOrderStore(
		useShallow((store) => [
			store.viewOrder,
			store.editOrder,
			store.deleteOrder,
			store.setViewOrder,
			store.setEditOrder,
			store.setDeleteOrder,
		]),
	);

	return (
		<>
			<ViewOrderDialog
				order={viewOrder}
				open={viewOrder !== null}
				onOpenChange={(open) => {
					if (!open) setViewOrder(null);
				}}
			/>
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
