import {
	Badge,
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Separator,
} from '@d-dentaditamentos/ui';
import type { ReactNode } from 'react';
import type { User } from '@/features/.server/users/user.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';

type ViewUserDialogProps = {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUE = '-';

const formatDateTime = (value: Date | string | null | undefined) => {
	if (!value) {
		return EMPTY_VALUE;
	}

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return EMPTY_VALUE;
	}

	return new Intl.DateTimeFormat(getLocale(), {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
};

const getUserRoleLabel = (role: string | null) => {
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
			return role ?? EMPTY_VALUE;
	}
};

type DetailItemProps = {
	label: string;
	value: ReactNode;
};

const DetailItem = ({ label, value }: DetailItemProps) => (
	<div className="space-y-1">
		<p className="text-xs text-muted-foreground">{label}</p>
		<div className="text-sm font-medium wrap-break-word">{value}</div>
	</div>
);

export function ViewUserDialog({
	user,
	open,
	onOpenChange,
}: ViewUserDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.viewUserTitle()}</DialogTitle>
					<DialogDescription>{m.viewDetailsDescription()}</DialogDescription>
				</DialogHeader>

				{user ? (
					<div className="space-y-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem label="ID" value={user.id} />
							<DetailItem label={m.userName()} value={user.name} />
							<DetailItem label={m.userEmail()} value={user.email} />
							<DetailItem
								label={m.userRole()}
								value={
									<Badge variant="secondary" className="font-normal text-xs">
										{getUserRoleLabel(user.role)}
									</Badge>
								}
							/>
							<DetailItem
								label={m.userStatus()}
								value={
									<Badge
										variant={user.banned ? 'destructive' : 'secondary'}
										className="font-normal text-xs"
									>
										{user.banned ? m.userStatusBanned() : m.userStatusActive()}
									</Badge>
								}
							/>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem
								label={m.detailsCreatedAt()}
								value={formatDateTime(user.createdAt)}
							/>
							<DetailItem
								label={m.detailsUpdatedAt()}
								value={formatDateTime(user.updatedAt)}
							/>
						</div>
					</div>
				) : null}

				<DialogFooter>
					<DialogClose
						render={
							<Button type="button" variant="outline">
								{m.cancelButton()}
							</Button>
						}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
