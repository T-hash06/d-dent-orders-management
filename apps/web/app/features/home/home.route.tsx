import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Empty,
	Skeleton,
} from '@full-stack-template/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale, localizeHref } from '@/features/i18n/paraglide/runtime';
import { useTRPC } from '@/features/trpc/trpc.context';
import type { Route } from './+types/home.route';

export const meta = ({ location: _location }: Route.MetaArgs) => [
	{ title: 'Dashboard' },
	{ name: 'description', content: 'Overview of your workspace activity.' },
];

export default function HomeRoute() {
	const trpc = useTRPC();
	const { data, isLoading } = useQuery(
		trpc.orders.getHomeOverview.queryOptions(),
	);

	const currency = new Intl.NumberFormat(getLocale(), {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
	});

	const statsSkeletonKeys = ['total', 'pending', 'inProgress', 'assigned'];
	const pendingSkeletonKeys = ['first', 'second', 'third'];

	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{m.homePageTitle()}
					</h1>
					<p className="text-sm text-muted-foreground">
						{m.homePageDescription()}
					</p>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{isLoading ? (
						statsSkeletonKeys.map((key) => (
							<Card key={key}>
								<CardHeader className="space-y-2 pb-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-8 w-16" />
								</CardHeader>
							</Card>
						))
					) : (
						<>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>{m.homeTotalOrders()}</CardDescription>
									<CardTitle className="text-2xl">
										{data?.stats.totalOrders ?? 0}
									</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>{m.homePendingOrders()}</CardDescription>
									<CardTitle className="text-2xl">
										{data?.stats.pendingOrders ?? 0}
									</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>{m.homeInProgressOrders()}</CardDescription>
									<CardTitle className="text-2xl">
										{data?.stats.inProgressOrders ?? 0}
									</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>{m.homeMyPendingOrders()}</CardDescription>
									<CardTitle className="text-2xl">
										{data?.stats.myPendingOrders ?? 0}
									</CardTitle>
								</CardHeader>
							</Card>
						</>
					)}
				</div>

				<div className="grid gap-4 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>{m.homeAssignedPendingTitle()}</CardTitle>
							<CardDescription>
								{m.homeAssignedPendingDescription()}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-3">
									{pendingSkeletonKeys.map((key) => (
										<Skeleton key={key} className="h-14 w-full" />
									))}
								</div>
							) : data?.assignedPending.length ? (
								<div className="space-y-2">
									{data.assignedPending.map((order) => {
										const date = new Intl.DateTimeFormat(getLocale(), {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
										}).format(new Date(order.expectedDeliveryAt));

										return (
											<div
												key={order.id}
												className="rounded-lg border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
											>
												<div className="min-w-0 space-y-1">
													<p className="font-medium text-sm truncate">
														{order.customerName}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{order.deliveryAddress}
													</p>
												</div>
												<div className="flex items-center gap-2 text-xs sm:text-sm">
													<Badge
														variant={order.isLate ? 'destructive' : 'secondary'}
													>
														{order.isLate ? m.orderLate() : date}
													</Badge>
													<Badge variant="outline">
														{m.orderItemsCount({
															count: String(order.itemCount),
														})}
													</Badge>
													<span className="font-medium tabular-nums">
														{currency.format(order.total)}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<Empty className="py-10">
									<p className="text-sm font-medium">
										{m.homeNoAssignedOrdersTitle()}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{m.homeNoAssignedOrdersDescription()}
									</p>
								</Empty>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{m.homeQuickActionsTitle()}</CardTitle>
							<CardDescription>
								{m.homeQuickActionsDescription()}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button
								render={<Link to={localizeHref('/orders')} />}
								className="w-full justify-start"
								nativeButton={false}
							>
								{m.navOrders()}
							</Button>
							<Button
								render={<Link to={localizeHref('/products')} />}
								variant="outline"
								className="w-full justify-start"
								nativeButton={false}
							>
								{m.navProducts()}
							</Button>
							<Button
								render={<Link to={localizeHref('/customers')} />}
								variant="outline"
								className="w-full justify-start"
								nativeButton={false}
							>
								{m.navCustomers()}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
