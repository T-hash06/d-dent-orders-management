import {
	index,
	layout,
	prefix,
	type RouteConfig,
	route,
} from '@react-router/dev/routes';

export default [
	...prefix(':locale?', [
		layout('features/home/home.layout.tsx', [
			index('features/home/home.route.tsx'),
		]),
		route('api/trpc/*', 'features/trpc/trpc.handler.ts'),
		route('api/auth/*', 'features/auth/auth.handler.ts'),
		route('auth/login', 'features/auth/login/login.route.tsx'),
		route('auth/register', 'features/auth/register/register.route.tsx'),
	]),
] satisfies RouteConfig;
