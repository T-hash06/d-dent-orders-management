export const ORDER_SHIPPING_STATUS_VALUES = [
	'to_ship',
	'shipped',
	'delivered',
] as const;

export type OrderShippingStatus = (typeof ORDER_SHIPPING_STATUS_VALUES)[number];
