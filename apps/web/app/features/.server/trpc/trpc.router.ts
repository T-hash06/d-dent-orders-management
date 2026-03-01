import { createCustomer } from '@/features/.server/customers/create-customer.mutation';
import { deleteCustomer } from '@/features/.server/customers/delete-customer.mutation';
import { getCustomerById } from '@/features/.server/customers/get-customer-by-id.query';
import { getCustomers } from '@/features/.server/customers/get-customers.query';
import { updateCustomer } from '@/features/.server/customers/update-customer.mutation';
import { createOrder } from '@/features/.server/orders/create-order.mutation';
import { getOrderById } from '@/features/.server/orders/get-order-by-id.query';
import { getOrders } from '@/features/.server/orders/get-orders.query';
import { updateOrder } from '@/features/.server/orders/update-order.mutation';
import { createProduct } from '@/features/.server/products/create-product.mutation';
import { deleteProduct } from '@/features/.server/products/delete-product.mutation';
import { getProductById } from '@/features/.server/products/get-product-by-id.query';
import { getProducts } from '@/features/.server/products/get-products.query';
import { updateProduct } from '@/features/.server/products/update-product.mutation';
import { t } from '@/features/.server/trpc/trpc.init';

const customers = t.router({
	getCustomers,
	getCustomerById,
	createCustomer,
	updateCustomer,
	deleteCustomer,
});

const products = t.router({
	getProducts,
	getProductById,
	createProduct,
	updateProduct,
	deleteProduct,
});

const orders = t.router({
	getOrders,
	getOrderById,
	createOrder,
	updateOrder,
});

export const appRouter = t.router({
	customers,
	products,
	orders,
});

export type AppRouter = typeof appRouter;
