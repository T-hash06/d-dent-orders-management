export const ORDER_STATUS_VALUES = [
	'pending',
	'in_progress',
	'completed',
	'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export function isOrderLate(
	status: OrderStatus,
	expectedDeliveryAt: Date,
): boolean {
	return (
		status !== 'completed' &&
		status !== 'cancelled' &&
		expectedDeliveryAt.getTime() < Date.now()
	);
}
