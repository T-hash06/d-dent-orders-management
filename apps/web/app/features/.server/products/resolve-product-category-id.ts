import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { productCategories } from '@/features/.server/products/product.schema';

const NEW_CATEGORY_PREFIX = '__new__:';

type ResolveProductCategoryIdInput = {
	categoryId: string;
	userId: string;
};

export async function resolveProductCategoryId({
	categoryId,
	userId,
}: ResolveProductCategoryIdInput) {
	const normalizedCategoryId = categoryId.trim();

	if (!normalizedCategoryId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Product category is required.',
		});
	}

	if (normalizedCategoryId.startsWith(NEW_CATEGORY_PREFIX)) {
		const categoryName = normalizedCategoryId
			.slice(NEW_CATEGORY_PREFIX.length)
			.trim();

		if (!categoryName) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Category name is required.',
			});
		}

		const [existing] = await db
			.select({ id: productCategories.id })
			.from(productCategories)
			.where(sql`lower(${productCategories.name}) = lower(${categoryName})`);

		if (existing) {
			return existing.id;
		}

		const [created] = await db
			.insert(productCategories)
			.values({ name: categoryName, createdById: userId, updatedById: userId })
			.returning({ id: productCategories.id });

		if (!created) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to create product category.',
			});
		}

		return created.id;
	}

	const [category] = await db
		.select({ id: productCategories.id })
		.from(productCategories)
		.where(eq(productCategories.id, normalizedCategoryId));

	if (!category) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Product category not found.',
		});
	}

	return category.id;
}
