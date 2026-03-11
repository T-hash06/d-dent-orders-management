import type { Order } from '@/features/.server/orders/order.types';

export const getOrderItemsCount = (order: Order) => order.items.length;

export const getOrderTotal = (order: Order) =>
	order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
