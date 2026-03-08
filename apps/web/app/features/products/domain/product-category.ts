export const NEW_CATEGORY_PREFIX = '__new__:';

export function isNewCategory(categoryId: string): boolean {
	return categoryId.startsWith(NEW_CATEGORY_PREFIX);
}

export function getNewCategoryName(categoryId: string): string {
	return categoryId.slice(NEW_CATEGORY_PREFIX.length);
}

type ProductCategoryInput = {
	category?:
		| {
				id?: string | null;
				name?: string | null;
		  }
		| string
		| null;
	categoryId?: string | null;
};

type ProductCategoryOption = {
	id: string;
	name: string;
};

const normalizeText = (value: string | null | undefined) => value?.trim() ?? '';

const getCategoryName = (category: ProductCategoryInput['category']) => {
	if (typeof category === 'string') {
		return normalizeText(category);
	}

	if (category && typeof category === 'object') {
		return normalizeText(category.name);
	}

	return '';
};

export const getProductCategoryLabel = (product: ProductCategoryInput) => {
	const categoryName = getCategoryName(product.category);
	return categoryName;
};

export const getProductCategoryId = (
	product: ProductCategoryInput,
	categories: ProductCategoryOption[],
) => {
	const categoryId = normalizeText(product.categoryId);
	if (categoryId) {
		return categoryId;
	}

	if (product.category && typeof product.category === 'object') {
		const nestedCategoryId = normalizeText(product.category.id);
		if (nestedCategoryId) {
			return nestedCategoryId;
		}
	}

	const categoryName = getProductCategoryLabel(product).toLocaleLowerCase();
	if (!categoryName) {
		return '';
	}

	return (
		categories.find(
			(category) =>
				normalizeText(category.name).toLocaleLowerCase() === categoryName,
		)?.id ?? ''
	);
};
