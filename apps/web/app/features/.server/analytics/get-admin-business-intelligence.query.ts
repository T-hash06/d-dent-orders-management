import { and, count, desc, gte, inArray, lte } from 'drizzle-orm';
import { assertCan } from '@/features/.server/auth/authorization.lib';
import { users } from '@/features/.server/auth/better-auth.schema';
import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { orderItems, orders } from '@/features/.server/orders/order.schema';
import { products } from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { isOrderLate } from '@/features/orders/domain/order-status';

const SHIPPING_STATUS_VALUES = ['to_ship', 'shipped', 'delivered'] as const;
const ORDER_STATUS_VALUES = [
	'pending',
	'in_progress',
	'completed',
	'cancelled',
] as const;

export const getAdminBusinessIntelligence = procedures.auth.query(
	async ({ ctx }) => {
		assertCan(ctx.ability, 'list', 'Analytics');
		assertCan(ctx.ability, 'overview-all', 'Analytics');
		assertCan(ctx.ability, 'orders-performance-all', 'Analytics');
		assertCan(ctx.ability, 'customers-insights-all', 'Analytics');
		assertCan(ctx.ability, 'products-insights-all', 'Analytics');
		assertCan(ctx.ability, 'revenue-all', 'Analytics');
		assertCan(ctx.ability, 'operations-all', 'Analytics');
		assertCan(ctx.ability, 'team-performance-all', 'Analytics');
		assertCan(ctx.ability, 'list', 'User');
		assertCan(ctx.ability, 'list-all', 'Order');
		const now = new Date();
		const currentMonthStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
			0,
			0,
			0,
			0,
		);
		const currentMonthEnd = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);
		const previousMonthStart = new Date(
			now.getFullYear(),
			now.getMonth() - 1,
			1,
			0,
			0,
			0,
			0,
		);
		const previousMonthEnd = new Date(
			now.getFullYear(),
			now.getMonth(),
			0,
			23,
			59,
			59,
			999,
		);
		const rangeStart = new Date(
			now.getFullYear(),
			now.getMonth() - 5,
			1,
			0,
			0,
			0,
			0,
		);

		const orderRows = await db.select().from(orders);
		const orderIds = orderRows.map((order) => order.id);
		const customerIds = Array.from(
			new Set(orderRows.map((order) => order.customerId)),
		);
		const assignedUserIds = Array.from(
			new Set(
				orderRows
					.map((order) => order.assignedToUserId)
					.filter((value): value is string => value !== null),
			),
		);
		const itemsRows =
			orderIds.length > 0
				? await db
						.select({
							orderId: orderItems.orderId,
							productId: orderItems.productId,
							quantity: orderItems.quantity,
							price: orderItems.price,
						})
						.from(orderItems)
						.where(inArray(orderItems.orderId, orderIds))
				: [];
		const productIds = Array.from(
			new Set(itemsRows.map((item) => item.productId)),
		);
		const productsRows =
			productIds.length > 0
				? await db
						.select({
							id: products.id,
							name: products.name,
							variant: products.variant,
						})
						.from(products)
						.where(inArray(products.id, productIds))
				: [];
		const customersRows =
			customerIds.length > 0
				? await db
						.select({
							id: customers.id,
							name: customers.name,
							createdAt: customers.createdAt,
						})
						.from(customers)
						.where(inArray(customers.id, customerIds))
				: [];
		const userRows =
			assignedUserIds.length > 0
				? await db
						.select({
							id: users.id,
							name: users.name,
						})
						.from(users)
						.where(inArray(users.id, assignedUserIds))
				: [];

		const itemsByOrderId = new Map<
			string,
			Array<{
				orderId: string;
				productId: string;
				quantity: number;
				price: number;
			}>
		>();
		for (const item of itemsRows) {
			const current = itemsByOrderId.get(item.orderId) ?? [];
			current.push(item);
			itemsByOrderId.set(item.orderId, current);
		}
		const customerNameById = new Map(
			customersRows.map((customer) => [customer.id, customer.name]),
		);
		const productNameById = new Map(
			productsRows.map((product) => [
				product.id,
				`${product.name} ${product.variant}`.trim(),
			]),
		);
		const userNameById = new Map(userRows.map((user) => [user.id, user.name]));
		const orderTotalsById = new Map<string, number>();
		const orderUnitsById = new Map<string, number>();
		for (const [orderId, items] of itemsByOrderId.entries()) {
			orderTotalsById.set(
				orderId,
				items.reduce((sum, item) => sum + item.quantity * item.price, 0),
			);
			orderUnitsById.set(
				orderId,
				items.reduce((sum, item) => sum + item.quantity, 0),
			);
		}
		const getOrderTotal = (orderId: string) =>
			orderTotalsById.get(orderId) ?? 0;
		const getOrderItemUnits = (orderId: string) =>
			orderUnitsById.get(orderId) ?? 0;
		const totalRevenue = orderRows.reduce(
			(sum, order) => sum + getOrderTotal(order.id),
			0,
		);
		const paidRevenue = orderRows
			.filter((order) => order.paymentStatus === 'paid')
			.reduce((sum, order) => sum + getOrderTotal(order.id), 0);
		const pendingRevenue = totalRevenue - paidRevenue;
		const averageTicket =
			orderRows.length > 0 ? totalRevenue / orderRows.length : 0;
		const pendingOrders = orderRows.filter(
			(order) => order.status === 'pending',
		);
		const inProgressOrders = orderRows.filter(
			(order) => order.status === 'in_progress',
		);
		const completedOrders = orderRows.filter(
			(order) => order.status === 'completed',
		);
		const cancelledOrders = orderRows.filter(
			(order) => order.status === 'cancelled',
		);
		const lateOrders = orderRows.filter((order) =>
			isOrderLate(order.status, order.expectedDeliveryAt),
		);
		const deliveredOrders = orderRows.filter(
			(order) => order.shippingStatus === 'delivered',
		);
		const overdueUnpaidOrders = orderRows.filter(
			(order) =>
				order.paymentStatus === 'pending' &&
				isOrderLate(order.status, order.expectedDeliveryAt),
		);
		const paymentCollectionRate =
			totalRevenue > 0
				? Math.round((paidRevenue / totalRevenue) * 10000) / 100
				: 0;
		const onTimeDeliveryRate =
			deliveredOrders.length > 0
				? Math.round(
						((deliveredOrders.length -
							lateOrders.filter((order) => order.shippingStatus === 'delivered')
								.length) /
							deliveredOrders.length) *
							10000,
					) / 100
				: 0;
		const completionRate =
			orderRows.length > 0
				? Math.round((completedOrders.length / orderRows.length) * 10000) / 100
				: 0;
		const averageLeadTimeDays =
			orderRows.length > 0
				? Math.round(
						(orderRows.reduce(
							(sum, order) =>
								sum +
								(order.expectedDeliveryAt.getTime() -
									order.createdAt.getTime()) /
									(1000 * 60 * 60 * 24),
							0,
						) /
							orderRows.length) *
							100,
					) / 100
				: 0;

		const currentMonthOrders = orderRows.filter(
			(order) =>
				order.createdAt >= currentMonthStart &&
				order.createdAt <= currentMonthEnd,
		);
		const previousMonthOrders = orderRows.filter(
			(order) =>
				order.createdAt >= previousMonthStart &&
				order.createdAt <= previousMonthEnd,
		);
		const currentMonthRevenue = currentMonthOrders.reduce(
			(sum, order) => sum + getOrderTotal(order.id),
			0,
		);
		const previousMonthRevenue = previousMonthOrders.reduce(
			(sum, order) => sum + getOrderTotal(order.id),
			0,
		);
		const revenueTrend =
			previousMonthRevenue > 0
				? Math.round(
						((currentMonthRevenue - previousMonthRevenue) /
							previousMonthRevenue) *
							10000,
					) / 100
				: currentMonthRevenue > 0
					? 100
					: 0;

		const monthlyRevenueMap = new Map<
			string,
			{
				monthKey: string;
				labelDate: Date;
				revenue: number;
				orders: number;
			}
		>();
		for (let offset = 5; offset >= 0; offset -= 1) {
			const date = new Date(
				now.getFullYear(),
				now.getMonth() - offset,
				1,
				0,
				0,
				0,
				0,
			);
			const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
			monthlyRevenueMap.set(monthKey, {
				monthKey,
				labelDate: date,
				revenue: 0,
				orders: 0,
			});
		}
		for (const order of orderRows) {
			if (order.createdAt < rangeStart) {
				continue;
			}
			const monthKey = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth() + 1}`;
			const month = monthlyRevenueMap.get(monthKey);
			if (!month) {
				continue;
			}
			month.revenue += getOrderTotal(order.id);
			month.orders += 1;
		}

		const ordersByStatus = ORDER_STATUS_VALUES.map((status) => ({
			status,
			count: orderRows.filter((order) => order.status === status).length,
		}));
		const ordersByShippingStatus = SHIPPING_STATUS_VALUES.map((status) => ({
			status,
			count: orderRows.filter((order) => order.shippingStatus === status)
				.length,
		}));
		const paymentSplit = [
			{
				status: 'paid',
				amount: paidRevenue,
			},
			{
				status: 'pending',
				amount: pendingRevenue,
			},
		];

		const customerRevenueMap = new Map<
			string,
			{
				customerId: string;
				customerName: string;
				revenue: number;
				orders: number;
			}
		>();
		for (const order of orderRows) {
			const customerName =
				customerNameById.get(order.customerId) ?? order.customerId;
			const current = customerRevenueMap.get(order.customerId) ?? {
				customerId: order.customerId,
				customerName,
				revenue: 0,
				orders: 0,
			};
			current.revenue += getOrderTotal(order.id);
			current.orders += 1;
			customerRevenueMap.set(order.customerId, current);
		}
		const topCustomers = Array.from(customerRevenueMap.values())
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 6);
		const customerConcentrationPercent =
			totalRevenue > 0 && topCustomers.length > 0
				? Math.round((topCustomers[0].revenue / totalRevenue) * 10000) / 100
				: 0;

		const productUnitsMap = new Map<
			string,
			{
				productId: string;
				units: number;
				revenue: number;
			}
		>();
		for (const item of itemsRows) {
			const current = productUnitsMap.get(item.productId) ?? {
				productId: item.productId,
				units: 0,
				revenue: 0,
			};
			current.units += item.quantity;
			current.revenue += item.quantity * item.price;
			productUnitsMap.set(item.productId, current);
		}
		const topProducts = Array.from(productUnitsMap.values())
			.map((product) => ({
				...product,
				productName:
					productNameById.get(product.productId) ??
					product.productId.slice(0, 8),
			}))
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 8);

		const unassignedOrders = orderRows.filter(
			(order) => order.assignedToUserId === null,
		);
		const assignmentCoverage =
			orderRows.length > 0
				? Math.round(
						((orderRows.length - unassignedOrders.length) / orderRows.length) *
							10000,
					) / 100
				: 0;

		const teamPerformanceMap = new Map<
			string,
			{
				userId: string;
				name: string;
				assignedOrders: number;
				completedOrders: number;
				inProgressOrders: number;
				lateOrders: number;
				revenue: number;
				units: number;
			}
		>();
		for (const order of orderRows) {
			if (!order.assignedToUserId) {
				continue;
			}
			const name =
				userNameById.get(order.assignedToUserId) ??
				order.assignedToUserId.slice(0, 8);
			const current = teamPerformanceMap.get(order.assignedToUserId) ?? {
				userId: order.assignedToUserId,
				name,
				assignedOrders: 0,
				completedOrders: 0,
				inProgressOrders: 0,
				lateOrders: 0,
				revenue: 0,
				units: 0,
			};
			current.assignedOrders += 1;
			current.revenue += getOrderTotal(order.id);
			current.units += getOrderItemUnits(order.id);
			if (order.status === 'completed') {
				current.completedOrders += 1;
			}
			if (order.status === 'in_progress') {
				current.inProgressOrders += 1;
			}
			if (isOrderLate(order.status, order.expectedDeliveryAt)) {
				current.lateOrders += 1;
			}
			teamPerformanceMap.set(order.assignedToUserId, current);
		}
		const teamPerformance = Array.from(teamPerformanceMap.values())
			.map((member) => ({
				...member,
				completionRate:
					member.assignedOrders > 0
						? Math.round(
								(member.completedOrders / member.assignedOrders) * 10000,
							) / 100
						: 0,
			}))
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 8);

		const newestCustomers = await db
			.select({
				id: customers.id,
				name: customers.name,
				createdAt: customers.createdAt,
			})
			.from(customers)
			.where(gte(customers.createdAt, rangeStart))
			.orderBy(desc(customers.createdAt))
			.limit(6);

		const [thisMonthNewCustomersRow] = await db
			.select({
				value: count(),
			})
			.from(customers)
			.where(
				and(
					gte(customers.createdAt, currentMonthStart),
					lte(customers.createdAt, currentMonthEnd),
				),
			);
		const [previousMonthNewCustomersRow] = await db
			.select({
				value: count(),
			})
			.from(customers)
			.where(
				and(
					gte(customers.createdAt, previousMonthStart),
					lte(customers.createdAt, previousMonthEnd),
				),
			);
		const thisMonthNewCustomers = thisMonthNewCustomersRow?.value ?? 0;
		const previousMonthNewCustomers = previousMonthNewCustomersRow?.value ?? 0;
		const customerGrowthRate =
			previousMonthNewCustomers > 0
				? Math.round(
						((thisMonthNewCustomers - previousMonthNewCustomers) /
							previousMonthNewCustomers) *
							10000,
					) / 100
				: thisMonthNewCustomers > 0
					? 100
					: 0;

		const topDelayedOrders = orderRows
			.filter((order) => isOrderLate(order.status, order.expectedDeliveryAt))
			.map((order) => {
				const delayDays = Math.ceil(
					(now.getTime() - order.expectedDeliveryAt.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				return {
					orderId: order.id,
					customerName:
						customerNameById.get(order.customerId) ?? order.customerId,
					assignedTo:
						order.assignedToUserId === null
							? null
							: (userNameById.get(order.assignedToUserId) ??
								order.assignedToUserId.slice(0, 8)),
					expectedDeliveryAt: order.expectedDeliveryAt,
					delayDays,
					total: getOrderTotal(order.id),
					status: order.status,
					shippingStatus: order.shippingStatus,
				};
			})
			.sort((a, b) => b.delayDays - a.delayDays)
			.slice(0, 7);

		const ordersCreatedToday = orderRows.filter((order) => {
			const date = order.createdAt;
			return (
				date.getFullYear() === now.getFullYear() &&
				date.getMonth() === now.getMonth() &&
				date.getDate() === now.getDate()
			);
		}).length;
		const deliveriesDueNextWeek = orderRows.filter((order) => {
			if (order.status === 'completed' || order.status === 'cancelled') {
				return false;
			}
			const diffMs = order.expectedDeliveryAt.getTime() - now.getTime();
			return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
		}).length;

		return {
			summary: {
				totalOrders: orderRows.length,
				totalRevenue,
				paidRevenue,
				pendingRevenue,
				averageTicket,
				paymentCollectionRate,
				completionRate,
				onTimeDeliveryRate,
				averageLeadTimeDays,
				revenueTrend,
				assignmentCoverage,
				ordersCreatedToday,
				deliveriesDueNextWeek,
				lateOrders: lateOrders.length,
				overdueUnpaidOrders: overdueUnpaidOrders.length,
				unassignedOrders: unassignedOrders.length,
				pendingOrders: pendingOrders.length,
				inProgressOrders: inProgressOrders.length,
				completedOrders: completedOrders.length,
				cancelledOrders: cancelledOrders.length,
				totalCustomersWithOrders: customerRevenueMap.size,
				totalProductsSold: productUnitsMap.size,
				customerConcentrationPercent,
				thisMonthNewCustomers,
				customerGrowthRate,
				currentMonthRevenue,
				previousMonthRevenue,
			},
			charts: {
				monthlyRevenue: Array.from(monthlyRevenueMap.values()).map((month) => ({
					monthKey: month.monthKey,
					labelDate: month.labelDate,
					revenue: month.revenue,
					orders: month.orders,
				})),
				ordersByStatus,
				ordersByShippingStatus,
				paymentSplit,
			},
			lists: {
				topCustomers,
				topProducts,
				teamPerformance,
				topDelayedOrders,
				newestCustomers: newestCustomers.map((customer) => ({
					id: customer.id,
					name: customer.name,
					createdAt: customer.createdAt,
				})),
			},
		};
	},
);
