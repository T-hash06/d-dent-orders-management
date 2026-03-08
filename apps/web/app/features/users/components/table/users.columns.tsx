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
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@full-stack-template/ui';
import {
	AccountRecoveryIcon,
	AccountSettingIcon,
	ArrowUpIcon,
	Delete02Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
	UserEditIcon,
	UserIcon,
	UserShieldIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/features/.server/users/user.types';
import { m } from '@/features/i18n/paraglide/messages';
import { isUserRole, type UserRole } from '@/features/users/domain/user-role';

function getUserRoleLabel(role: string | null): string {
	switch (role) {
		case 'admin':
			return m.userRoleAdmin();
		case 'operator':
			return m.userRoleOperator();
		case 'supervisor':
			return m.userRoleSupervisor();
		case 'accounting':
			return m.userRoleAccounting();
		default:
			return role ?? '-';
	}
}

type UserColumnsProps = {
	onEdit: (user: User) => void;
	onDelete: (user: User) => void;
	onSetRole: (user: User, role: UserRole) => void;
	onToggleBan: (user: User, banned: boolean) => void;
};

export function getUserColumns({
	onEdit,
	onDelete,
	onSetRole,
	onToggleBan,
}: UserColumnsProps): ColumnDef<User>[] {
	return [
		{
			id: 'select',
			meta: {
				name: m.selectAll(),
			},
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
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'name',
			meta: {
				name: m.userName(),
			},
			header: ({ column }) => (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8 gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					{m.userName()}
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
				<span className="font-medium text-sm">{row.original.name}</span>
			),
		},
		{
			accessorKey: 'email',
			meta: {
				name: m.userEmail(),
			},
			header: () => m.userEmail(),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.email}
				</span>
			),
		},
		{
			accessorKey: 'role',
			meta: {
				name: m.userRole(),
			},
			header: () => m.userRole(),
			cell: ({ row }) => (
				<Badge variant="secondary" className="font-normal text-xs">
					{getUserRoleLabel(row.original.role)}
				</Badge>
			),
		},
		{
			id: 'status',
			meta: {
				name: m.userStatus(),
			},
			header: () => m.userStatus(),
			cell: ({ row }) => (
				<Badge
					variant={row.original.banned ? 'destructive' : 'secondary'}
					className="font-normal text-xs"
				>
					{row.original.banned ? m.userStatusBanned() : m.userStatusActive()}
				</Badge>
			),
		},
		{
			id: 'actions',
			enableHiding: false,
			meta: {
				name: m.userActions(),
			},
			cell: ({ row }) => {
				const user = row.original;
				const canEdit = user.actions.canEdit;
				const canDelete = user.actions.canDelete;
				const canSetRole = user.actions.canSetRole;
				const canBan = user.actions.canBan;
				const hasAnyAction = canEdit || canDelete || canSetRole || canBan;
				const currentRole = isUserRole(user.role) ? user.role : undefined;

				if (!hasAnyAction) {
					return null;
				}

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
									<DropdownMenuLabel>{m.userActions()}</DropdownMenuLabel>
									{canEdit && (
										<DropdownMenuItem
											onClick={() => onEdit(user)}
											className="cursor-pointer"
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="mr-2 h-4 w-4"
											/>
											{m.editUser()}
										</DropdownMenuItem>
									)}
									{canSetRole && (
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												<HugeiconsIcon
													icon={UserShieldIcon}
													className="mr-2 h-4 w-4"
												/>
												{m.userRole()}
											</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent>
													<DropdownMenuRadioGroup
														value={currentRole ?? ''}
														onValueChange={(value) => {
															if (isUserRole(value) && value !== currentRole) {
																onSetRole(user, value);
															}
														}}
													>
														<DropdownMenuRadioItem value="admin">
															<HugeiconsIcon
																icon={UserShieldIcon}
																className="mr-2 h-4 w-4"
															/>
															{m.userRoleAdmin()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="operator">
															<HugeiconsIcon
																icon={AccountSettingIcon}
																className="mr-2 h-4 w-4"
															/>
															{m.userRoleOperator()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="supervisor">
															<HugeiconsIcon
																icon={UserEditIcon}
																className="mr-2 h-4 w-4"
															/>
															{m.userRoleSupervisor()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem value="accounting">
															<HugeiconsIcon
																icon={AccountRecoveryIcon}
																className="mr-2 h-4 w-4"
															/>
															{m.userRoleAccounting()}
														</DropdownMenuRadioItem>
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
									)}
								</DropdownMenuGroup>
								{canBan && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => onToggleBan(user, !user.banned)}
												className={cn(
													'cursor-pointer',
													!user.banned && 'text-destructive',
												)}
												variant={user.banned ? undefined : 'destructive'}
											>
												<HugeiconsIcon
													icon={user.banned ? UserIcon : AccountRecoveryIcon}
													className="mr-2 h-4 w-4"
												/>
												{user.banned ? m.userUnbanAction() : m.userBanAction()}
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</>
								)}
								{canDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => onDelete(user)}
												className="cursor-pointer"
												variant="destructive"
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="mr-2 h-4 w-4"
												/>
												{m.deleteUser()}
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
