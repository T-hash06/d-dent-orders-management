import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/features/.server/trpc/trpc.router';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Customer = RouterOutputs['customers']['getCustomers'][number];
