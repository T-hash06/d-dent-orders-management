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
} from '@d-dentaditamentos/ui';
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
import type { GetUsersResponse } from '@/features/.server/users/user.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';
import { CreateUserDialog } from '@/features/users/components/dialogs/create-user-dialog';
import { DeleteUserDialog } from '@/features/users/components/dialogs/delete-user-dialog';
import { EditUserDialog } from '@/features/users/components/dialogs/edit-user-dialog';
import { ViewUserDialog } from '@/features/users/components/dialogs/view-user-dialog';
import { getUserColumns } from '@/features/users/components/table/users.columns';

interface UserStoreState {
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: Record<string, boolean>;
	searchTerm: string;
	viewUser: GetUsersResponse | null;
	editUser: GetUsersResponse | null;
	deleteUser: GetUsersResponse | null;
}

interface UserStoreActions {
	setSorting: OnChangeFn<SortingState>;
	setColumnFilters: OnChangeFn<ColumnFiltersState>;
	setColumnVisibility: OnChangeFn<VisibilityState>;
	setRowSelection: OnChangeFn<Record<string, boolean>>;
	setSearchTerm: (searchTerm: string) => void;
	setViewUser: (user: GetUsersResponse | null) => void;
	setEditUser: (user: GetUsersResponse | null) => void;
	setDeleteUser: (user: GetUsersResponse | null) => void;
}

const useUserStore = create<UserStoreState & UserStoreActions>((set) => ({
	sorting: [],
	columnFilters: [],
	columnVisibility: {},
	rowSelection: {},
	searchTerm: '',
	viewUser: null,
	editUser: null,
	deleteUser: null,
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
	setSearchTerm: (searchTerm) => set({ searchTerm }),
	setViewUser: (viewUser) => set({ viewUser }),
	setEditUser: (editUser) => set({ editUser }),
	setDeleteUser: (deleteUser) => set({ deleteUser }),
}));

const emptyUsersFallback: GetUsersResponse[] = [];

const UsersRouteHeader = () => {
	const { roleCapabilities } = useSession();

	return (
		<PageHeader
			title={m.usersTitle()}
			description={m.usersDescription()}
			action={
				roleCapabilities.users.canCreate ? <CreateUserDialog /> : undefined
			}
		/>
	);
};

const UsersRouteStats = () => {
	const trpc = useTRPC();
	const { data: users = emptyUsersFallback } = useQuery(
		trpc.users.getUsers.queryOptions(),
	);

	const usersCount = users.length;
	const adminsCount = users.filter((user) => user.role === 'admin').length;
	const bannedCount = users.filter((user) => user.banned).length;

	return (
		<StatBar
			stats={[
				{ label: m.usersTotalStat(), value: usersCount },
				{ label: m.usersAdminsStat(), value: adminsCount },
				{ label: m.usersBannedStat(), value: bannedCount },
			]}
		/>
	);
};

const UsersRouteTable = () => {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [
		sorting,
		columnFilters,
		columnVisibility,
		rowSelection,
		searchTerm,
		setSorting,
		setColumnFilters,
		setColumnVisibility,
		setRowSelection,
		setSearchTerm,
		setViewUser,
		setEditUser,
		setDeleteUser,
	] = useUserStore(
		useShallow((store) => [
			store.sorting,
			store.columnFilters,
			store.columnVisibility,
			store.rowSelection,
			store.searchTerm,
			store.setSorting,
			store.setColumnFilters,
			store.setColumnVisibility,
			store.setRowSelection,
			store.setSearchTerm,
			store.setViewUser,
			store.setEditUser,
			store.setDeleteUser,
		]),
	);

	const getUsersQueryInput = useMemo(() => {
		const normalizedSearch = searchTerm.trim();
		if (!normalizedSearch) {
			return undefined;
		}

		return {
			search: normalizedSearch,
		};
	}, [searchTerm]);
	const { data: users = emptyUsersFallback, isLoading } = useQuery(
		trpc.users.getUsers.queryOptions(getUsersQueryInput),
	);

	const setUserRoleMutation = useMutation(
		trpc.users.setUserRole.mutationOptions({
			onError: () => {
				toast.error(m.setUserRoleFailed());
			},
			onSuccess: () => {
				toast.success(m.setUserRoleSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.users.getUsers.queryKey(),
				});
			},
		}),
	);
	const setUserBanStatusMutation = useMutation(
		trpc.users.setUserBanStatus.mutationOptions({
			onError: () => {
				toast.error(m.setUserBanStatusFailed());
			},
			onSuccess: (_data, variables) => {
				toast.success(
					variables.banned
						? m.setUserBanStatusSuccess()
						: m.setUserUnbanStatusSuccess(),
				);
				queryClient.invalidateQueries({
					queryKey: trpc.users.getUsers.queryKey(),
				});
			},
		}),
	);

	const columns = useMemo(
		() =>
			getUserColumns({
				onView: (user) => setViewUser(user),
				onEdit: (user) => setEditUser(user),
				onDelete: (user) => setDeleteUser(user),
				onSetRole: (user, role) =>
					setUserRoleMutation.mutate({ userId: user.id, role }),
				onToggleBan: (user, banned) =>
					setUserBanStatusMutation.mutate({ userId: user.id, banned }),
			}),
		[
			setViewUser,
			setEditUser,
			setDeleteUser,
			setUserRoleMutation.mutate,
			setUserBanStatusMutation.mutate,
		],
	);

	const table = useReactTable({
		data: users,
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
					placeholder={m.usersSearchPlaceholder()}
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
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
						{m.usersColumns()}
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
											{m.noUsersTitle()}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{m.noUsersDescription()}
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
						? m.userRowsSelected({
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
						{m.userPrevious()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						{m.userNext()}
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

const UserDialogs = () => {
	const [
		viewUser,
		editUser,
		deleteUser,
		setViewUser,
		setEditUser,
		setDeleteUser,
	] = useUserStore(
		useShallow((store) => [
			store.viewUser,
			store.editUser,
			store.deleteUser,
			store.setViewUser,
			store.setEditUser,
			store.setDeleteUser,
		]),
	);

	return (
		<>
			<ViewUserDialog
				user={viewUser}
				open={viewUser !== null}
				onOpenChange={(open) => {
					if (!open) {
						setViewUser(null);
					}
				}}
			/>
			<EditUserDialog
				user={editUser}
				open={editUser !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditUser(null);
					}
				}}
			/>
			<DeleteUserDialog
				user={deleteUser}
				open={deleteUser !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteUser(null);
					}
				}}
			/>
		</>
	);
};

export default function UsersRoute() {
	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 md:py-7 space-y-5">
				<UsersRouteHeader />

				<UsersRouteStats />

				<UsersRouteTable />
			</div>

			<UserDialogs />
		</div>
	);
}
