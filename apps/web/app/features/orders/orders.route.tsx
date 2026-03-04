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
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { Order } from '@/features/.server/orders/order.types';
import { m } from '@/features/i18n/paraglide/messages';
import { CreateOrderDialog } from '@/features/orders/create-order-dialog';
import { DeleteOrderDialog } from '@/features/orders/delete-order-dialog';
import { EditOrderDialog } from '@/features/orders/edit-order-dialog';
import { getOrderColumns } from '@/features/orders/orders.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

export default function OrdersRoute() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: orders = [], isLoading } = useQuery(
		trpc.orders.getOrders.queryOptions(),
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

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const [editOrder, setEditOrder] = useState<Order | null>(null);
	const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

	const columns = getOrderColumns({
		onEdit: (order) => setEditOrder(order),
		onDelete: (order) => setDeleteOrder(order),
		onComplete: (order) => {
			completeMutation.mutate({ orderId: order.id });
		},
	});

	const table = useReactTable({
		data: orders,
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
		<div className="min-h-dvh bg-background">
			<div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<h1 className="text-2xl font-bold tracking-tight">
							{m.ordersTitle()}
						</h1>
						<p className="text-sm text-muted-foreground">
							{m.ordersDescription()}
						</p>
					</div>
					<CreateOrderDialog />
				</div>

				<div className="flex items-center gap-3">
					<Input
						placeholder={m.ordersSearchPlaceholder()}
						value={
							(table.getColumn('customer')?.getFilterValue() as string) ?? ''
						}
						onChange={(event) =>
							table.getColumn('customer')?.setFilterValue(event.target.value)
						}
						className="max-w-xs h-8 text-sm"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="outline"
									size="sm"
									className="ml-auto h-8 gap-2"
								/>
							}
						>
							<HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4" />
							{m.ordersColumns()}
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
											{col.columnDef.meta?.name}
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
					<p className="text-sm text-muted-foreground flex-1">
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
			</div>

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
		</div>
	);
}
