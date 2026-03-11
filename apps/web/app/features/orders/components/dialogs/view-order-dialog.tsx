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
import type { Order } from '@/features/.server/orders/order.types';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import type { OrderPaymentStatus } from '@/features/orders/domain/order-payment-status';
import type { OrderShippingStatus } from '@/features/orders/domain/order-shipping-status';
import type { OrderStatus } from '@/features/orders/domain/order-status';

type ViewOrderDialogProps = {
	order: Order | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUE = '-';

const getTextValue = (value: string | null | undefined) => {
	const normalized = value?.trim();
	return normalized ? normalized : EMPTY_VALUE;
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
	}).format(value);

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

const getStatusLabel = (status: OrderStatus) => {
	switch (status) {
		case 'pending':
			return m.orderStatusPending();
		case 'in_progress':
			return m.orderStatusInProgress();
		case 'completed':
			return m.orderStatusCompleted();
		default:
			return m.orderStatusCancelled();
	}
};

const getStatusVariant = (status: OrderStatus) => {
	if (status === 'cancelled') {
		return 'destructive' as const;
	}

	if (status === 'completed') {
		return 'default' as const;
	}

	if (status === 'in_progress') {
		return 'outline' as const;
	}

	return 'secondary' as const;
};

const getPaymentStatusLabel = (status: OrderPaymentStatus) =>
	status === 'paid'
		? m.orderPaymentStatusPaid()
		: m.orderPaymentStatusPending();

const getPaymentStatusVariant = (status: OrderPaymentStatus) =>
	status === 'paid' ? ('default' as const) : ('secondary' as const);

const getShippingStatusLabel = (status: OrderShippingStatus) => {
	switch (status) {
		case 'to_ship':
			return m.orderShippingStatusToShip();
		case 'shipped':
			return m.orderShippingStatusShipped();
		default:
			return m.orderShippingStatusDelivered();
	}
};

const getShippingStatusVariant = (status: OrderShippingStatus) => {
	if (status === 'delivered') {
		return 'default' as const;
	}

	if (status === 'shipped') {
		return 'outline' as const;
	}

	return 'secondary' as const;
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

export function ViewOrderDialog({
	order,
	open,
	onOpenChange,
}: ViewOrderDialogProps) {
	const orderTotal =
		order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
		0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.viewOrderTitle()}</DialogTitle>
					<DialogDescription>{m.viewDetailsDescription()}</DialogDescription>
				</DialogHeader>

				{order ? (
					<div className="space-y-5">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem label="ID" value={order.id} />
							<DetailItem
								label={m.orderCustomer()}
								value={
									<div className="flex flex-col gap-0.5">
										<span>{order.customer?.name ?? EMPTY_VALUE}</span>
										{order.customer?.identifier ? (
											<span className="text-xs text-muted-foreground">
												{order.customer.identifier}
											</span>
										) : null}
									</div>
								}
							/>
							<DetailItem
								label={m.orderDeliveryAddress()}
								value={getTextValue(order.deliveryAddress)}
							/>
							<DetailItem
								label={m.orderAssignedTo()}
								value={getTextValue(order.assignedToUserId)}
							/>
							<DetailItem
								label={m.orderExpectedDelivery()}
								value={formatDateTime(order.expectedDeliveryAt)}
							/>
							<DetailItem
								label={m.orderStatus()}
								value={
									<div className="flex items-center gap-2">
										<Badge
											variant={getStatusVariant(order.status)}
											className="font-normal text-xs"
										>
											{getStatusLabel(order.status)}
										</Badge>
										{order.isLate ? (
											<Badge
												variant="destructive"
												className="font-normal text-xs"
											>
												{m.orderLate()}
											</Badge>
										) : null}
									</div>
								}
							/>
							<DetailItem
								label={m.orderShippingStatus()}
								value={
									<Badge
										variant={getShippingStatusVariant(order.shippingStatus)}
										className="font-normal text-xs"
									>
										{getShippingStatusLabel(order.shippingStatus)}
									</Badge>
								}
							/>
							<DetailItem
								label={m.orderPaymentStatus()}
								value={
									<Badge
										variant={getPaymentStatusVariant(order.paymentStatus)}
										className="font-normal text-xs"
									>
										{getPaymentStatusLabel(order.paymentStatus)}
									</Badge>
								}
							/>
							<DetailItem
								label={m.orderTotal()}
								value={
									<span className="tabular-nums">
										{formatCurrency(orderTotal)}
									</span>
								}
							/>
						</div>

						<Separator />

						<div className="space-y-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">
									{m.orderItems()}
								</p>
								<Badge variant="secondary" className="font-normal text-xs">
									{m.orderItemsCount({ count: String(order.items.length) })}
								</Badge>
							</div>

							<div className="space-y-2">
								{order.items.map((item, index) => (
									<div
										key={item.id}
										className="rounded-lg border border-border bg-card p-3 space-y-2"
									>
										<p className="text-xs font-medium text-muted-foreground">
											#{index + 1}
										</p>
										<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
											<DetailItem
												label={m.orderItemProduct()}
												value={item.productId}
											/>
											<DetailItem
												label={m.orderItemQuantity()}
												value={
													<span className="tabular-nums">
														{String(item.quantity)}
													</span>
												}
											/>
											<DetailItem
												label={m.orderItemPrice()}
												value={
													<span className="tabular-nums">
														{formatCurrency(Number(item.price))}
													</span>
												}
											/>
											<DetailItem
												label={m.orderItemDetails()}
												value={getTextValue(item.details)}
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<DetailItem
								label={m.detailsCreatedAt()}
								value={formatDateTime(order.createdAt)}
							/>
							<DetailItem
								label={m.detailsUpdatedAt()}
								value={formatDateTime(order.updatedAt)}
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
