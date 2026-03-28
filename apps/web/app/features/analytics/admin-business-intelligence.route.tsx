import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	Empty,
	Progress,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@d-dentaditamentos/ui';
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	ChartScatterIcon,
	CircleArrowDataTransferHorizontalIcon,
	DeliveryTruck01Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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
	YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/page-header';
import { StatBar } from '@/components/ui/stat-bar';
import { useSession } from '@/features/better-auth/better-auth.context';
import { m } from '@/features/i18n/paraglide/messages';
import { getLocale } from '@/features/i18n/paraglide/runtime';
import { useTRPC } from '@/features/trpc/trpc.context';
import { canAccessAdminBusinessIntelligence } from './utils/can-access-admin-business-intelligence';

const ORDER_STATUS_COLOR_BY_KEY = {
	pending: 'var(--chart-3)',
	in_progress: 'var(--chart-2)',
	completed: 'var(--chart-1)',
	cancelled: 'var(--chart-5)',
} as const;

const SHIPPING_STATUS_COLOR_BY_KEY = {
	to_ship: 'var(--chart-4)',
	shipped: 'var(--chart-2)',
	delivered: 'var(--chart-1)',
} as const;

const PAYMENT_STATUS_COLOR_BY_KEY = {
	paid: 'var(--chart-1)',
	pending: 'var(--chart-4)',
} as const;

const TAB_OVERVIEW = 'overview';
const TAB_OPERATIONS = 'operations';
const TAB_COMMERCIAL = 'commercial';
const TAB_TEAM = 'team';

function kpiDeltaBadge({
	value,
}: {
	value: number;
}) {
	return (
		<Badge variant={value >= 0 ? 'secondary' : 'destructive'}>
			<HugeiconsIcon
				icon={value >= 0 ? ArrowUp01Icon : ArrowDown01Icon}
				data-icon="inline-start"
			/>
			{`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
		</Badge>
	);
}

export default function AdminBusinessIntelligenceRoute() {
	const { roleCapabilities } = useSession();
	const locale = getLocale();
	const trpc = useTRPC();
	const canAccess = canAccessAdminBusinessIntelligence(roleCapabilities);
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'COP',
				minimumFractionDigits: 0,
			}),
		[locale],
	);
	const numberFormatter = useMemo(
		() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
		[locale],
	);
	const monthFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				month: 'short',
			}),
		[locale],
	);
	const fullDateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
		[locale],
	);

	const { data, isLoading } = useQuery({
		...trpc.analytics.getAdminBusinessIntelligence.queryOptions(),
		enabled: canAccess,
	});

	if (!canAccess) {
		return (
			<div className="bg-background">
				<div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-7">
					<PageHeader
						title={m.businessIntelligenceTitle()}
						description={m.businessIntelligenceDescription()}
					/>
					<Card className="mt-5">
						<CardHeader>
							<CardTitle>{m.unauthorizedAccess()}</CardTitle>
							<CardDescription>
								{m.businessIntelligenceUnauthorizedDescription()}
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	const summary = data?.summary;
	const monthlyRevenueData = (data?.charts.monthlyRevenue ?? []).map((month) => ({
		month: monthFormatter.format(month.labelDate),
		revenue: Math.round(month.revenue),
		orders: month.orders,
	}));
	const ordersByStatusData = (data?.charts.ordersByStatus ?? []).map((item) => ({
		status:
			item.status === 'pending'
				? m.orderStatusPending()
				: item.status === 'in_progress'
					? m.orderStatusInProgress()
					: item.status === 'completed'
						? m.orderStatusCompleted()
						: m.orderStatusCancelled(),
		count: item.count,
		fill: ORDER_STATUS_COLOR_BY_KEY[item.status],
	}));
	const ordersByShippingData = (data?.charts.ordersByShippingStatus ?? []).map((item) => ({
		status:
			item.status === 'to_ship'
				? m.orderShippingStatusToShip()
				: item.status === 'shipped'
					? m.orderShippingStatusShipped()
					: m.orderShippingStatusDelivered(),
		count: item.count,
		fill: SHIPPING_STATUS_COLOR_BY_KEY[item.status],
	}));
	const paymentSplitData = (data?.charts.paymentSplit ?? []).map((item) => ({
		key: item.status,
		status:
			item.status === 'paid'
				? m.orderPaymentStatusPaid()
				: m.orderPaymentStatusPending(),
		amount: Math.round(item.amount),
		fill:
			item.status === 'paid'
				? PAYMENT_STATUS_COLOR_BY_KEY.paid
				: PAYMENT_STATUS_COLOR_BY_KEY.pending,
	}));
	const hasPaymentSplit = paymentSplitData.some((item) => item.amount > 0);

	const revenueChartConfig = {
		revenue: {
			label: m.businessIntelligenceRevenueSeriesLabel(),
			color: 'var(--chart-1)',
		},
	} satisfies ChartConfig;
	const ordersChartConfig = {
		count: {
			label: m.businessIntelligenceOrdersSeriesLabel(),
			color: 'var(--chart-2)',
		},
	} satisfies ChartConfig;
	const shippingChartConfig = {
		count: {
			label: m.businessIntelligenceOrdersSeriesLabel(),
			color: 'var(--chart-3)',
		},
	} satisfies ChartConfig;
	const paymentChartConfig = {
		paid: {
			label: m.orderPaymentStatusPaid(),
			color: 'var(--chart-1)',
		},
		pending: {
			label: m.orderPaymentStatusPending(),
			color: 'var(--chart-4)',
		},
	} satisfies ChartConfig;

	return (
		<div className="bg-background">
			<div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-7 space-y-5">
				<PageHeader
					title={m.businessIntelligenceTitle()}
					description={m.businessIntelligenceDescription()}
				/>

				{isLoading || !summary ? (
					<div className="grid gap-5">
						<Skeleton className="h-20 w-full rounded-lg" />
						<Skeleton className="h-135 w-full rounded-lg" />
					</div>
				) : (
					<Tabs defaultValue={TAB_OVERVIEW} className="gap-4">
						<TabsList
							className="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-card px-0 py-4 sm:w-fit sm:overflow-visible"
							variant="default"
						>
							<TabsTrigger value={TAB_OVERVIEW} className="min-h-11 px-2 ml-4 sm:ml-0 sm:min-h-8">
								<HugeiconsIcon icon={ChartScatterIcon} data-icon="inline-start" />
								<span>{m.businessIntelligenceTabOverview()}</span>
							</TabsTrigger>
							<TabsTrigger
								value={TAB_OPERATIONS}
								className="min-h-11 px-2 sm:min-h-8"
							>
								<HugeiconsIcon icon={DeliveryTruck01Icon} data-icon="inline-start" />
								<span>{m.businessIntelligenceTabOperations()}</span>
							</TabsTrigger>
							<TabsTrigger
								value={TAB_COMMERCIAL}
								className="min-h-11 px-2 sm:min-h-8"
							>
								<HugeiconsIcon
									icon={CircleArrowDataTransferHorizontalIcon}
									data-icon="inline-start"
								/>
								<span>{m.businessIntelligenceTabCommercial()}</span>
							</TabsTrigger>
							<TabsTrigger value={TAB_TEAM} className="min-h-11 px-2 sm:min-h-8">
								<HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" />
								<span>{m.businessIntelligenceTabTeam()}</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent value={TAB_OVERVIEW} className="space-y-5">
							<StatBar
								stats={[
									{
										label: m.businessIntelligenceTotalRevenueStat(),
										value: currencyFormatter.format(summary.totalRevenue),
									},
									{
										label: m.businessIntelligenceAverageTicketStat(),
										value: currencyFormatter.format(summary.averageTicket),
									},
									{
										label: m.businessIntelligenceCollectionRateStat(),
										value: `${summary.paymentCollectionRate.toFixed(1)}%`,
									},
									{
										label: m.businessIntelligenceCompletionRateStat(),
										value: `${summary.completionRate.toFixed(1)}%`,
									},
									{
										label: m.businessIntelligenceOnTimeRateStat(),
										value: `${summary.onTimeDeliveryRate.toFixed(1)}%`,
									},
								]}
							/>

							<div className="grid gap-5 xl:grid-cols-5">
								<Card className="xl:col-span-3">
									<CardHeader className="gap-3">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="space-y-1">
												<CardTitle>{m.businessIntelligenceRevenueTrendTitle()}</CardTitle>
												<CardDescription>
													{m.businessIntelligenceRevenueTrendDescription()}
												</CardDescription>
											</div>
											{kpiDeltaBadge({ value: summary.revenueTrend })}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<ChartContainer
											config={revenueChartConfig}
											className="min-h-[270px] w-full"
										>
											<LineChart accessibilityLayer data={monthlyRevenueData}>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="month"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<YAxis hide />
												<ChartTooltip
													cursor={false}
													content={
														<ChartTooltipContent
															formatter={(value) =>
																currencyFormatter.format(Number(value))
															}
														/>
													}
												/>
												<Line
													type="monotone"
													dataKey="revenue"
													stroke="var(--color-revenue)"
													strokeWidth={2.5}
													dot={false}
												/>
											</LineChart>
										</ChartContainer>
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
											<div className="rounded-lg border border-border bg-card px-3 py-2.5">
												<p className="text-xs text-muted-foreground">
													{m.businessIntelligenceCurrentMonthRevenue()}
												</p>
												<p className="mt-1 text-sm font-semibold tabular-nums">
													{currencyFormatter.format(summary.currentMonthRevenue)}
												</p>
											</div>
											<div className="rounded-lg border border-border bg-card px-3 py-2.5">
												<p className="text-xs text-muted-foreground">
													{m.businessIntelligencePreviousMonthRevenue()}
												</p>
												<p className="mt-1 text-sm font-semibold tabular-nums">
													{currencyFormatter.format(summary.previousMonthRevenue)}
												</p>
											</div>
											<div className="rounded-lg border border-border bg-card px-3 py-2.5">
												<p className="text-xs text-muted-foreground">
													{m.businessIntelligenceAverageLeadTime()}
												</p>
												<p className="mt-1 text-sm font-semibold tabular-nums">
													{m.businessIntelligenceDaysValue({
														value: summary.averageLeadTimeDays.toFixed(1),
													})}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="xl:col-span-2">
									<CardHeader>
										<CardTitle>{m.businessIntelligenceBusinessSnapshotTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceBusinessSnapshotDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-3">
											<div className="rounded-lg border border-border p-3">
												<p className="text-[11px] text-muted-foreground">
													{m.businessIntelligenceTotalOrdersStat()}
												</p>
												<p className="mt-1 text-lg font-semibold tabular-nums">
													{numberFormatter.format(summary.totalOrders)}
												</p>
											</div>
											<div className="rounded-lg border border-border p-3">
												<p className="text-[11px] text-muted-foreground">
													{m.businessIntelligencePendingOrdersStat()}
												</p>
												<p className="mt-1 text-lg font-semibold tabular-nums">
													{numberFormatter.format(summary.pendingOrders)}
												</p>
											</div>
											<div className="rounded-lg border border-border p-3">
												<p className="text-[11px] text-muted-foreground">
													{m.businessIntelligenceCustomersWithOrdersStat()}
												</p>
												<p className="mt-1 text-lg font-semibold tabular-nums">
													{numberFormatter.format(summary.totalCustomersWithOrders)}
												</p>
											</div>
											<div className="rounded-lg border border-border p-3">
												<p className="text-[11px] text-muted-foreground">
													{m.businessIntelligenceProductsSoldStat()}
												</p>
												<p className="mt-1 text-lg font-semibold tabular-nums">
													{numberFormatter.format(summary.totalProductsSold)}
												</p>
											</div>
										</div>
										<div className="rounded-lg border border-border p-3">
											<div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
												<p>{m.businessIntelligenceCustomerConcentrationLabel()}</p>
												<p>{`${summary.customerConcentrationPercent.toFixed(1)}%`}</p>
											</div>
											<Progress value={summary.customerConcentrationPercent} />
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value={TAB_OPERATIONS} className="space-y-5">
							<StatBar
								stats={[
									{
										label: m.businessIntelligenceOrdersTodayStat(),
										value: numberFormatter.format(summary.ordersCreatedToday),
									},
									{
										label: m.businessIntelligenceDueNextWeekStat(),
										value: numberFormatter.format(summary.deliveriesDueNextWeek),
									},
									{
										label: m.businessIntelligenceOverdueUnpaidStat(),
										value: numberFormatter.format(summary.overdueUnpaidOrders),
									},
									{
										label: m.businessIntelligenceUnassignedOrdersStat(),
										value: numberFormatter.format(summary.unassignedOrders),
									},
									{
										label: m.businessIntelligenceLateOrdersStat(),
										value: numberFormatter.format(summary.lateOrders),
									},
								]}
							/>

							<div className="grid gap-5 xl:grid-cols-3">
								<Card>
									<CardHeader>
										<CardTitle>{m.businessIntelligenceOrderMixTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceOrderMixDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ChartContainer
											config={ordersChartConfig}
											className="min-h-[250px] w-full"
										>
											<BarChart accessibilityLayer data={ordersByStatusData}>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="status"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<YAxis hide />
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent hideLabel />}
												/>
												<Bar dataKey="count" radius={8}>
													{ordersByStatusData.map((item) => (
														<Cell key={item.status} fill={item.fill} />
													))}
												</Bar>
											</BarChart>
										</ChartContainer>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>{m.businessIntelligenceShippingTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceShippingDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ChartContainer
											config={shippingChartConfig}
											className="min-h-[250px] w-full"
										>
											<BarChart accessibilityLayer data={ordersByShippingData}>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="status"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<YAxis hide />
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent hideLabel />}
												/>
												<Bar dataKey="count" radius={8}>
													{ordersByShippingData.map((item) => (
														<Cell key={item.status} fill={item.fill} />
													))}
												</Bar>
											</BarChart>
										</ChartContainer>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>{m.businessIntelligenceOperationsCapacityTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceOperationsCapacityDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="rounded-lg border border-border p-3">
											<div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
												<p>{m.businessIntelligenceAssignmentCoverageLabel()}</p>
												<p>{`${summary.assignmentCoverage.toFixed(1)}%`}</p>
											</div>
											<Progress value={summary.assignmentCoverage} />
										</div>
										<div className="rounded-lg border border-border p-3">
											<p className="text-xs text-muted-foreground">
												{m.businessIntelligenceInProgressOrdersStat()}
											</p>
											<p className="mt-1 text-lg font-semibold tabular-nums">
												{numberFormatter.format(summary.inProgressOrders)}
											</p>
										</div>
										<div className="rounded-lg border border-border p-3">
											<p className="text-xs text-muted-foreground">
												{m.businessIntelligenceCancelledOrdersStat()}
											</p>
											<p className="mt-1 text-lg font-semibold tabular-nums">
												{numberFormatter.format(summary.cancelledOrders)}
											</p>
										</div>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>{m.businessIntelligenceRiskRadarTitle()}</CardTitle>
									<CardDescription>
										{m.businessIntelligenceRiskRadarDescription()}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{data.lists.topDelayedOrders.length > 0 ? (
										data.lists.topDelayedOrders.map((order) => (
											<div
												key={order.orderId}
												className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
											>
												<div className="min-w-0">
													<p className="truncate text-sm font-medium">
														{order.customerName}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{order.assignedTo ??
															m.businessIntelligenceUnassignedLabel()}
													</p>
												</div>
												<div className="flex flex-wrap items-center gap-2 text-xs">
													<Badge variant="destructive">
														{m.businessIntelligenceDelayDays({
															days: numberFormatter.format(order.delayDays),
														})}
													</Badge>
													<Badge variant="outline">
														{order.status === 'pending'
															? m.orderStatusPending()
															: order.status === 'in_progress'
																? m.orderStatusInProgress()
																: order.status === 'completed'
																	? m.orderStatusCompleted()
																	: m.orderStatusCancelled()}
													</Badge>
													<Badge variant="outline">
														{fullDateFormatter.format(order.expectedDeliveryAt)}
													</Badge>
												</div>
												<p className="text-sm font-semibold tabular-nums">
													{currencyFormatter.format(order.total)}
												</p>
											</div>
										))
									) : (
										<Empty className="py-10">
											<p className="text-sm font-medium">{m.noResults()}</p>
										</Empty>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value={TAB_COMMERCIAL} className="space-y-5">
							<StatBar
								stats={[
									{
										label: m.businessIntelligenceTotalRevenueStat(),
										value: currencyFormatter.format(summary.totalRevenue),
									},
									{
										label: m.businessIntelligencePaidRevenueStat(),
										value: currencyFormatter.format(summary.paidRevenue),
									},
									{
										label: m.businessIntelligencePendingRevenueStat(),
										value: currencyFormatter.format(summary.pendingRevenue),
									},
									{
										label: m.businessIntelligenceAverageTicketStat(),
										value: currencyFormatter.format(summary.averageTicket),
									},
									{
										label: m.businessIntelligenceCollectionRateStat(),
										value: `${summary.paymentCollectionRate.toFixed(1)}%`,
									},
								]}
							/>

							<div className="grid gap-5 xl:grid-cols-3">
								<Card className="xl:col-span-1">
									<CardHeader>
										<CardTitle>{m.businessIntelligenceCashflowTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceCashflowDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent>
										{hasPaymentSplit ? (
											<ChartContainer
												config={paymentChartConfig}
												className="min-h-[250px] w-full"
											>
												<PieChart>
													<ChartTooltip
														content={
															<ChartTooltipContent
																formatter={(value) =>
																	currencyFormatter.format(Number(value))
																}
															/>
														}
													/>
													<Pie
														data={paymentSplitData}
														dataKey="amount"
														nameKey="status"
														innerRadius={70}
														strokeWidth={4}
													/>
													<ChartLegend
														content={<ChartLegendContent />}
														verticalAlign="bottom"
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

								<Card className="xl:col-span-2">
									<CardHeader>
										<CardTitle>{m.businessIntelligenceTopCustomersTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceTopCustomersDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										{data.lists.topCustomers.length > 0 ? (
											data.lists.topCustomers.map((customer) => (
												<div
													key={customer.customerId}
													className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
												>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium">
															{customer.customerName}
														</p>
														<p className="text-xs text-muted-foreground">
															{m.businessIntelligenceOrdersCount({
																count: numberFormatter.format(customer.orders),
															})}
														</p>
													</div>
													<p className="text-sm font-semibold tabular-nums">
														{currencyFormatter.format(customer.revenue)}
													</p>
												</div>
											))
										) : (
											<Empty className="py-10">
												<p className="text-sm font-medium">{m.noResults()}</p>
											</Empty>
										)}
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-5 xl:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>{m.businessIntelligenceTopProductsTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceTopProductsDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										{data.lists.topProducts.length > 0 ? (
											data.lists.topProducts.map((product) => (
												<div
													key={product.productId}
													className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
												>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium">
															{product.productName}
														</p>
														<p className="text-xs text-muted-foreground">
															{m.businessIntelligenceUnitsCount({
																count: numberFormatter.format(product.units),
															})}
														</p>
													</div>
													<p className="text-sm font-semibold tabular-nums">
														{currencyFormatter.format(product.revenue)}
													</p>
												</div>
											))
										) : (
											<Empty className="py-10">
												<p className="text-sm font-medium">{m.noResults()}</p>
											</Empty>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>{m.businessIntelligenceCustomerGrowthTitle()}</CardTitle>
										<CardDescription>
											{m.businessIntelligenceCustomerGrowthDescription()}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="rounded-lg border border-border p-3">
											<p className="text-xs text-muted-foreground">
												{m.businessIntelligenceThisMonthNewCustomersStat()}
											</p>
											<p className="mt-1 text-lg font-semibold tabular-nums">
												{numberFormatter.format(summary.thisMonthNewCustomers)}
											</p>
										</div>
										<div className="rounded-lg border border-border p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-muted-foreground">
													{m.businessIntelligenceCustomerGrowthRateStat()}
												</p>
												{kpiDeltaBadge({ value: summary.customerGrowthRate })}
											</div>
											<p className="mt-1 text-lg font-semibold tabular-nums">
												{`${summary.customerGrowthRate.toFixed(1)}%`}
											</p>
										</div>
										<div className="space-y-2">
											{data.lists.newestCustomers.length > 0 ? (
												data.lists.newestCustomers.map((customer) => (
													<div
														key={customer.id}
														className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
													>
														<p className="truncate text-sm font-medium">
															{customer.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{fullDateFormatter.format(customer.createdAt)}
														</p>
													</div>
												))
											) : (
												<Empty className="py-6">
													<p className="text-sm font-medium">{m.noResults()}</p>
												</Empty>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value={TAB_TEAM} className="space-y-5">
							<StatBar
								stats={[
									{
										label: m.businessIntelligenceCompletionRateStat(),
										value: `${summary.completionRate.toFixed(1)}%`,
									},
									{
										label: m.businessIntelligenceOnTimeRateStat(),
										value: `${summary.onTimeDeliveryRate.toFixed(1)}%`,
									},
									{
										label: m.businessIntelligenceLateOrdersStat(),
										value: numberFormatter.format(summary.lateOrders),
									},
									{
										label: m.businessIntelligenceInProgressOrdersStat(),
										value: numberFormatter.format(summary.inProgressOrders),
									},
									{
										label: m.businessIntelligenceCompletedOrdersStat(),
										value: numberFormatter.format(summary.completedOrders),
									},
								]}
							/>

							<Card>
								<CardHeader>
									<CardTitle>{m.businessIntelligenceTeamPerformanceTitle()}</CardTitle>
									<CardDescription>
										{m.businessIntelligenceTeamPerformanceDescription()}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{data.lists.teamPerformance.length > 0 ? (
										data.lists.teamPerformance.map((member) => (
											<div
												key={member.userId}
												className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
											>
												<div className="min-w-0">
													<p className="truncate text-sm font-medium">{member.name}</p>
													<p className="text-xs text-muted-foreground">
														{m.businessIntelligenceTeamOrdersSummary({
															total: numberFormatter.format(member.assignedOrders),
															completed: numberFormatter.format(member.completedOrders),
														})}
													</p>
												</div>
												<div className="flex items-center gap-2 text-xs sm:text-sm">
													<Badge variant="outline">
														{`${member.completionRate.toFixed(1)}%`}
													</Badge>
													<Badge variant="secondary">
														{m.businessIntelligenceLateCount({
															count: numberFormatter.format(member.lateOrders),
														})}
													</Badge>
													<p className="font-semibold tabular-nums">
														{currencyFormatter.format(member.revenue)}
													</p>
												</div>
											</div>
										))
									) : (
										<Empty className="py-10">
											<p className="text-sm font-medium">{m.noResults()}</p>
										</Empty>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				)}
			</div>
		</div>
	);
}
