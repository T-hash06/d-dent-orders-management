import {
	index,
	layout,
	prefix,
	type RouteConfig,
	route,
} from '@react-router/dev/routes';

export default [
	...prefix(':locale?', [
		layout('features/home/layout/home.layout.tsx', [
			index('features/home/route/home.route.tsx'),
			route('products', 'features/products/products.route.tsx'),
			route('customers', 'features/customers/customers.route.tsx'),
			route('orders', 'features/orders/orders.route.tsx'),
		]),
		route('api/trpc/*', 'features/trpc/trpc.handler.ts'),
		route('api/auth/*', 'features/better-auth/better-auth.handler.ts'),
		route('auth/login', 'features/better-auth/login/login.route.tsx'),
		route('auth/register', 'features/better-auth/register/register.route.tsx'),
	]),
] satisfies RouteConfig;
