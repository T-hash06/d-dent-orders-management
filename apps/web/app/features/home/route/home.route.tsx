import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	Empty,
	Skeleton,
} from '@d-dentaditamentos/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	XAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/page-header';
import { StatBar } from '@/components/ui/stat-bar';
import type { Order } from '@/features/.server/orders/order.types';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale, localizeHref } from '@/features/i18n/paraglide/runtime';
import { useTRPC } from '@/features/trpc/trpc.context';
import type { Route } from './+types/home.route';

export const meta = ({ location: _location }: Route.MetaArgs) => [
	{ title: 'Dashboard' },
	{ name: 'description', content: 'Overview of your workspace activity.' },
];

const emptyOrdersFallback: Order[] = [];

function getOrderTotal(order: Order) {
	return order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

function toDayKey(value: Date) {
	const date = new Date(value);
	date.setHours(0, 0, 0, 0);
	return date.toISOString().slice(0, 10);
}

function toMonthKey(value: Date) {
	const date = new Date(value);
	return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function HomeRoute() {
	const trpc = useTRPC();
	const { roleCapabilities } = useSession();
	const locale = getLocale();
	const currency = useMemo(
		() =>
			new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'COP',
				minimumFractionDigits: 0,
			}),
		[locale],
	);
	const shortDateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				month: 'short',
				day: 'numeric',
			}),
		[locale],
	);
	const shortMonthFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				month: 'short',
			}),
		[locale],
	);

	const canReadOverviewAll = roleCapabilities.analytics.groups.overview.all;
	const canReadOverviewAssigned =
		roleCapabilities.analytics.groups.overview.assigned;
	const canReadOverview = canReadOverviewAll || canReadOverviewAssigned;
	const canReadOrdersPerformance =
		roleCapabilities.analytics.groups['orders-performance'].all ||
		roleCapabilities.analytics.groups['orders-performance'].assigned;
	const canReadCustomersInsights =
		roleCapabilities.analytics.groups['customers-insights'].all ||
		roleCapabilities.analytics.groups['customers-insights'].assigned;
	const canReadProductsInsights =
		roleCapabilities.analytics.groups['products-insights'].all ||
		roleCapabilities.analytics.groups['products-insights'].assigned;
	const canReadRevenue =
		roleCapabilities.analytics.groups.revenue.all ||
		roleCapabilities.analytics.groups.revenue.assigned;
	const canReadOperations =
		roleCapabilities.analytics.groups.operations.all ||
		roleCapabilities.analytics.groups.operations.assigned;
	const statusChartConfig = {
		total: {
			label: m.homeTotalOrders(),
			color: 'var(--chart-1)',
		},
	} satisfies ChartConfig;
	const monthlyChartConfig = {
		total: {
			label: m.homeTotalOrders(),
			color: 'var(--chart-2)',
		},
	} satisfies ChartConfig;
	const upcomingChartConfig = {
		total: {
			label: m.homePendingOrders(),
			color: 'var(--chart-3)',
		},
	} satisfies ChartConfig;
	const paymentChartConfig = {
		pending: {
			label: m.orderPaymentStatusPending(),
			color: 'var(--chart-4)',
		},
		paid: {
			label: m.orderPaymentStatusPaid(),
			color: 'var(--chart-1)',
		},
	} satisfies ChartConfig;
	const isAssignedOverviewOnly = canReadOverviewAssigned && !canReadOverviewAll;
	const shouldLoadOrders =
		canReadOrdersPerformance ||
		canReadCustomersInsights ||
		canReadProductsInsights ||
		canReadRevenue ||
		canReadOperations;

	const { data: homeOverview, isLoading: isHomeOverviewLoading } = useQuery({
		...trpc.orders.getHomeOverview.queryOptions(),
		enabled: canReadOverview,
	});
	const { data: orders = emptyOrdersFallback, isLoading: isOrdersLoading } =
		useQuery({
			...trpc.orders.getOrders.queryOptions(),
			enabled: shouldLoadOrders,
		});
	const { data: products = [], isLoading: isProductsLoading } = useQuery({
		...trpc.products.getProducts.queryOptions(),
		enabled: canReadProductsInsights,
	});

	const orderCounts = useMemo(() => {
		const total = orders.length;
		const pending = orders.filter((order) => order.status === 'pending').length;
		const inProgress = orders.filter(
			(order) => order.status === 'in_progress',
		).length;
		const completed = orders.filter(
			(order) => order.status === 'completed',
		).length;
		const cancelled = orders.filter(
			(order) => order.status === 'cancelled',
		).length;
		const late = orders.filter((order) => order.isLate).length;
		const totalRevenue = orders.reduce(
			(sum, order) => sum + getOrderTotal(order),
			0,
		);
		return {
			total,
			pending,
			inProgress,
			completed,
			cancelled,
			late,
			totalRevenue,
		};
	}, [orders]);

	const statItems = useMemo(
		() => [
			{
				label: m.homeTotalOrders(),
				value: homeOverview?.stats.totalOrders ?? orderCounts.total,
			},
			{
				label: m.homePendingOrders(),
				value: homeOverview?.stats.pendingOrders ?? orderCounts.pending,
			},
			{
				label: m.homeInProgressOrders(),
				value: homeOverview?.stats.inProgressOrders ?? orderCounts.inProgress,
			},
			{
				label: isAssignedOverviewOnly ? m.homeMyPendingOrders() : m.orderLate(),
				value: isAssignedOverviewOnly
					? (homeOverview?.stats.myPendingOrders ?? 0)
					: orderCounts.late,
			},
		],
		[homeOverview, isAssignedOverviewOnly, orderCounts],
	);

	const monthlyVolumeData = useMemo(() => {
		const today = new Date();
		const months = Array.from({ length: 6 }, (_, index) => {
			const date = new Date(
				today.getFullYear(),
				today.getMonth() - (5 - index),
				1,
			);
			return {
				key: toMonthKey(date),
				label: shortMonthFormatter.format(date),
				total: 0,
			};
		});

		const monthsMap = new Map(months.map((month) => [month.key, month]));
		for (const order of orders) {
			const month = monthsMap.get(toMonthKey(order.createdAt));
			if (month) {
				month.total += 1;
			}
		}

		return months;
	}, [orders, shortMonthFormatter]);

	const statusDistributionData = useMemo(
		() => [
			{
				key: 'pending',
				status: m.orderStatusPending(),
				total: orderCounts.pending,
				fill: 'var(--chart-3)',
			},
			{
				key: 'in-progress',
				status: m.orderStatusInProgress(),
				total: orderCounts.inProgress,
				fill: 'var(--chart-2)',
			},
			{
				key: 'completed',
				status: m.orderStatusCompleted(),
				total: orderCounts.completed,
				fill: 'var(--chart-1)',
			},
			{
				key: 'cancelled',
				status: m.orderStatusCancelled(),
				total: orderCounts.cancelled,
				fill: 'var(--chart-5)',
			},
		],
		[orderCounts],
	);

	const upcomingLoadData = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const days = Array.from({ length: 7 }, (_, index) => {
			const date = new Date(today);
			date.setDate(today.getDate() + index);
			return {
				key: toDayKey(date),
				label: shortDateFormatter.format(date),
				total: 0,
			};
		});

		const daysMap = new Map(days.map((day) => [day.key, day]));
		for (const order of orders) {
			if (order.status === 'completed' || order.status === 'cancelled') {
				continue;
			}
			const day = daysMap.get(toDayKey(order.expectedDeliveryAt));
			if (day) {
				day.total += 1;
			}
		}

		return days;
	}, [orders, shortDateFormatter]);

	const paymentBreakdownData = useMemo(() => {
		let pendingAmount = 0;
		let paidAmount = 0;

		for (const order of orders) {
			const total = getOrderTotal(order);
			if (order.paymentStatus === 'paid') {
				paidAmount += total;
				continue;
			}
			pendingAmount += total;
		}

		return [
			{
				key: 'pending',
				status: m.orderPaymentStatusPending(),
				amount: pendingAmount,
				fill: 'var(--color-pending)',
			},
			{
				key: 'paid',
				status: m.orderPaymentStatusPaid(),
				amount: paidAmount,
				fill: 'var(--color-paid)',
			},
		];
	}, [orders]);
	const hasPaymentData = paymentBreakdownData.some((item) => item.amount > 0);

	const topCustomers = useMemo(() => {
		if (!canReadCustomersInsights) {
			return [];
		}

		const totalsByCustomer = new Map<
			string,
			{ total: number; orders: number }
		>();
		for (const order of orders) {
			const customerName = order.customer?.name ?? '-';
			const previous = totalsByCustomer.get(customerName) ?? {
				total: 0,
				orders: 0,
			};
			totalsByCustomer.set(customerName, {
				total: previous.total + getOrderTotal(order),
				orders: previous.orders + 1,
			});
		}

		return [...totalsByCustomer.entries()]
			.map(([name, values]) => ({ name, ...values }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	}, [canReadCustomersInsights, orders]);

	const productNameById = useMemo(
		() =>
			new Map(
				products.map((product) => [
					product.id,
					`${product.name} ${product.variant}`.trim(),
				]),
			),
		[products],
	);

	const topProducts = useMemo(() => {
		if (!canReadProductsInsights) {
			return [];
		}

		const totalsByProduct = new Map<
			string,
			{ total: number; quantity: number }
		>();
		for (const order of orders) {
			for (const item of order.items) {
				const productName =
					productNameById.get(item.productId) ?? item.productId.slice(0, 8);
				const previous = totalsByProduct.get(productName) ?? {
					total: 0,
					quantity: 0,
				};
				totalsByProduct.set(productName, {
					total: previous.total + item.quantity * item.price,
					quantity: previous.quantity + item.quantity,
				});
			}
		}

		return [...totalsByProduct.entries()]
			.map(([name, values]) => ({ name, ...values }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	}, [canReadProductsInsights, orders, productNameById]);

	const assignedPending = homeOverview?.assignedPending ?? [];
	const hasAssignableOrders = assignedPending.length > 0;

	const quickActions = [
		roleCapabilities.orders.canList
			? { href: '/orders', label: m.navOrders() }
			: null,
		roleCapabilities.products.canList
			? { href: '/products', label: m.navProducts() }
			: null,
		roleCapabilities.customers.canList
			? { href: '/customers', label: m.navCustomers() }
			: null,
		roleCapabilities.users.canList
			? { href: '/users', label: m.navUsers() }
			: null,
	].flatMap((item) => (item ? [item] : []));

	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-7 space-y-5">
				<div className="flex flex-col gap-5">
					<PageHeader
						title={m.homePageTitle()}
						description={
							isAssignedOverviewOnly
								? m.homeAssignedPendingDescription()
								: m.homePageDescription()
						}
					/>

					{isHomeOverviewLoading ? (
						<Skeleton className="h-20 w-full rounded-lg" />
					) : (
						<StatBar stats={statItems} />
					)}

					<div className="grid gap-5 xl:grid-cols-2">
						{canReadOrdersPerformance && (
							<Card>
								<CardHeader>
									<CardTitle>{m.orderStatus()}</CardTitle>
									<CardDescription>{m.ordersDescription()}</CardDescription>
								</CardHeader>
								<CardContent>
									{isOrdersLoading ? (
										<Skeleton className="h-64 w-full rounded-lg" />
									) : (
										<ChartContainer
											config={statusChartConfig}
											className="min-h-[260px] w-full"
										>
											<BarChart
												accessibilityLayer
												data={statusDistributionData}
											>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="status"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent hideLabel />}
												/>
												<Bar dataKey="total" radius={8}>
													{statusDistributionData.map((item) => (
														<Cell key={item.key} fill={item.fill} />
													))}
												</Bar>
											</BarChart>
										</ChartContainer>
									)}
								</CardContent>
							</Card>
						)}

						{canReadOverview && (
							<Card>
								<CardHeader>
									<CardTitle>{m.ordersTitle()}</CardTitle>
									<CardDescription>{m.homePageDescription()}</CardDescription>
								</CardHeader>
								<CardContent>
									{isOrdersLoading ? (
										<Skeleton className="h-64 w-full rounded-lg" />
									) : (
										<ChartContainer
											config={monthlyChartConfig}
											className="min-h-[260px] w-full"
										>
											<LineChart accessibilityLayer data={monthlyVolumeData}>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="label"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent hideLabel />}
												/>
												<Line
													type="monotone"
													dataKey="total"
													stroke="var(--color-total)"
													strokeWidth={2}
													dot={false}
												/>
											</LineChart>
										</ChartContainer>
									)}
								</CardContent>
							</Card>
						)}

						{canReadOperations && (
							<Card>
								<CardHeader>
									<CardTitle>{m.orderExpectedDelivery()}</CardTitle>
									<CardDescription>
										{m.homeAssignedPendingDescription()}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{isOrdersLoading ? (
										<Skeleton className="h-64 w-full rounded-lg" />
									) : (
										<ChartContainer
											config={upcomingChartConfig}
											className="min-h-[260px] w-full"
										>
											<LineChart accessibilityLayer data={upcomingLoadData}>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="label"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent hideLabel />}
												/>
												<Line
													type="monotone"
													dataKey="total"
													stroke="var(--color-total)"
													strokeWidth={2}
													dot={false}
												/>
											</LineChart>
										</ChartContainer>
									)}
								</CardContent>
							</Card>
						)}

						{canReadRevenue && (
							<Card>
								<CardHeader>
									<CardTitle>{m.orderPaymentStatus()}</CardTitle>
									<CardDescription>
										{currency.format(orderCounts.totalRevenue)}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{isOrdersLoading ? (
										<Skeleton className="h-64 w-full rounded-lg" />
									) : hasPaymentData ? (
										<ChartContainer
											config={paymentChartConfig}
											className="min-h-[260px] w-full"
										>
											<PieChart>
												<ChartTooltip content={<ChartTooltipContent />} />
												<Pie
													data={paymentBreakdownData}
													dataKey="amount"
													nameKey="status"
													innerRadius={65}
													strokeWidth={5}
												/>
											</PieChart>
										</ChartContainer>
									) : (
										<Empty className="py-10">
											<p className="text-sm font-medium">{m.noResults()}</p>
										</Empty>
									)}
								</CardContent>
							</Card>
						)}
					</div>

					<div className="grid gap-5 xl:grid-cols-3">
						<Card className="xl:col-span-2">
							<CardHeader>
								<CardTitle>{m.homeAssignedPendingTitle()}</CardTitle>
								<CardDescription>
									{m.homeAssignedPendingDescription()}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isHomeOverviewLoading ? (
									<div className="flex flex-col gap-3">
										<Skeleton className="h-14 w-full rounded-lg" />
										<Skeleton className="h-14 w-full rounded-lg" />
										<Skeleton className="h-14 w-full rounded-lg" />
									</div>
								) : hasAssignableOrders ? (
									<div className="flex flex-col gap-2">
										{assignedPending.map((order) => {
											const date = new Intl.DateTimeFormat(locale, {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											}).format(new Date(order.expectedDeliveryAt));

											return (
												<div
													key={order.id}
													className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
												>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium">
															{order.customerName}
														</p>
														<p className="truncate text-xs text-muted-foreground">
															{order.deliveryAddress}
														</p>
													</div>
													<div className="flex items-center gap-2 text-xs sm:text-sm">
														<Badge
															variant={
																order.isLate ? 'destructive' : 'secondary'
															}
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
										<p className="mt-1 text-xs text-muted-foreground">
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
							<CardContent>
								<div className="flex flex-col gap-2">
									{quickActions.map((action) => (
										<Button
											key={action.href}
											render={<Link to={localizeHref(action.href)} />}
											variant={
												action.href === '/orders' ? 'default' : 'outline'
											}
											className="w-full justify-start"
											nativeButton={false}
										>
											{action.label}
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{(canReadCustomersInsights || canReadProductsInsights) && (
						<div className="grid gap-5 xl:grid-cols-2">
							{canReadCustomersInsights && (
								<Card>
									<CardHeader>
										<CardTitle>{m.customersTitle()}</CardTitle>
										<CardDescription>{m.orderTotal()}</CardDescription>
									</CardHeader>
									<CardContent>
										{isOrdersLoading ? (
											<Skeleton className="h-64 w-full rounded-lg" />
										) : topCustomers.length > 0 ? (
											<div className="flex flex-col gap-2">
												{topCustomers.map((customer) => (
													<div
														key={customer.name}
														className="flex items-center justify-between rounded-lg border border-border p-3"
													>
														<div className="min-w-0">
															<p className="truncate text-sm font-medium">
																{customer.name}
															</p>
															<Badge variant="outline">{customer.orders}</Badge>
														</div>
														<p className="font-medium tabular-nums">
															{currency.format(customer.total)}
														</p>
													</div>
												))}
											</div>
										) : (
											<Empty className="py-10">
												<p className="text-sm font-medium">{m.noResults()}</p>
											</Empty>
										)}
									</CardContent>
								</Card>
							)}

							{canReadProductsInsights && (
								<Card>
									<CardHeader>
										<CardTitle>{m.productsTitle()}</CardTitle>
										<CardDescription>{m.orderTotal()}</CardDescription>
									</CardHeader>
									<CardContent>
										{isOrdersLoading || isProductsLoading ? (
											<Skeleton className="h-64 w-full rounded-lg" />
										) : topProducts.length > 0 ? (
											<div className="flex flex-col gap-2">
												{topProducts.map((product) => (
													<div
														key={product.name}
														className="flex items-center justify-between rounded-lg border border-border p-3"
													>
														<div className="min-w-0">
															<p className="truncate text-sm font-medium">
																{product.name}
															</p>
															<Badge variant="outline">
																{product.quantity}
															</Badge>
														</div>
														<p className="font-medium tabular-nums">
															{currency.format(product.total)}
														</p>
													</div>
												))}
											</div>
										) : (
											<Empty className="py-10">
												<p className="text-sm font-medium">{m.noResults()}</p>
											</Empty>
										)}
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
