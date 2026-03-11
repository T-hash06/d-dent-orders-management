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
import type { Customer } from '@/features/.server/customers/customer.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { CreateCustomerDialog } from '@/features/customers/components/dialogs/create-customer-dialog';
import { DeleteCustomerDialog } from '@/features/customers/components/dialogs/delete-customer-dialog';
import { EditCustomerDialog } from '@/features/customers/components/dialogs/edit-customer-dialog';
import { ViewCustomerDialog } from '@/features/customers/components/dialogs/view-customer-dialog';
import { getCustomerColumns } from '@/features/customers/components/table/customers.columns';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

interface CustomerStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: Record<string, boolean>;
	viewCustomer: Customer | null;
	editCustomer: Customer | null;
	deleteCustomer: Customer | null;
}

interface CustomerStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setViewCustomer: (customer: Customer | null) => void;
	setEditCustomer: (customer: Customer | null) => void;
	setDeleteCustomer: (customer: Customer | null) => void;
}

const useCustomerStore = create<CustomerStoreState & CustomerStoreActions>(
	(set) => ({
		sorting: [],
		columnFilters: [],
		columnVisibility: {},
		rowSelection: {},
		viewCustomer: null,
		editCustomer: null,
		deleteCustomer: null,
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
		setViewCustomer: (viewCustomer) => set({ viewCustomer }),
		setEditCustomer: (editCustomer) => set({ editCustomer }),
		setDeleteCustomer: (deleteCustomer) => set({ deleteCustomer }),
	}),
);

const emptyCustomersFallback: Customer[] = [];

const CustomersRouteHeader = () => {
	const { permissions } = useSession();

	return (
		<PageHeader
			title={m.customersTitle()}
			description={m.customersDescription()}
			action={
				permissions.customers.includes('create') ? (
					<CreateCustomerDialog />
				) : undefined
			}
		/>
	);
};

const CustomersRouteStats = () => {
	const trpc = useTRPC();
	const { data: customers = emptyCustomersFallback } = useQuery(
		trpc.customers.getCustomers.queryOptions(),
	);

	const customersCount = customers.length;
	const withPhone = customers.filter((c) => c.phone).length;
	const withAddress = customers.filter((c) => c.address).length;

	return (
		<StatBar
			stats={[
				{ label: m.customersTotalStat(), value: customersCount },
				{ label: m.customersWithPhoneStat(), value: withPhone },
				{ label: m.customersWithAddressStat(), value: withAddress },
			]}
		/>
	);
};

const CustomersRouteTable = () => {
	const trpc = useTRPC();
	const { data: customers = emptyCustomersFallback, isLoading } = useQuery(
		trpc.customers.getCustomers.queryOptions(),
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
		setViewCustomer,
		setEditCustomer,
		setDeleteCustomer,
	] = useCustomerStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.rowSelection,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setRowSelection,
			store.setViewCustomer,
			store.setEditCustomer,
			store.setDeleteCustomer,
		]),
	);

	const columns = useMemo(
		() =>
			getCustomerColumns({
				onView: (cust) => setViewCustomer(cust),
				onEdit: (cust) => setEditCustomer(cust),
				onDelete: (cust) => setDeleteCustomer(cust),
			}),
		[setViewCustomer, setEditCustomer, setDeleteCustomer],
	);

	const table = useReactTable({
		data: customers,
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
					placeholder={m.customersSearchPlaceholder()}
					value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
					onChange={(e) =>
						table.getColumn('name')?.setFilterValue(e.target.value)
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
						{m.customersColumns()}
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
										onCheckedChange={(val) => col.toggleVisibility(!!val)}
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
						{table.getHeaderGroups().map((hg) => (
							<TableRow key={hg.id}>
								{hg.headers.map((header) => (
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
								{columns.map((col, idx) => (
									<TableCell key={`${col.id ?? idx}`}>
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
											{m.noCustomersTitle()}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{m.noCustomersDescription()}
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
						? m.customerRowsSelected({
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
						{m.customerPrevious()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						{m.customerNext()}
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

const CustomerDialogs = () => {
	const [
		viewCustomer,
		editCustomer,
		deleteCustomer,
		setViewCustomer,
		setEditCustomer,
		setDeleteCustomer,
	] =
		useCustomerStore(
			useShallow((store) => [
				store.viewCustomer,
				store.editCustomer,
				store.deleteCustomer,
				store.setViewCustomer,
				store.setEditCustomer,
				store.setDeleteCustomer,
			]),
		);

	return (
		<>
			<ViewCustomerDialog
				customer={viewCustomer}
				open={viewCustomer !== null}
				onOpenChange={(open) => {
					if (!open) setViewCustomer(null);
				}}
			/>
			<EditCustomerDialog
				customer={editCustomer}
				open={editCustomer !== null}
				onOpenChange={(open) => {
					if (!open) setEditCustomer(null);
				}}
			/>
			<DeleteCustomerDialog
				customer={deleteCustomer}
				open={deleteCustomer !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteCustomer(null);
				}}
			/>
		</>
	);
};

export default function CustomersRoute() {
	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 md:py-7 space-y-5">
				<CustomersRouteHeader />

				<CustomersRouteStats />

				<CustomersRouteTable />
			</div>

			<CustomerDialogs />
		</div>
	);
}
