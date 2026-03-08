import {
	Cancel01Icon,
	CheckCircle,
	Clock01Icon,
	DashboardCircleIcon,
} from '@hugeicons/core-free-icons';
import type { OrderStatus } from '@/features/orders/domain/order-status';

export function getOrderStatusIcon(status: OrderStatus) {
	switch (status) {
		case 'completed':
			return CheckCircle;
		case 'pending':
			return Clock01Icon;
		case 'in_progress':
			return DashboardCircleIcon;
		case 'cancelled':
			return Cancel01Icon;
	}
}
