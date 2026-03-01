import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/features/.server/trpc/trpc.router';

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();
