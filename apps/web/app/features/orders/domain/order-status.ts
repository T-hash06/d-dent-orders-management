export const ORDER_STATUS_VALUES = [
	'pending',
	'in_progress',
	'completed',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export function isOrderLate(
	status: OrderStatus,
	expectedDeliveryAt: Date,
): boolean {
	return status !== 'completed' && expectedDeliveryAt.getTime() < Date.now();
}
