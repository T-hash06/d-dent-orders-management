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
import type { ProductPreview } from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import { getProductCategoryLabel } from '@/features/products/domain/product-category';

type ViewProductDialogProps = {
	product: ProductPreview | null;
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

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
	}).format(value);

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

export function ViewProductDialog({
	product,
	open,
	onOpenChange,
}: ViewProductDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.viewProductTitle()}</DialogTitle>
					<DialogDescription>{m.viewDetailsDescription()}</DialogDescription>
				</DialogHeader>

				{product ? (
					<div className="space-y-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem label="ID" value={product.id} />
							<DetailItem
								label={m.productCategory()}
								value={
									<Badge variant="secondary" className="font-normal text-xs">
										{getProductCategoryLabel(product)}
									</Badge>
								}
							/>
							<DetailItem label={m.productName()} value={product.name} />
							<DetailItem label={m.productVariant()} value={product.variant} />
							<DetailItem
								label={m.productPrice()}
								value={
									<span className="tabular-nums">
										{formatCurrency(Number(product.price))}
									</span>
								}
							/>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem
								label={m.detailsCreatedAt()}
								value={formatDateTime(product.createdAt)}
							/>
							<DetailItem
								label={m.detailsUpdatedAt()}
								value={formatDateTime(product.updatedAt)}
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
