import { getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { products } from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getProducts = procedures.auth.query(async () => {
	const result = await db
		.select({
			...getTableColumns(products),
			hasPendingOrders: sql<boolean>`NOT EXISTS (
				SELECT 1 FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE oi.product_id = products.id AND o.status != 'completed'
			)`,
		})
		.from(products);

	return result;
});
