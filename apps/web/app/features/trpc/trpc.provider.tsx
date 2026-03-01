import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	createTRPCClient,
	httpBatchLink,
	httpSubscriptionLink,
	splitLink,
} from '@trpc/client';
import { type ReactNode, useState } from 'react';
import SuperJSON from 'superjson';
import type { AppRouter } from '@/features/.server/trpc/trpc.router';
import { TRPCProvider } from '@/features/trpc/trpc.context';

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 60 * 1000,
			},
		},
	});
}
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
	if (typeof window === 'undefined') {
		// Server: always make a new query client
		return makeQueryClient();
	} else {
		// Browser: make a new query client if we don't already have one
		// This is very important, so we don't re-make a new client if React
		// suspends during the initial render. This may not be needed if we
		// have a suspense boundary BELOW the creation of the query client
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		return browserQueryClient;
	}
}

export function TrpcQueryClientProvider({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient();
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				splitLink({
					condition(op) {
						return op.type === 'subscription';
					},
					true: httpSubscriptionLink({
						url: `${import.meta.env.VITE_APP_API_URL}/trpc`,
						transformer: SuperJSON,
					}),
					false: httpBatchLink({
						url: `${import.meta.env.VITE_APP_API_URL}/trpc`,
						transformer: SuperJSON,
					}),
				}),
			],
		}),
	);
	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
