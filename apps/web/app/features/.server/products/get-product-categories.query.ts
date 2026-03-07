import { asc, count, eq, like } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import {
	productCategories,
	products,
} from '@/features/.server/products/product.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

const getProductCategoriesInput = z
	.object({
		search: z.string().trim().optional(),
	})
	.optional();

export const getProductCategories = procedures.auth
	.input(getProductCategoriesInput)
	.query(async ({ input }) => {
		const search = input?.search;

		const categories = await db
			.select({
				id: productCategories.id,
				name: productCategories.name,
				productsCount: count(products.id),
			})
			.from(productCategories)
			.leftJoin(products, eq(products.categoryId, productCategories.id))
			.where(search ? like(productCategories.name, `%${search}%`) : undefined)
			.groupBy(productCategories.id)
			.orderBy(asc(productCategories.name));

		return categories;
	});
