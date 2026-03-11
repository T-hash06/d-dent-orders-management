import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Separator,
} from '@full-stack-template/ui';
import type { ReactNode } from 'react';
import type { Customer } from '@/features/.server/customers/customer.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';

type ViewCustomerDialogProps = {
	customer: Customer | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUE = '-';

const getTextValue = (value: string | null | undefined) => {
	const normalized = value?.trim();
	return normalized ? normalized : EMPTY_VALUE;
};

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

export function ViewCustomerDialog({
	customer,
	open,
	onOpenChange,
}: ViewCustomerDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.viewCustomerTitle()}</DialogTitle>
					<DialogDescription>{m.viewDetailsDescription()}</DialogDescription>
				</DialogHeader>

				{customer ? (
					<div className="space-y-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem label="ID" value={customer.id} />
							<DetailItem label={m.customerName()} value={customer.name} />
							<DetailItem
								label={m.customerIdentifier()}
								value={getTextValue(customer.identifier)}
							/>
							<DetailItem
								label={m.customerPhone()}
								value={getTextValue(customer.phone)}
							/>
							<DetailItem
								label={m.customerAddress()}
								value={getTextValue(customer.address)}
							/>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem
								label={m.detailsCreatedAt()}
								value={formatDateTime(customer.createdAt)}
							/>
							<DetailItem
								label={m.detailsUpdatedAt()}
								value={formatDateTime(customer.updatedAt)}
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
