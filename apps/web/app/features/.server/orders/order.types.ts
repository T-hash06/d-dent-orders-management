import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/features/.server/trpc/trpc.router';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Order = RouterOutputs['orders']['getOrders'][number];
export type OrderItem = Order['items'][number];
export type OrderCustomer = NonNullable<Order['customer']>;
