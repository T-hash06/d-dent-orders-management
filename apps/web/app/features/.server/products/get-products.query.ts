import { db } from '@/features/.server/drizzle/drizzle.connection';
import { products } from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getProducts = procedures.auth.query(async () => {
	return db.select().from(products);
});
