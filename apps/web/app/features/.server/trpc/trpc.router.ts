import { getAnalyticsCapabilities } from '@/features/.server/analytics/get-analytics-capabilities.query';
import { createCustomer } from '@/features/.server/customers/create-customer.mutation';
import { deleteCustomer } from '@/features/.server/customers/delete-customer.mutation';
import { getCustomerById } from '@/features/.server/customers/get-customer-by-id.query';
import { getCustomers } from '@/features/.server/customers/get-customers.query';
import { updateCustomer } from '@/features/.server/customers/update-customer.mutation';
import { completeOrder } from '@/features/.server/orders/complete-order.mutation';
import { createOrder } from '@/features/.server/orders/create-order.mutation';
import { deleteOrder } from '@/features/.server/orders/delete-order.mutation';
import { getAssignedOrders } from '@/features/.server/orders/get-assigned-orders.query';
import { getHomeOverview } from '@/features/.server/orders/get-home-overview.query';
import { getOrderById } from '@/features/.server/orders/get-order-by-id.query';
import { getOrders } from '@/features/.server/orders/get-orders.query';
import { updateOrder } from '@/features/.server/orders/update-order.mutation';
import { updateOrderPaymentStatus } from '@/features/.server/orders/update-order-payment-status.mutation';
import { updateOrderShippingStatus } from '@/features/.server/orders/update-order-shipping-status.mutation';
import { updateOrderStatus } from '@/features/.server/orders/update-order-status.mutation';
import { createProduct } from '@/features/.server/products/create-product.mutation';
import { deleteProduct } from '@/features/.server/products/delete-product.mutation';
import { getProductById } from '@/features/.server/products/get-product-by-id.query';
import { getProductCategories } from '@/features/.server/products/get-product-categories.query';
import { getProducts } from '@/features/.server/products/get-products.query';
import { updateProduct } from '@/features/.server/products/update-product.mutation';
import { t } from '@/features/.server/trpc/trpc.init';
import { createUser } from '@/features/.server/users/create-user.mutation';
import { deleteUser } from '@/features/.server/users/delete-user.mutation';
import { getAssignableUsers } from '@/features/.server/users/get-assignable-users.query';
import { getUsers } from '@/features/.server/users/get-users.query';
import { setUserBanStatus } from '@/features/.server/users/set-user-ban-status.mutation';
import { setUserRole } from '@/features/.server/users/set-user-role.mutation';
import { updateUser } from '@/features/.server/users/update-user.mutation';

const customers = t.router({
	getCustomers,
	getCustomerById,
	createCustomer,
	updateCustomer,
	deleteCustomer,
});

const products = t.router({
	getProducts,
	getProductCategories,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct,
});

const orders = t.router({
	getOrders,
	getAssignedOrders,
	getHomeOverview,
	getOrderById,
	createOrder,
	updateOrder,
	updateOrderStatus,
	updateOrderShippingStatus,
	updateOrderPaymentStatus,
	deleteOrder,

	completeOrder,
});

const users = t.router({
	getAssignableUsers,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	setUserRole,
	setUserBanStatus,
});

const analytics = t.router({
	getAnalyticsCapabilities,
});

export const appRouter = t.router({
	customers,
	products,
	orders,
	users,
	analytics,
});

export type AppRouter = typeof appRouter;
